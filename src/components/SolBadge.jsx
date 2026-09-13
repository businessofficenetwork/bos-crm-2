import { getSolDisplayStatus } from '../lib/statuteOfLimitations'

const STATUS_CLASS = {
  ok: 'sol-badge-ok',
  approaching: 'sol-badge-approaching',
  urgent: 'sol-badge-urgent',
  expired: 'sol-badge-expired',
}

function SolBadge({ claim, rules }) {
  const { status, label, verified } = getSolDisplayStatus(claim, rules || [])
  const badgeClass = `sol-badge ${status ? STATUS_CLASS[status] : 'sol-badge-none'}`

  return (
    <span className={badgeClass}>
      {label}
      {verified === false && (
        <span className="sol-unverified-icon" title="This state's deadline is a PLACEHOLDER, not yet verified by an attorney">
          {' '}
          ⚠ unverified
        </span>
      )}
    </span>
  )
}

export default SolBadge
