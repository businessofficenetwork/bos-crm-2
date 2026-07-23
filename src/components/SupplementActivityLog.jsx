import { useEffect, useState } from 'react'
import { listSupplementActivity, createSupplementActivity } from '../lib/queries'

function SupplementActivityLog({ supplementId }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [body, setBody] = useState('')
  const [entryType, setEntryType] = useState('manual')
  const [saving, setSaving] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const data = await listSupplementActivity(supplementId)
      setEntries(data)
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
    if (!body.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createSupplementActivity({
        supplement_id: supplementId,
        entry_type: entryType,
        body: body.trim(),
      })
      setBody('')
      setEntryType('manual')
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="actions-panel">
      <h3>Carrier Activity Log</h3>
      <p className="form-hint">
        Every step you take with the carrier, and every message the system drafts, should be
        logged here.
      </p>

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && (
        <ul className="comments-list">
          {entries.map((entry) => (
            <li key={entry.id} className={entry.entry_type === 'system' ? 'mention' : ''}>
              <div className="comment-meta">
                <span className="comment-author">
                  {entry.entry_type === 'system' ? 'System-drafted' : 'Manual entry'}
                </span>
                <span className="comment-time">{new Date(entry.created_at).toLocaleString()}</span>
              </div>
              <p className="comment-body">{entry.body}</p>
            </li>
          ))}
          {entries.length === 0 && <li className="actions-empty">No activity logged yet.</li>}
        </ul>
      )}

      <form className="comments-add" onSubmit={handleAdd}>
        <select value={entryType} onChange={(e) => setEntryType(e.target.value)}>
          <option value="manual">Manual entry</option>
          <option value="system">System-drafted message</option>
        </select>
        <textarea
          placeholder="Log an interaction with the carrier…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
        />
        <button type="submit" disabled={saving}>
          {saving ? 'Logging…' : 'Log Entry'}
        </button>
      </form>
    </div>
  )
}

export default SupplementActivityLog
