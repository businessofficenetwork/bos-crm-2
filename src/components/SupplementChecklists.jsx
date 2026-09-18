import { useState } from 'react'
import { CHECKLISTS, PER_SUPPLEMENT_CHECKLIST_IDS } from '../lib/supplementGuideContent'
import { updateSupplementChecklistProgress } from '../lib/queries'
import '../pages/SupplementGuide.css'

const SECTIONS = PER_SUPPLEMENT_CHECKLIST_IDS.map((id) => CHECKLISTS.find((c) => c.id === id))

function SupplementChecklists({ supplementId, initialProgress }) {
  const [progress, setProgress] = useState(initialProgress || {})
  const [expanded, setExpanded] = useState(() => new Set())
  const [error, setError] = useState(null)

  function toggleExpanded(id) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function toggleItem(checklistId, index, length) {
    const previous = progress
    const current = previous[checklistId] || new Array(length).fill(false)
    const updatedItems = [...current]
    updatedItems[index] = !updatedItems[index]
    const next = { ...previous, [checklistId]: updatedItems }

    setProgress(next)
    setError(null)
    try {
      await updateSupplementChecklistProgress(supplementId, next)
    } catch (err) {
      setProgress(previous)
      setError(err.message)
    }
  }

  const totalItems = SECTIONS.reduce((sum, c) => sum + c.items.length, 0)
  const totalDone = SECTIONS.reduce(
    (sum, c) => sum + (progress[c.id] || []).filter(Boolean).length,
    0
  )

  return (
    <div className="actions-panel">
      <div className="guide-checklist-header">
        <h3>BON Supplement Guide Checklists</h3>
        <span className="guide-checklist-progress">
          {totalDone}/{totalItems}
        </span>
      </div>
      <p className="form-hint">
        From BON's step-by-step supplement process (see the Knowledge Base for the full
        writeup) - click a checklist to expand it. Progress saves to this supplement
        automatically.
      </p>
      {error && <p className="form-error">{error}</p>}

      {SECTIONS.map((checklist) => {
        const checked = progress[checklist.id] || []
        const doneCount = checked.filter(Boolean).length
        const isOpen = expanded.has(checklist.id)
        return (
          <div className="guide-checklist" key={checklist.id}>
            <button
              type="button"
              className="guide-checklist-header guide-checklist-toggle"
              onClick={() => toggleExpanded(checklist.id)}
            >
              <h4>
                {isOpen ? '▾' : '▸'} {checklist.title}
              </h4>
              <span className="guide-checklist-progress">
                {doneCount}/{checklist.items.length}
              </span>
            </button>
            {isOpen && (
              <ul>
                {checklist.items.map((item, i) => (
                  <li key={i}>
                    <label>
                      <input
                        type="checkbox"
                        checked={!!checked[i]}
                        onChange={() => toggleItem(checklist.id, i, checklist.items.length)}
                      />
                      {item}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default SupplementChecklists
