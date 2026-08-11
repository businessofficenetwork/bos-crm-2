import { useState } from 'react'
import { statusClassName } from '../lib/auditStages'
import { runAudit } from '../lib/queries'

function money(value) {
  return value === null || value === undefined ? '' : `$${Number(value).toLocaleString()}`
}

function AuditCard({ audit, onClick, onRun }) {
  const [running, setRunning] = useState(false)
  const claim = audit.claim

  async function handleRun(e) {
    e.stopPropagation()
    setRunning(true)
    try {
      await runAudit(audit.id)
    } catch {
      // surfaced via the card's own error_detail on refresh
    } finally {
      setRunning(false)
      onRun()
    }
  }

  return (
    <div
      className={`kanban-card ${statusClassName(audit.status)}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="kanban-card-title">
        {claim?.property_address || claim?.claim_number || 'Untitled claim'}
      </div>
      <div className="kanban-card-row">{claim?.contractor?.name}</div>
      {claim?.carrier && <div className="kanban-card-row">{claim.carrier}</div>}

      {audit.status === 'queued' && <div className="kanban-card-row">Waiting to run</div>}

      {audit.status === 'analyzing' && (
        <div className="kanban-card-row">
          {audit.parsed_estimate?.line_items?.length || 0} items ·{' '}
          {money(audit.parsed_estimate?.reconciled_total)}
        </div>
      )}

      {(audit.status === 'manual_review' || audit.status === 'failed') && audit.error_detail && (
        <div className="kanban-card-row audit-card-error">{audit.error_detail}</div>
      )}

      {audit.status === 'findings_ready' && (
        <div className="kanban-card-row">{money(audit.est_total_recovery)} est. recovery</div>
      )}

      <button type="button" className="audit-run-btn" onClick={handleRun} disabled={running}>
        {running ? 'Running…' : 'Run Parser'}
      </button>
    </div>
  )
}

export default AuditCard
