import { useEffect, useState } from 'react'
import { listActions, createAction, updateAction } from '../lib/queries'
import { dueStatus } from '../lib/dueStatus'

function ActionsPanel({ supplementId }) {
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const data = await listActions(supplementId)
      setActions(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [supplementId])

  async function handleAdd(e) {
    e.preventDefault()
    if (!description.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createAction({
        supplement_id: supplementId,
        description: description.trim(),
        due_date: dueDate || null,
      })
      setDescription('')
      setDueDate('')
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleCompleted(action) {
    setError(null)
    try {
      await updateAction(action.id, { completed: !action.completed })
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="actions-panel">
      <h3>Next Actions</h3>

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && (
        <ul className="actions-list">
          {actions.map((a) => (
            <li key={a.id} className={[a.completed ? 'completed' : '', dueStatus(a)].filter(Boolean).join(' ')}>
              <label>
                <input
                  type="checkbox"
                  checked={a.completed}
                  onChange={() => toggleCompleted(a)}
                />
                {a.description}
                {a.due_date && <span className="due-date"> — due {a.due_date}</span>}
              </label>
            </li>
          ))}
          {actions.length === 0 && <li className="actions-empty">No actions yet.</li>}
        </ul>
      )}

      <form className="actions-add" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="New action…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <button type="submit" disabled={saving}>
          Add
        </button>
      </form>
    </div>
  )
}

export default ActionsPanel
