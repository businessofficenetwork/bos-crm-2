import { createClient } from '@supabase/supabase-js'
import { fetchKnowledgeBase } from './lib/knowledgeBase.js'
import { draftFindingsEmail } from './lib/draftFindingsEmail.js'

// Drafts a justification email from an audit's ACCEPTED findings only
// - findings still pending/rejected review aren't ready to be put in
// front of a carrier. Returns the draft as text; nothing is sent.
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
    .select('findings, claim:claims(property_address, claim_number, carrier)')
    .eq('id', auditId)
    .single()
  if (fetchError || !audit) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Audit not found' }) }
  }

  const accepted = (audit.findings || []).filter((f) => f.review_status === 'accepted')
  if (accepted.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No accepted findings to draft from' }) }
  }

  try {
    const knowledgeBase = await fetchKnowledgeBase()
    const draft = await draftFindingsEmail({ findings: accepted, claim: audit.claim, knowledgeBase })
    return { statusCode: 200, body: JSON.stringify(draft) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) }
  }
}
