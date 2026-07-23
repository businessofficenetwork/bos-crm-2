import { stageClassName, COMPLEXITY_LABELS } from '../lib/stages'
import { dueStatus } from '../lib/dueStatus'

function formatDate(value) {
  if (!value) return null
  return value.slice(0, 10)
}

function KanbanCard({ supplement, nextAction, onClick }) {
  const claim = supplement.claim
  const jobName = claim?.property_address || claim?.claim_number || 'Untitled job'
  const dateEntered = formatDate(supplement.intake_date || supplement.created_at)
  const showComplexity =
    (supplement.stage === 'Intake' || supplement.stage === 'Docs Received') &&
    supplement.complexity

  const actionStatus = nextAction ? dueStatus(nextAction) : null
  const needsAction = actionStatus === 'overdue'
  const cardStyle = supplement.card_color ? { background: supplement.card_color } : undefined

  return (
    <div
      className={`kanban-card ${stageClassName(supplement.stage)}`}
      style={cardStyle}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {needsAction && <span className="kanban-card-alert" title="Action needed">!</span>}

      <div className="kanban-card-title">{jobName}</div>

      <div className="kanban-card-row">
        <span>Entered {dateEntered || '—'}</span>
      </div>

      {supplement.closing_date && (
        <div className="kanban-card-row kanban-card-closing">
          <input type="checkbox" checked readOnly /> Closing {formatDate(supplement.closing_date)}
        </div>
      )}

      {supplement.submitted_date && (
        <div className="kanban-card-row">Sent to carrier {formatDate(supplement.submitted_date)}</div>
      )}

      {showComplexity && (
        <div className="kanban-card-complexity">{COMPLEXITY_LABELS[supplement.complexity]}</div>
      )}

      {nextAction && (
        <div className={`kanban-card-next-action ${actionStatus || ''}`}>
          {nextAction.description}
          {nextAction.due_date && ` — due ${nextAction.due_date}`}
        </div>
      )}
    </div>
  )
}

export default KanbanCard
