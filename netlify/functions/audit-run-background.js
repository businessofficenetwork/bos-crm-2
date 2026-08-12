import { createClient } from '@supabase/supabase-js'
import { classifyText, parseLineItems, reconcile } from './lib/parseEstimate.js'

// pdf-parse's module graph references browser-only globals (DOMMatrix
// etc., used by pdf.js's rendering/canvas code) at load time, even when
// only plain text extraction is used and no actual rendering happens.
// The bundler transpiles this file to CJS, which doesn't support
// top-level await, so both the polyfill and the dynamic import of
// pdf-parse happen inside the handler instead (regular await inside an
// async function is fine).
let PDFParse
async function loadPdfParse() {
  if (!PDFParse) {
    if (typeof globalThis.DOMMatrix === 'undefined') {
      globalThis.DOMMatrix = class DOMMatrix {}
    }
    ;({ PDFParse } = await import('pdf-parse'))

    // pdf-parse bundles its own internal copy of pdf.js, with its own
    // worker config — separate from the standalone pdfjs-dist package,
    // so that one has to be configured via PDFParse.setWorker(), not
    // pdfjs-dist's GlobalWorkerOptions. The worker script's default
    // location is resolved relative to the running file, which breaks
    // once Netlify's bundler restructures everything into one bundle,
    // so it's pointed at the real file directly. `import.meta.url`
    // isn't reliable here since this file gets transpiled to CJS
    // output, so this uses process.cwd() (the project root under
    // netlify dev) instead of a path relative to this module.
    const path = await import('path')
    const url = await import('url')
    const workerPath = path.join(
      process.cwd(),
      'node_modules',
      'pdf-parse',
      'dist',
      'pdf-parse',
      'cjs',
      'pdf.worker.mjs'
    )
    PDFParse.setWorker(url.pathToFileURL(workerPath).href)
  }
  return PDFParse
}
// aiParse.js is imported lazily further below (only reached when a
// garbled/scanned PDF + ANTHROPIC_API_KEY are both present) — it sends
// the PDF straight to Claude as a document, no page rendering needed.

// pdf-parse's internal cleanup occasionally throws
// "The argument 'filename' must be a file URL object..." from its own
// worker-teardown code (a bundling/Node-version-specific pdf.js quirk,
// not something this app controls) — the parse result itself is
// already complete by the time destroy() runs, so a cleanup failure
// here must never take down an otherwise-successful response.
async function safeDestroy(parser) {
  try {
    await parser.destroy()
  } catch (err) {
    console.warn('pdf-parse cleanup (destroy) failed, ignoring:', err.message || err)
  }
}

async function setAuditStatus(supabase, auditId, updates) {
  const { error } = await supabase
    .from('audits')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', auditId)
  if (error) throw error
}

// Runs once parsing succeeds (from either the free-text or AI path) and
// a parsed_estimate exists. Loads active audit_rules — carrier_filter
// null means "all carriers", otherwise only rules whose list includes
// the claim's carrier — downloads the measurement report/photos when
// present, and lets findingsRulePass judge each rule. A throw here
// propagates to the handler's outer catch, which sets status 'failed';
// the findings-ready email is best-effort and never fails the run.
async function runFindingsPhase(supabase, auditId, audit, parsedEstimate) {
  const { data: claim } = await supabase
    .from('claims')
    .select('property_address, carrier')
    .eq('id', audit.claim_id)
    .single()

  const { data: allRules } = await supabase
    .from('audit_rules')
    .select('id, tier, category, carrier_filter, detection_prompt')
    .eq('active', true)

  const carrier = claim?.carrier
  const rules = (allRules || []).filter(
    (r) => !r.carrier_filter || (carrier && r.carrier_filter.includes(carrier))
  )

  let measurementReport = null
  if (audit.measurement_report_path) {
    const { data: blob } = await supabase.storage
      .from('claim-docs')
      .download(audit.measurement_report_path)
    if (blob) measurementReport = { buffer: Buffer.from(await blob.arrayBuffer()) }
  }

  const photos = []
  for (const path of audit.photos_paths || []) {
    const { data: blob } = await supabase.storage.from('claim-docs').download(path)
    if (blob) photos.push({ path, buffer: Buffer.from(await blob.arrayBuffer()) })
  }

  const { runFindingsRulePass } = await import('./lib/findingsRulePass.js')
  const { findings, estTotalRecovery } = await runFindingsRulePass({
    rules,
    parsedEstimate,
    measurementReport,
    photos,
  })

  await setAuditStatus(supabase, auditId, {
    status: 'findings_ready',
    findings,
    est_total_recovery: estTotalRecovery,
  })

  const { notifyFindingsReady } = await import('./lib/notifyFindings.js')
  await notifyFindingsReady({
    auditId,
    address: claim?.property_address,
    estTotalRecovery,
    findingsCount: findings.length,
  }).catch((err) => console.warn('Findings-ready notify failed:', err.message || err))

  return { status: 'findings_ready', item_count: parsedEstimate.line_items.length, findings_count: findings.length }
}

export const handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const auditId = payload.audit_id
  if (!auditId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'audit_id is required' }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

  const { data: audit, error: fetchError } = await supabase
    .from('audits')
    .select('*')
    .eq('id', auditId)
    .single()

  if (fetchError || !audit) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Audit not found' }) }
  }

  if (!audit.estimate_pdf_path) {
    await setAuditStatus(supabase, auditId, {
      status: 'failed',
      error_detail: 'Audit has no estimate_pdf_path set.',
    })
    return { statusCode: 400, body: JSON.stringify({ error: 'No estimate PDF on this audit' }) }
  }

  try {
    await setAuditStatus(supabase, auditId, { status: 'parsing', error_detail: null })

    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('claim-docs')
      .download(audit.estimate_pdf_path)
    if (downloadError) throw downloadError

    const pdfBuffer = Buffer.from(await fileBlob.arrayBuffer())
    const PDFParseClass = await loadPdfParse()
    const parser = new PDFParseClass({ data: pdfBuffer })
    const textResult = await parser.getText()

    const quality = classifyText(textResult.text)

    if (quality === 'clean') {
      const items = parseLineItems(textResult.text)
      const check = reconcile(textResult.text, items)

      if (items.length === 0) {
        await safeDestroy(parser)
        await setAuditStatus(supabase, auditId, {
          status: 'manual_review',
          error_detail: 'Text extracted cleanly, but no line items could be parsed from it.',
        })
        return { statusCode: 200, body: JSON.stringify({ status: 'manual_review' }) }
      }

      if (!check.ok) {
        await safeDestroy(parser)
        await setAuditStatus(supabase, auditId, {
          status: 'manual_review',
          error_detail: `Parsed line items failed reconciliation: ${check.reason}`,
        })
        return { statusCode: 200, body: JSON.stringify({ status: 'manual_review' }) }
      }

      await safeDestroy(parser)
      const parsedEstimate = { line_items: items, reconciled_total: check.parsedTotal }
      await setAuditStatus(supabase, auditId, {
        status: 'analyzing',
        error_detail: null,
        parsed_estimate: parsedEstimate,
      })
      const result = await runFindingsPhase(supabase, auditId, audit, parsedEstimate)
      return { statusCode: 200, body: JSON.stringify(result) }
    }

    // quality is 'garbled' or 'empty' — free text parsing can't be
    // trusted. Only attempt AI-powered parsing if a key has been
    // configured; otherwise flag for manual entry rather than risk bad
    // financial data.
    if (!process.env.ANTHROPIC_API_KEY) {
      await safeDestroy(parser)
      await setAuditStatus(supabase, auditId, {
        status: 'manual_review',
        error_detail: `PDF text was ${quality} (unreadable). Set ANTHROPIC_API_KEY to enable automatic AI-powered parsing, or enter this estimate's line items manually.`,
      })
      return { statusCode: 200, body: JSON.stringify({ status: 'manual_review' }) }
    }

    await safeDestroy(parser)

    // Sends the PDF's own bytes to Claude — no rendering, so a failure
    // here means a real problem (bad key, oversized file, API error),
    // not an environment quirk. Still degrades to manual_review rather
    // than crashing the request, matching every other unreadable case.
    let items
    try {
      const { parseWithClaude } = await import('./lib/aiParse.js')
      items = await parseWithClaude(pdfBuffer)
    } catch (aiErr) {
      await setAuditStatus(supabase, auditId, {
        status: 'manual_review',
        error_detail: `AI parsing failed: ${aiErr.message || aiErr}`,
      })
      return { statusCode: 200, body: JSON.stringify({ status: 'manual_review' }) }
    }

    if (!items || items.length === 0) {
      await setAuditStatus(supabase, auditId, {
        status: 'manual_review',
        error_detail: 'AI parsing returned no line items.',
      })
      return { statusCode: 200, body: JSON.stringify({ status: 'manual_review' }) }
    }

    const parsedEstimate = { line_items: items, source: 'ai' }
    await setAuditStatus(supabase, auditId, {
      status: 'analyzing',
      error_detail: null,
      parsed_estimate: parsedEstimate,
    })
    const result = await runFindingsPhase(supabase, auditId, audit, parsedEstimate)
    return { statusCode: 200, body: JSON.stringify(result) }
  } catch (err) {
    await setAuditStatus(supabase, auditId, {
      status: 'failed',
      error_detail: err.message || String(err),
    }).catch(() => {})
    return { statusCode: 500, body: JSON.stringify({ error: 'Audit run failed' }) }
  }
}
