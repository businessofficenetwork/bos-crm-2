import { useEffect, useState } from 'react'
import { callUsersApi } from '../lib/auth'
import '../pages/Contractors.css'

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'Never'
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
    </div>
  )
}

export default Settings
