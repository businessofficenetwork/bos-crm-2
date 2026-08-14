import { useEffect, useState } from 'react'
import { login, setSession } from '../lib/auth'
import './Login.css'

async function checkHasUsers() {
  const res = await fetch('/.netlify/functions/crm-bootstrap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'status' }),
  })
  const data = await res.json().catch(() => ({}))
  return !!data.hasUsers
}

async function createFirstAdmin(name, username, password) {
  const res = await fetch('/.netlify/functions/crm-bootstrap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', name, username, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Could not create account')
  return data
}

function Login({ onSignedIn }) {
  const [checking, setChecking] = useState(true)
  const [isFirstRun, setIsFirstRun] = useState(false)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkHasUsers()
      .then((hasUsers) => setIsFirstRun(!hasUsers))
      .catch(() => setIsFirstRun(false))
      .finally(() => setChecking(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (isFirstRun) {
        const data = await createFirstAdmin(name.trim(), username.trim(), password)
        setSession(data)
      } else {
        await login(username.trim(), password)
      }
      onSignedIn()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (checking) return null

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>BOS CRM</h1>
        {isFirstRun ? (
          <>
            <p className="login-subtitle">
              First time setup — create the admin account. You can add office staff logins from
              Settings afterward.
            </p>
            <label>
              Your Name
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
          </>
        ) : (
          <p className="login-subtitle">Sign in to continue.</p>
        )}
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isFirstRun ? 'new-password' : 'current-password'}
            minLength={isFirstRun ? 8 : undefined}
            required
          />
        </label>
        {isFirstRun && <p className="login-hint">At least 8 characters.</p>}
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={saving}>
          {saving ? 'Please wait…' : isFirstRun ? 'Create Admin Account' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

export default Login
