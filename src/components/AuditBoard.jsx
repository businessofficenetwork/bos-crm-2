import { useEffect, useRef } from 'react'
import AuditCard from './AuditCard'
import { AUDIT_STATUSES, AUDIT_STATUS_LABELS, statusClassName } from '../lib/auditStages'

function AuditBoard({ audits, onCardClick, onRefresh }) {
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(onRefresh, 10000)
    return () => clearInterval(intervalRef.current)
  }, [onRefresh])

  const columns = AUDIT_STATUSES.map((status) => ({
    status,
    audits: audits.filter((a) => a.status === status),
  }))

  return (
    <div className="kanban-board-wrap">
      <div className="kanban-board">
        {columns.map(({ status, audits: colAudits }) => (
          <div className="kanban-column" key={status}>
            <div className={`kanban-column-header ${statusClassName(status)}`}>
              {AUDIT_STATUS_LABELS[status]} <span className="kanban-column-count">{colAudits.length}</span>
            </div>
            <div className="kanban-column-body">
              {colAudits.map((audit) => (
                <AuditCard
                  key={audit.id}
                  audit={audit}
                  onClick={() => onCardClick(audit)}
                  onRun={onRefresh}
                />
              ))}
              {colAudits.length === 0 && <div className="kanban-column-empty">—</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AuditBoard
