import { useEffect, useState } from 'react'
import { listPendingActionsForContractor } from '../lib/queries'
import { dueStatus } from '../lib/dueStatus'

// Shown automatically whenever a contractor's file is opened, per
// Keri's request - a heads-up on anything still pending for them
// before she starts reading through the rest of the file.
function ContractorPendingBanner({ contractorId }) {
  const [actions, setActions] = useState([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(false)
    listPendingActionsForContractor(contractorId)
      .then(setActions)
      .catch(() => setActions([]))
  }, [contractorId])

  if (dismissed || actions.length === 0) return null

  const overdueCount = actions.filter((a) => dueStatus(a) === 'overdue').length

  return (
    <div className="pending-action-banner">
      <div>
        <strong>
          {actions.length} pending action{actions.length === 1 ? '' : 's'} for this contractor
        </strong>
        {overdueCount > 0 && <span className="overdue-cell"> — {overdueCount} overdue</span>}
        <ul>
          {actions.slice(0, 5).map((a) => (
            <li key={a.id} className={dueStatus(a) || ''}>
              {a.supplement?.claim?.property_address || a.supplement?.claim?.claim_number || 'Job'}:{' '}
              {a.description}
              {a.due_date && <span className="due-date"> — due {a.due_date}</span>}
            </li>
          ))}
        </ul>
      </div>
      <button type="button" onClick={() => setDismissed(true)}>
        Dismiss
      </button>
    </div>
  )
}

export default ContractorPendingBanner
