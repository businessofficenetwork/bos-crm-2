// Statute of limitations deadline/status logic - pure, no Supabase/UI
// dependency so it can be unit-tested in isolation.

export const URGENT_DAYS = 30
export const APPROACHING_DAYS = 90

// Picks the rule for a claim's state (first matching claim_type if given,
// otherwise the first rule for that state - most states only need one row).
export function matchSolRule(rules, { state, claimType } = {}) {
  const st = (state || '').trim().toUpperCase()
  if (!st) return null

  if (claimType) {
    const exact = rules.find(
      (r) => r.state.trim().toUpperCase() === st && r.claim_type === claimType
    )
    if (exact) return exact
  }

  return rules.find((r) => r.state.trim().toUpperCase() === st) || null
}

// trigger_event picks which claim date starts the clock. Only date_of_loss
// is wired up today (the only trigger date this app currently collects) -
// any other trigger_event value means the rule can't be computed yet.
export function computeSolDeadline(claim, rule) {
  if (!rule) return null
  if (rule.trigger_event !== 'date_of_loss') return null
  if (!claim.date_of_loss) return null

  const trigger = new Date(claim.date_of_loss + 'T00:00:00')
  trigger.setMonth(trigger.getMonth() + rule.deadline_months)
  return trigger.toISOString().slice(0, 10)
}

export function computeSolStatus(deadline, today = new Date().toISOString().slice(0, 10)) {
  if (!deadline) return null
  if (deadline < today) return 'expired'

  const deadlineDate = new Date(deadline + 'T00:00:00')
  const todayDate = new Date(today + 'T00:00:00')
  const daysLeft = Math.round((deadlineDate - todayDate) / (1000 * 60 * 60 * 24))

  if (daysLeft <= URGENT_DAYS) return 'urgent'
  if (daysLeft <= APPROACHING_DAYS) return 'approaching'
  return 'ok'
}

export function daysUntil(deadline, today = new Date().toISOString().slice(0, 10)) {
  if (!deadline) return null
  const deadlineDate = new Date(deadline + 'T00:00:00')
  const todayDate = new Date(today + 'T00:00:00')
  return Math.round((deadlineDate - todayDate) / (1000 * 60 * 60 * 24))
}

// Everything the UI needs in one call: the matched rule, computed
// deadline/status, and a ready-to-render label. `today` defaults to the
// real date but can be overridden for deterministic tests.
export function getSolDisplayStatus(claim, rules, today = new Date().toISOString().slice(0, 10)) {
  const rule = matchSolRule(rules || [], { state: claim.state })
  const deadline = computeSolDeadline(claim, rule)
  const status = computeSolStatus(deadline, today)
  const days = daysUntil(deadline, today)

  let label = 'No Rule'
  if (status === 'expired') label = `Expired ${Math.abs(days)} days ago`
  else if (status) label = `${days} days to file`

  return { rule, deadline, status, days, verified: rule ? !!rule.verified : null, label }
}
