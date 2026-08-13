import { useEffect, useState } from 'react'
import {
  listRequestedItems,
  createRequestedItem,
  setRequestedItemVerified,
  deleteRequestedItem,
} from '../lib/queries'

function RequestedItemsChecklist({ supplementId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const data = await listRequestedItems(supplementId)
      setItems(data)
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
      await createRequestedItem({ supplement_id: supplementId, description: description.trim() })
      setDescription('')
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleVerified(item) {
    setError(null)
    try {
      await setRequestedItemVerified(item.id, !item.verified)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.description}"?`)) return
    setError(null)
    try {
      await deleteRequestedItem(item.id)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="actions-panel">
      <h3>Requested Items</h3>
      <p className="form-hint">
        Checked manually for now — auto-verifying against the carrier's returned estimate is
        coming once the audit agent is back online.
      </p>

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && (
        <ul className="actions-list">
          {items.map((item) => (
            <li key={item.id} className={item.verified ? 'completed' : ''}>
              <label>
                <input
                  type="checkbox"
                  checked={item.verified}
                  onChange={() => toggleVerified(item)}
                />
                {item.description}
              </label>
              <button
                type="button"
                className="row-link"
                onClick={() => handleDelete(item)}
                title="Delete this item"
              >
                Delete
              </button>
            </li>
          ))}
          {items.length === 0 && <li className="actions-empty">No items requested yet.</li>}
        </ul>
      )}

      <form className="actions-add" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Add a requested item…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit" disabled={saving}>
          Add
        </button>
      </form>
    </div>
  )
}

export default RequestedItemsChecklist
