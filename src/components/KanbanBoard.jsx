import { useMemo, useState } from 'react'
import KanbanCard from './KanbanCard'
import { STAGES, stageClassName } from '../lib/stages'
import { SORT_OPTIONS, sortValue } from '../lib/supplementSort'

function KanbanBoard({ supplements, nextActionsBySupplement, onCardClick }) {
  const [sortKey, setSortKey] = useState('received')

  const columns = useMemo(() => {
    return STAGES.map((stage) => {
      const cards = supplements
        .filter((s) => s.stage === stage)
        .slice()
        .sort((a, b) => {
          const av = sortValue(sortKey, a, nextActionsBySupplement[a.id])
          const bv = sortValue(sortKey, b, nextActionsBySupplement[b.id])
          return av < bv ? -1 : av > bv ? 1 : 0
        })
      return { stage, cards }
    })
  }, [supplements, sortKey, nextActionsBySupplement])

  return (
    <div className="kanban-board-wrap">
      <div className="kanban-sort">
        <label>
          Sort cards by
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="kanban-board">
        {columns.map(({ stage, cards }) => (
          <div className="kanban-column" key={stage}>
            <div className={`kanban-column-header ${stageClassName(stage)}`}>
              {stage} <span className="kanban-column-count">{cards.length}</span>
            </div>
            <div className="kanban-column-body">
              {cards.map((s) => (
                <KanbanCard
                  key={s.id}
                  supplement={s}
                  nextAction={nextActionsBySupplement[s.id] || null}
                  onClick={() => onCardClick(s)}
                />
              ))}
              {cards.length === 0 && <div className="kanban-column-empty">—</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default KanbanBoard
