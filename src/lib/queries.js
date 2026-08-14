import { supabase } from './supabase'

export async function listContractors(search = '') {
  let query = supabase.from('contractors').select('*').order('name', { ascending: true })

  const term = search.trim()
  if (term) {
    query = query.or(
      `name.ilike.%${term}%,contact_name.ilike.%${term}%,email.ilike.%${term}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createContractor(contractor) {
  const { data, error } = await supabase
    .from('contractors')
    .insert(contractor)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateContractor(id, updates) {
  const { data, error } = await supabase
    .from('contractors')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function listClaims(search = '') {
  let query = supabase
    .from('claims')
    .select('*, contractor:contractors(id, name), audits(parsed_estimate)')
    .order('created_at', { ascending: false })

  const term = search.trim()
  if (term) {
    query = query.or(
      `property_address.ilike.%${term}%,homeowner_name.ilike.%${term}%,claim_number.ilike.%${term}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createClaim(claim) {
  const { data, error } = await supabase.from('claims').insert(claim).select().single()
  if (error) throw error
  return data
}

export async function createClaimWithIntake(claim) {
  const newClaim = await createClaim(claim)
  const today = new Date().toISOString().slice(0, 10)
  await createSupplement({ claim_id: newClaim.id, stage: 'Intake', intake_date: today })
  return newClaim
}

export async function updateClaim(id, updates) {
  const { data, error } = await supabase
    .from('claims')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function listSupplements(search = '') {
  let query = supabase
    .from('supplements')
    .select(
      '*, claim:claims!inner(id, property_address, homeowner_name, claim_number, contractor:contractors(id, name))'
    )
    .order('created_at', { ascending: false })

  const term = search.trim()
  if (term) {
    query = query.or(
      `property_address.ilike.%${term}%,homeowner_name.ilike.%${term}%,claim_number.ilike.%${term}%`,
      { foreignTable: 'claims' }
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createSupplement(supplement) {
  const { data, error } = await supabase.from('supplements').insert(supplement).select().single()
  if (error) throw error
  return data
}

export async function updateSupplement(id, updates) {
  const { data, error } = await supabase
    .from('supplements')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function listActions(supplementId) {
  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .eq('supplement_id', supplementId)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (error) throw error
  return data
}

export async function createAction(action) {
  const { data, error } = await supabase.from('actions').insert(action).select().single()
  if (error) throw error
  return data
}

export async function updateAction(id, updates) {
  const { data, error } = await supabase
    .from('actions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getPipelineSummary() {
  const { data, error } = await supabase
    .from('supplements')
    .select('stage, supplement_requested, supplement_approved')

  if (error) throw error
  return data
}

// Fees collected, grouped by the month a supplement was closed out
// (per Close Out Supplement / closed_date) - most recent month first.
export async function getMonthlyFeesCollected() {
  const { data, error } = await supabase
    .from('supplements')
    .select('bon_fee, closed_date')
    .eq('stage', 'Closed')
    .not('closed_date', 'is', null)

  if (error) throw error

  const byMonth = {}
  for (const s of data || []) {
    const month = s.closed_date.slice(0, 7) // 'YYYY-MM'
    byMonth[month] = (byMonth[month] || 0) + (Number(s.bon_fee) || 0)
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([month, total]) => ({
      month,
      label: new Date(month + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      total,
    }))
}

// One gathering call for the dashboard's summary cards - counts only,
// not full row detail, so each card links through to its own page
// (Contractors/Jobs/Pipeline/Leads/Audits) for the real list.
export async function getDashboardStats() {
  const [
    { data: contractors, error: contractorsError },
    { data: claims, error: claimsError },
    { data: supplements, error: supplementsError },
    { data: leads, error: leadsError },
    { data: audits, error: auditsError },
    { data: agingActions, error: agingError },
  ] = await Promise.all([
    supabase.from('contractors').select('id, status'),
    supabase.from('claims').select('id'),
    supabase.from('supplements').select('id, stage, supplement_requested, supplement_approved'),
    supabase.from('leads').select('id, status'),
    supabase
      .from('audits')
      .select('id, status, reviewed_by, est_total_recovery')
      .eq('status', 'findings_ready'),
    supabase
      .from('actions')
      .select('id, description')
      .eq('completed', false)
      .or('description.ilike.Follow up:%,description.ilike.Invoice reminder:%,description.ilike.Collections:%'),
  ])

  const firstError = contractorsError || claimsError || supplementsError || leadsError || auditsError || agingError
  if (firstError) throw firstError

  const activeSupplements = (supplements || []).filter((s) => s.stage !== 'Closed')

  return {
    contractors: {
      total: contractors?.length || 0,
      active: (contractors || []).filter((c) => c.status === 'active').length,
      prospect: (contractors || []).filter((c) => c.status === 'prospect').length,
    },
    claims: {
      total: claims?.length || 0,
    },
    pipeline: {
      activeCount: activeSupplements.length,
      requested: activeSupplements.reduce((sum, s) => sum + (Number(s.supplement_requested) || 0), 0),
      approved: activeSupplements.reduce((sum, s) => sum + (Number(s.supplement_approved) || 0), 0),
    },
    leads: {
      total: leads?.length || 0,
      active: (leads || []).filter((l) => ['new', 'contacted', 'qualified'].includes(l.status)).length,
      new: (leads || []).filter((l) => l.status === 'new').length,
    },
    audits: {
      awaitingReview: (audits || []).filter((a) => !a.reviewed_by).length,
      pendingRecovery: (audits || []).reduce((sum, a) => sum + (Number(a.est_total_recovery) || 0), 0),
    },
    aging: {
      count: agingActions?.length || 0,
    },
  }
}

export async function listOverdueActions() {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('actions')
    .select(
      '*, supplement:supplements(id, stage, claim:claims(property_address, claim_number, contractor:contractors(name)))'
    )
    .eq('completed', false)
    .lt('due_date', today)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data
}

// Every incomplete action across all supplements, earliest due date
// first — used to show each Kanban card's next-action due date
// without a separate query per card.
export async function listAllPendingActions() {
  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .eq('completed', false)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (error) throw error
  return data
}

export async function countOverdueActions() {
  const today = new Date().toISOString().slice(0, 10)
  const { count, error } = await supabase
    .from('actions')
    .select('id', { count: 'exact', head: true })
    .eq('completed', false)
    .lt('due_date', today)

  if (error) throw error
  return count ?? 0
}

export async function listReminders() {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .order('completed', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })

  if (error) throw error
  return data
}

export async function createReminder(reminder) {
  const { data, error } = await supabase.from('reminders').insert(reminder).select().single()
  if (error) throw error
  return data
}

export async function updateReminder(id, updates) {
  const { data, error } = await supabase
    .from('reminders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function countOverdueReminders() {
  const today = new Date().toISOString().slice(0, 10)
  const { count, error } = await supabase
    .from('reminders')
    .select('id', { count: 'exact', head: true })
    .eq('completed', false)
    .lt('due_date', today)

  if (error) throw error
  return count ?? 0
}

export async function listLeads(search = '') {
  let query = supabase.from('leads').select('*').order('created_at', { ascending: false })

  const term = search.trim()
  if (term) {
    query = query.or(`name.ilike.%${term}%,company.ilike.%${term}%,email.ilike.%${term}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createLead(lead) {
  const { data, error } = await supabase.from('leads').insert(lead).select().single()
  if (error) throw error
  return data
}

export async function updateLead(id, updates) {
  const { data, error } = await supabase
    .from('leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function listJobComments(claimId) {
  const { data, error } = await supabase
    .from('job_comments')
    .select('*')
    .eq('claim_id', claimId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function createJobComment(comment) {
  const { data, error } = await supabase.from('job_comments').insert(comment).select().single()
  if (error) throw error
  return data
}

export async function listMentions() {
  const { data, error } = await supabase
    .from('job_comments')
    .select('*, claim:claims(id, property_address, claim_number)')
    .ilike('body', '%@%')
    .eq('read', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function markCommentRead(id) {
  const { error } = await supabase.from('job_comments').update({ read: true }).eq('id', id)
  if (error) throw error
}

export async function listRequestedItems(supplementId) {
  const { data, error } = await supabase
    .from('supplement_requested_items')
    .select('*')
    .eq('supplement_id', supplementId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function createRequestedItem(item) {
  const { data, error } = await supabase
    .from('supplement_requested_items')
    .insert(item)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function setRequestedItemVerified(id, verified) {
  const { error } = await supabase
    .from('supplement_requested_items')
    .update({ verified, verified_at: verified ? new Date().toISOString() : null })
    .eq('id', id)

  if (error) throw error
}

export async function deleteRequestedItem(id) {
  const { error } = await supabase.from('supplement_requested_items').delete().eq('id', id)
  if (error) throw error
}

export async function listSupplementActivity(supplementId) {
  const { data, error } = await supabase
    .from('supplement_activity')
    .select('*')
    .eq('supplement_id', supplementId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function listAudits() {
  const { data, error } = await supabase
    .from('audits')
    .select(
      '*, claim:claims(id, property_address, claim_number, carrier, contractor:contractors(name))'
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function uploadAuditPdf(claimId, file) {
  const path = `${claimId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const { error } = await supabase.storage.from('claim-docs').upload(path, file)
  if (error) throw error
  return path
}

// Same upload as uploadAuditPdf but for however many photo files were
// selected — used by rules that need roof/property photos (e.g. ridge
// cap material verification) rather than just the estimate text.
export async function uploadAuditPhotos(claimId, files) {
  const paths = []
  for (const file of files) {
    const path = `${claimId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error } = await supabase.storage.from('claim-docs').upload(path, file)
    if (error) throw error
    paths.push(path)
  }
  return paths
}

export async function createAudit(audit) {
  const { data, error } = await supabase.from('audits').insert(audit).select().single()
  if (error) throw error
  return data
}

// Fills in whichever of the three document paths an audit was
// missing (e.g. a contractor's follow-up email supplied the
// measurement report after the portal submission only had the
// estimate) - only overwrites fields actually passed in.
export async function updateAuditDocuments(auditId, updates) {
  const { data, error } = await supabase.from('audits').update(updates).eq('id', auditId).select().single()
  if (error) throw error
  return data
}

// audit-run-background.js is a Netlify background function (name suffix is
// what triggers that) — it can run up to 15 minutes, well past the ~10-26s
// limit on regular functions that the AI parsing path (a real OCR + LLM
// call on scanned PDFs) was timing out against. Netlify responds 202 the
// instant it's queued, with no result body — callers here don't wait for a
// parsed result, they trigger and rely on AuditBoard's polling to reflect
// the eventual status.
export async function runAudit(auditId) {
  const res = await fetch('/.netlify/functions/audit-run-background', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audit_id: auditId }),
  })
  if (!res.ok) throw new Error('Audit run failed to start')
}

// findings is the whole array, rewritten with one entry's review_status
// changed — jsonb has no per-element update, so the caller sends the
// full array back. Used by the accept/reject toggles in AuditModal.
export async function updateAuditFindings(auditId, findings) {
  const { error } = await supabase.from('audits').update({ findings }).eq('id', auditId)
  if (error) throw error
}

export async function markAuditReviewed(auditId, reviewedBy) {
  const { error } = await supabase
    .from('audits')
    .update({ reviewed_by: reviewedBy })
    .eq('id', auditId)
  if (error) throw error
}

// Drafts a justification email from an audit's accepted findings,
// citing the SUPP/KB knowledge base. Returns { subject, body } text -
// never sent, just a draft for review (see draft-findings-email.js).
export async function draftFindingsEmail(auditId) {
  const res = await fetch('/.netlify/functions/draft-findings-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audit_id: auditId }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Could not draft email')
  return data
}

export async function createSupplementActivity(entry) {
  const { data, error } = await supabase
    .from('supplement_activity')
    .insert(entry)
    .select()
    .single()

  if (error) throw error
  return data
}
