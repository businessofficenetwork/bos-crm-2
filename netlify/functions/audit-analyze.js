import { createClient } from '@supabase/supabase-js'
import { runTier2Analysis } from './lib/analyzeFindings.js'

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

  if (audit.status !== 'analyzing') {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Audit status is '${audit.status}', expected 'analyzing'.` }),
    }
  }

  const lineItems = audit.parsed_estimate?.line_items
  if (!lineItems || lineItems.length === 0) {
    await setAuditStatus(supabase, auditId, {
      status: 'manual_review',
      error_detail: 'No parsed line items on this audit to run Tier 2 analysis against.',
    })
    return { statusCode: 200, body: JSON.stringify({ status: 'manual_review' }) }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    await setAuditStatus(supabase, auditId, {
      status: 'manual_review',
      error_detail: 'Tier 2 checklist audit requires ANTHROPIC_API_KEY (rule-matching needs judgment, not just arithmetic). Set it to enable automatic analysis, or review the checklist manually.',
    })
    return { statusCode: 200, body: JSON.stringify({ status: 'manual_review' }) }
  }

  try {
    const { data: rules, error: rulesError } = await supabase
      .from('audit_rules')
      .select('*')
      .eq('active', true)
    if (rulesError) throw rulesError

    const findings = await runTier2Analysis({
      rules: rules || [],
      carrier: audit.carrier,
      lineItems,
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    await setAuditStatus(supabase, auditId, {
      status: 'findings_ready',
      error_detail: null,
      findings,
    })
    return { statusCode: 200, body: JSON.stringify({ status: 'findings_ready', finding_count: findings.length }) }
  } catch (err) {
    await setAuditStatus(supabase, auditId, {
      status: 'failed',
      error_detail: err.message || String(err),
    }).catch(() => {})
    return { statusCode: 500, body: JSON.stringify({ error: 'Audit analysis failed' }) }
  }
}
