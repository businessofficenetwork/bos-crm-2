import { createClient } from '@supabase/supabase-js'
import { setAuditStatus, runFindingsPhase } from './lib/auditPipeline.js'

// Lets a stuck audit (manual_review/failed - usually because the PDF's
// text couldn't be read, or Claude wasn't available) get real line-item
// data anyway, typed in by hand. Once saved, it runs through the exact
// same findings step as an automatically-parsed estimate - if that
// still can't run (e.g. still no Anthropic credits), the line items
// stay saved and the audit goes back to manual_review with a plain
// explanation, rather than losing the work that was just typed in.
function json(statusCode, body) {
  return { statusCode, body: JSON.stringify(body) }
}

export const handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON' })
  }

  const auditId = payload.audit_id
  const lineItems = payload.line_items
  if (!auditId || !Array.isArray(lineItems) || lineItems.length === 0) {
    return json(400, { error: 'audit_id and at least one line item are required' })
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

  const { data: audit, error: fetchError } = await supabase
    .from('audits')
    .select('*')
    .eq('id', auditId)
    .single()
  if (fetchError || !audit) {
    return json(404, { error: 'Audit not found' })
  }

  const reconciledTotal = lineItems.reduce((sum, item) => sum + (Number(item.rcv) || 0), 0)
  const parsedEstimate = { line_items: lineItems, reconciled_total: reconciledTotal, source: 'manual' }

  await setAuditStatus(supabase, auditId, {
    status: 'analyzing',
    error_detail: null,
    parsed_estimate: parsedEstimate,
  })

  try {
    const result = await runFindingsPhase(supabase, auditId, audit, parsedEstimate)
    return json(200, result)
  } catch (err) {
    await setAuditStatus(supabase, auditId, {
      status: 'manual_review',
      error_detail: err.message || String(err),
    })
    return json(200, { status: 'manual_review', error: err.message || String(err) })
  }
}
