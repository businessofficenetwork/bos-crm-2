import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listClaimsWithDeadlines, listSolRules } from '../lib/queries'
import { getSolDisplayStatus } from '../lib/statuteOfLimitations'
import SolBadge from './SolBadge'

const URGENT_APPROACHING = ['urgent', 'approaching', 'expired']

function DeadlinesWidget() {
  const navigate = useNavigate()
  const [claims, setClaims] = useState([])
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([listClaimsWithDeadlines(), listSolRules()])
      .then(([claimsData, rulesData]) => {
        setClaims(claimsData)
        setRules(rulesData)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const withStatus = claims
    .map((c) => ({ claim: c, sol: getSolDisplayStatus(c, rules) }))
    .filter((row) => row.sol.deadline)
    .filter((row) => showAll || URGENT_APPROACHING.includes(row.sol.status))
    .sort((a, b) => a.sol.deadline.localeCompare(b.sol.deadline))

  return (
    <>
      <div className="contractors-header">
        <h2>Deadlines</h2>
        <label className="form-hint">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />{' '}
          Show all, not just urgent/approaching
        </label>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && (
        <table className="contractors-table">
          <thead>
            <tr>
              <th>Claim</th>
              <th>Contractor</th>
              <th>State</th>
              <th>Deadline</th>
            </tr>
          </thead>
          <tbody>
            {withStatus.map(({ claim }) => (
              <tr key={claim.id}>
                <td>
                  <button
                    type="button"
                    className="row-link"
                    onClick={() => navigate(`/jobs?open=${claim.id}`)}
                  >
                    {claim.property_address || claim.claim_number}
                  </button>
                </td>
                <td>{claim.contractor?.name}</td>
                <td>{claim.state}</td>
                <td>
                  <SolBadge claim={claim} rules={rules} />
                </td>
              </tr>
            ))}
            {withStatus.length === 0 && (
              <tr>
                <td colSpan={4}>No claims with an urgent or approaching deadline.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </>
  )
}

export default DeadlinesWidget
