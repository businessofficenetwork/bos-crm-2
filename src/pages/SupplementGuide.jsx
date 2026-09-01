import { useEffect, useState } from 'react'
import { GUIDE_SECTIONS, CHECKLISTS } from '../lib/supplementGuideContent'
import './SupplementGuide.css'

const STORAGE_KEY = 'bon_supplement_guide_progress'

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function Block({ block, progress, onToggle }) {
  switch (block.type) {
    case 'paragraph':
      return <p>{block.text}</p>
    case 'quote':
      return <blockquote className="guide-quote">{block.text}</blockquote>
    case 'tip':
      return (
        <div className="guide-tip">
          {block.label && <strong>{block.label}</strong>}
          {block.text && <p>{block.text}</p>}
        </div>
      )
    case 'list':
      return block.ordered ? (
        <ol className="guide-list">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="guide-list">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
    case 'table':
      return (
        <table className="guide-table">
          <thead>
            <tr>
              {block.columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    case 'checklist': {
      const checklist = CHECKLISTS.find((c) => c.id === block.ref)
      if (!checklist) return null
      const checked = progress[checklist.id] || []
      const doneCount = checked.filter(Boolean).length
      return (
        <div className="guide-checklist">
          <div className="guide-checklist-header">
            <h4>{checklist.title}</h4>
            <span className="guide-checklist-progress">
              {doneCount}/{checklist.items.length}
            </span>
          </div>
          <ul>
            {checklist.items.map((item, i) => (
              <li key={i}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!checked[i]}
                    onChange={() => onToggle(checklist.id, i, checklist.items.length)}
                  />
                  {item}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )
    }
    default:
      return null
  }
}

function SupplementGuide() {
  const [progress, setProgress] = useState(loadProgress)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [progress])

  function toggleItem(checklistId, index, length) {
    setProgress((p) => {
      const current = p[checklistId] || new Array(length).fill(false)
      const next = [...current]
      next[index] = !next[index]
      return { ...p, [checklistId]: next }
    })
  }

  function resetAll() {
    if (!window.confirm('Reset all checklist progress in this guide? This cannot be undone.')) return
    setProgress({})
  }

  const totalItems = CHECKLISTS.reduce((sum, c) => sum + c.items.length, 0)
  const totalDone = CHECKLISTS.reduce(
    (sum, c) => sum + (progress[c.id] || []).filter(Boolean).length,
    0
  )

  return (
    <div className="supplement-guide">
      <div className="contractors-header">
        <h1>Supplement Guide</h1>
        <div className="header-actions">
          <span className="guide-overall-progress">
            {totalDone}/{totalItems} checklist items complete
          </span>
          <button type="button" onClick={resetAll}>
            Reset Progress
          </button>
        </div>
      </div>

      <p className="guide-intro">
        This is BON's internal training and SOP manual for how to do supplements, built
        directly into the CRM. Work through it top to bottom your first time - after that,
        use it as a reference and the checklists as a real working tool.
      </p>

      <nav className="guide-toc">
        {GUIDE_SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`}>
            {s.number}. {s.title}
          </a>
        ))}
      </nav>

      {GUIDE_SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="guide-section">
          <h2>
            {section.number}. {section.title}
          </h2>
          {section.blocks.map((block, i) => (
            <Block key={i} block={block} progress={progress} onToggle={toggleItem} />
          ))}
        </section>
      ))}
    </div>
  )
}

export default SupplementGuide
