import { useMemo, useState } from 'react'
import { stageClassName, COMPLEXITY_LABELS } from '../lib/stages'
import { SORT_OPTIONS, sortValue } from '../lib/supplementSort'
import { dueStatus } from '../lib/dueStatus'

function formatDate(value) {
  return value ? value.slice(0, 10) : '—'
}

function SupplementListView({ supplements, nextActionsBySupplement, onRowClick }) {
  const [sortKey, setSortKey] = useState('received')

  const rows = useMemo(() => {
    return supplements.slice().sort((a, b) => {
      const av = sortValue(sortKey, a, nextActionsBySupplement[a.id])
      const bv = sortValue(sortKey, b, nextActionsBySupplement[b.id])
      return av < bv ? -1 : av > bv ? 1 : 0
    })
  }, [supplements, sortKey, nextActionsBySupplement])

  return (
    <div>
      <div className="kanban-sort">
        <label>
          Sort by
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <table className="contractors-table">
        <thead>
          <tr>
            <th>Claim</th>
            <th>Contractor</th>
            <th>Stage</th>
            <th>Complexity</th>
            <th>Date Received</th>
            <th>Date Submitted</th>
            <th>Next Action Due</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const nextAction = nextActionsBySupplement[s.id]
            const status = nextAction ? dueStatus(nextAction) : null
            return (
              <tr key={s.id}>
                <td>
                  <button type="button" className="row-link" onClick={() => onRowClick(s)}>
                    {s.claim?.property_address || s.claim?.claim_number || 'View'}
                  </button>
                </td>
                <td>{s.claim?.contractor?.name}</td>
                <td>
                  <span className={`list-stage-dot ${stageClassName(s.stage)}`} />
                  {s.stage}
                </td>
                <td>{s.complexity ? COMPLEXITY_LABELS[s.complexity] : '—'}</td>
                <td>{formatDate(s.intake_date || s.created_at)}</td>
                <td>{formatDate(s.submitted_date)}</td>
                <td className={status === 'overdue' ? 'overdue-cell' : ''}>
                  {nextAction?.due_date || '—'}
                </td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7}>No supplements found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default SupplementListView
