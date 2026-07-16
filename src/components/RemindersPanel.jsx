import { useEffect, useState } from 'react'
import { listReminders, createReminder, updateReminder } from '../lib/queries'
import { dueStatus } from '../lib/dueStatus'

function RemindersPanel() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const data = await listReminders()
      setReminders(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!description.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createReminder({ description: description.trim(), due_date: dueDate || null })
      setDescription('')
      setDueDate('')
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleCompleted(reminder) {
    setError(null)
    try {
      await updateReminder(reminder.id, { completed: !reminder.completed })
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="actions-panel">
      <h3>Reminders</h3>

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && (
        <ul className="actions-list">
          {reminders.map((r) => (
            <li
              key={r.id}
              className={[r.completed ? 'completed' : '', dueStatus(r)].filter(Boolean).join(' ')}
            >
              <label>
                <input
                  type="checkbox"
                  checked={r.completed}
                  onChange={() => toggleCompleted(r)}
                />
                {r.description}
                {r.due_date && <span className="due-date"> — due {r.due_date}</span>}
              </label>
            </li>
          ))}
          {reminders.length === 0 && <li className="actions-empty">No reminders yet.</li>}
        </ul>
      )}

      <form className="actions-add" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="New reminder…"
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

export default RemindersPanel
