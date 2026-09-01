// O&P threshold rule matching - pure logic, no Supabase/UI dependency so
// it can be unit-tested in isolation from the rest of the app.

export const TRADE_OPTIONS = [
  'roofing',
  'gutters',
  'siding',
  'drywall',
  'paint',
  'decking',
  'flooring',
  'HVAC',
  'electrical',
  'plumbing',
  'other',
]

// Picks the most specific applicable rule: carrier+state, then state-only,
// then the global default (carrier_name and state both null).
export function matchOpRule(rules, { carrierName, state } = {}) {
  const carrier = (carrierName || '').trim().toLowerCase()
  const st = (state || '').trim().toUpperCase()

  const carrierAndState = rules.find(
    (r) => r.carrier_name && r.carrier_name.trim().toLowerCase() === carrier &&
      r.state && r.state.trim().toUpperCase() === st
  )
  if (carrierAndState) return carrierAndState

  const stateOnly = rules.find(
    (r) => !r.carrier_name && r.state && r.state.trim().toUpperCase() === st
  )
  if (stateOnly) return stateOnly

  const global = rules.find((r) => !r.carrier_name && !r.state)
  return global || null
}

export function computeOpQualifies(tradesInvolved, rule) {
  if (!rule) return null
  return (tradesInvolved || []).length >= rule.min_trades_required
}

// Returns what the UI should show: the override wins when set, but the
// computed value stays visible so a discrepancy is never hidden.
export function getOpDisplayStatus({ tradesInvolved, opOverride, rule }) {
  const computedQualifies = computeOpQualifies(tradesInvolved, rule)
  const displayQualifies = opOverride === true || opOverride === false ? opOverride : computedQualifies
  const overridden = opOverride === true || opOverride === false

  let label
  if (displayQualifies === null || displayQualifies === undefined) {
    label = 'No Rule'
  } else if (overridden) {
    label = 'Manually Overridden'
  } else {
    label = displayQualifies ? 'O&P Qualifies' : 'O&P Does Not Qualify'
  }

  return { computedQualifies, displayQualifies, overridden, label }
}
