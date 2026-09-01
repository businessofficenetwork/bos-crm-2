import { matchOpRule, getOpDisplayStatus } from '../lib/opThreshold'

function badgeClass(status) {
  if (status.overridden) return 'op-badge op-badge-overridden'
  if (status.displayQualifies === null || status.displayQualifies === undefined) return 'op-badge op-badge-none'
  return status.displayQualifies ? 'op-badge op-badge-qualifies' : 'op-badge op-badge-does-not-qualify'
}

function OpBadge({ claim, rules }) {
  const rule = matchOpRule(rules || [], { carrierName: claim.carrier, state: claim.state })
  const status = getOpDisplayStatus({
    tradesInvolved: claim.trades_involved,
    opOverride: claim.op_override,
    rule,
  })

  return <span className={badgeClass(status)}>{status.label}</span>
}

export default OpBadge
