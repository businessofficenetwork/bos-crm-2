// Plain-SQL retrieval for the daily digest (BON_BUILD_SEQUENCE.md Phase
// C step 1) - no AI needed here, just gathering what actually changed
// or needs attention. Written against the real schema as it exists
// today (supplements.stage's real 10 values, no qa_review/fee_charged/
// recovered_amount columns - those were aspirational Phase B/B6
// additions that were never built), not the planning doc's aspirational
// state machine.

function daysAgoISO(days) {
  return new Date(Date.now() - days * 86400000).toISOString()
}
function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

export async function gatherDigestData(supabase) {
  const since24h = daysAgoISO(1)
  const since48h = daysAgoISO(2)
  const since7d = daysAgoISO(7).slice(0, 10)
  const since30d = daysAgoISO(30)
  const since30dDate = since30d.slice(0, 10)
  const today = todayDate()

  const [
    { data: newLeads },
    { data: staleLeads },
    { data: findingsAwaitingReview },
    { data: submittedAging },
    { data: approvedNotInvoiced },
    { data: dueReminders },
    { data: overdueActions },
    { count: audits30dCount },
    { count: submitted30dCount },
    { data: recoveryAudits30d },
    { data: invoicedRecent },
  ] = await Promise.all([
    supabase.from('leads').select('id, source').gte('created_at', since24h),
    supabase
      .from('leads')
      .select('id, name, company, status, created_at')
      .in('status', ['new', 'contacted'])
      .lt('created_at', since48h),
    supabase
      .from('audits')
      .select('id, claim_id, est_total_recovery, claim:claims(property_address, claim_number)')
      .eq('status', 'findings_ready')
      .is('reviewed_by', null),
    supabase
      .from('supplements')
      .select('id, claim_id, submitted_date, claim:claims(property_address, claim_number)')
      .eq('stage', 'Submitted')
      .lt('submitted_date', since7d),
    supabase
      .from('supplements')
      .select('id, claim_id, supplement_approved, claim:claims(property_address, claim_number)')
      .eq('stage', 'Approved')
      .is('invoiced_date', null),
    supabase.from('reminders').select('id, description, due_date').eq('due_date', today).eq('completed', false),
    supabase
      .from('actions')
      .select('id, description, due_date, supplement:supplements(claim:claims(property_address, claim_number))')
      .lt('due_date', today)
      .eq('completed', false),
    supabase.from('audits').select('id', { count: 'exact', head: true }).gte('created_at', since30d),
    supabase
      .from('supplements')
      .select('id', { count: 'exact', head: true })
      .gte('submitted_date', since30dDate),
    supabase
      .from('audits')
      .select('est_total_recovery')
      .eq('status', 'findings_ready')
      .gte('updated_at', since30d),
    supabase
      .from('supplements')
      .select('bon_fee')
      .gte('invoiced_date', since30dDate)
      .not('bon_fee', 'is', null),
  ])

  const leadsBySource = (newLeads || []).reduce((acc, l) => {
    acc[l.source] = (acc[l.source] || 0) + 1
    return acc
  }, {})

  return {
    newLeadsCount: newLeads?.length || 0,
    leadsBySource,
    staleLeads: staleLeads || [],
    findingsAwaitingReview: findingsAwaitingReview || [],
    submittedAging: submittedAging || [],
    approvedNotInvoiced: approvedNotInvoiced || [],
    dueReminders: dueReminders || [],
    overdueActions: overdueActions || [],
    rolling30d: {
      auditsRun: audits30dCount ?? 0,
      supplementsSubmitted: submitted30dCount ?? 0,
      totalEstRecovery: (recoveryAudits30d || []).reduce((s, a) => s + (Number(a.est_total_recovery) || 0), 0),
      totalFeesInvoiced: (invoicedRecent || []).reduce((s, r) => s + (Number(r.bon_fee) || 0), 0),
    },
  }
}
