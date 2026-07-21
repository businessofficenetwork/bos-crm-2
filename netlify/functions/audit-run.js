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
// visionParse.js is imported lazily further below (only reached when a
// garbled/scanned PDF + ANTHROPIC_API_KEY are both present) — actual
// page rendering needs a more complete canvas polyfill than the stub
// above; see the note in that file.

async function setAuditStatus(supabase, auditId, updates) {
  const { error } = await supabase
    .from('audits')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', auditId)
  if (error) throw error
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
        await parser.destroy()
        await setAuditStatus(supabase, auditId, {
          status: 'manual_review',
          error_detail: 'Text extracted cleanly, but no line items could be parsed from it.',
        })
        return { statusCode: 200, body: JSON.stringify({ status: 'manual_review' }) }
      }

      if (!check.ok) {
        await parser.destroy()
        await setAuditStatus(supabase, auditId, {
          status: 'manual_review',
          error_detail: `Parsed line items failed reconciliation: ${check.reason}`,
        })
        return { statusCode: 200, body: JSON.stringify({ status: 'manual_review' }) }
      }

      await parser.destroy()
      await setAuditStatus(supabase, auditId, {
        status: 'analyzing',
        error_detail: null,
        parsed_estimate: { line_items: items, reconciled_total: check.parsedTotal },
      })
      return { statusCode: 200, body: JSON.stringify({ status: 'analyzing', item_count: items.length }) }
    }

    // quality is 'garbled' or 'empty' — free text parsing can't be
    // trusted. Only attempt AI-powered vision parsing if a key has
    // been configured; otherwise flag for manual entry rather than
    // risk bad financial data.
    if (!process.env.ANTHROPIC_API_KEY) {
      await parser.destroy()
      await setAuditStatus(supabase, auditId, {
        status: 'manual_review',
        error_detail: `PDF text was ${quality} (unreadable). Set ANTHROPIC_API_KEY to enable automatic AI-powered parsing, or enter this estimate's line items manually.`,
      })
      return { statusCode: 200, body: JSON.stringify({ status: 'manual_review' }) }
    }

    const { parseWithVision } = await import('./lib/visionParse.js')
    const items = await parseWithVision(parser)
    await parser.destroy()

    if (!items || items.length === 0) {
      await setAuditStatus(supabase, auditId, {
        status: 'manual_review',
        error_detail: 'AI vision parsing returned no line items.',
      })
      return { statusCode: 200, body: JSON.stringify({ status: 'manual_review' }) }
    }

    await setAuditStatus(supabase, auditId, {
      status: 'analyzing',
      error_detail: null,
      parsed_estimate: { line_items: items, source: 'vision' },
    })
    return { statusCode: 200, body: JSON.stringify({ status: 'analyzing', item_count: items.length }) }
  } catch (err) {
    await setAuditStatus(supabase, auditId, {
      status: 'failed',
      error_detail: err.message || String(err),
    }).catch(() => {})
    return { statusCode: 500, body: JSON.stringify({ error: 'Audit run failed' }) }
  }
}
