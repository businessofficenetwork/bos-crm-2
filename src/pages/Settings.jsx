import { useEffect, useState } from 'react'
import { callUsersApi } from '../lib/auth'
import { listOpThresholdRules, createOpThresholdRule, updateOpThresholdRule } from '../lib/queries'
import '../pages/Contractors.css'

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'Never'
}

const emptyRule = { carrier_name: '', state: '', min_trades_required: 3, notes: '' }

function OpRulesSettings() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyRule)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      setRules(await listOpThresholdRules())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  function startEdit(rule) {
    setEditingId(rule.id)
    setForm({
      carrier_name: rule.carrier_name || '',
      state: rule.state || '',
      min_trades_required: rule.min_trades_required,
      notes: rule.notes || '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyRule)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        carrier_name: form.carrier_name.trim() || null,
        state: form.state.trim() ? form.state.trim().toUpperCase().slice(0, 2) : null,
        min_trades_required: Number(form.min_trades_required) || 3,
        notes: form.notes.trim() || null,
      }
      if (editingId) {
        await updateOpThresholdRule(editingId, payload)
      } else {
        await createOpThresholdRule(payload)
      }
      cancelEdit()
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h3>O&amp;P Threshold Rules</h3>
      <p>
        Controls when a claim is flagged as qualifying for Overhead &amp; Profit, based on how
        many trades are involved. A carrier + state rule wins, then a state-only rule, then the
        global default.
      </p>
      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="contractors-table">
          <thead>
            <tr>
              <th>Carrier</th>
              <th>State</th>
              <th>Min Trades Required</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id}>
                <td>{r.carrier_name || 'Any (default)'}</td>
                <td>{r.state || 'Any'}</td>
                <td>{r.min_trades_required}</td>
                <td>{r.notes}</td>
                <td>
                  <button type="button" onClick={() => startEdit(r)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr>
                <td colSpan={5}>No rules yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <h3>{editingId ? 'Edit Rule' : 'Add a Rule'}</h3>
      <form className="contractor-form" onSubmit={handleSubmit}>
        <div className="form-row wrap">
          <label>
            Carrier (blank = any)
            <input
              type="text"
              value={form.carrier_name}
              onChange={(e) => setForm((f) => ({ ...f, carrier_name: e.target.value }))}
            />
          </label>
          <label>
            State (blank = any)
            <input
              type="text"
              maxLength={2}
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            />
          </label>
          <label>
            Min trades required
            <input
              type="number"
              min={1}
              value={form.min_trades_required}
              onChange={(e) => setForm((f) => ({ ...f, min_trades_required: e.target.value }))}
              required
            />
          </label>
        </div>
        <label className="form-notes">
          Notes
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
          />
        </label>
        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Rule'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} disabled={saving}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

function Settings() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('staff')
  const [saving, setSaving] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const data = await callUsersApi('list')
      setUsers(data.users)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await callUsersApi('create', { name: name.trim(), username: username.trim(), password, role })
      setName('')
      setUsername('')
      setPassword('')
      setRole('staff')
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(user) {
    setError(null)
    try {
      await callUsersApi('setActive', { userId: user.id, isActive: !user.is_active })
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function resetPassword(user) {
    const newPassword = window.prompt(`New password for ${user.name} (8+ characters):`)
    if (!newPassword) return
    setError(null)
    try {
      await callUsersApi('resetPassword', { userId: user.id, password: newPassword })
      window.alert('Password updated.')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="contractors-header">
        <h1>Settings</h1>
      </div>

      <h3>Logins</h3>
      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="contractors-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>{u.is_active ? 'Active' : 'Disabled'}</td>
                <td>{formatDate(u.last_login)}</td>
                <td>
                  <div className="form-actions">
                    <button type="button" onClick={() => resetPassword(u)}>
                      Reset Password
                    </button>
                    <button type="button" onClick={() => toggleActive(u)}>
                      {u.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6}>No logins yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <h3>Add a Login</h3>
      <form className="contractor-form" onSubmit={handleCreate}>
        <div className="form-row wrap">
          <label>
            Name
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="staff">Office Staff</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Adding…' : 'Add Login'}
          </button>
        </div>
      </form>

      <OpRulesSettings />
    </div>
  )
}

export default Settings
