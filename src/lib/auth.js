const STORAGE_KEY = 'crm_session'

// The client can't verify the token's signature (no secret in the
// browser) - this is a soft, self-reported expiry so the UI can
// proactively show the login screen again instead of waiting for a
// server call to fail. Real enforcement happens wherever a Netlify
// function calls verifySession() server-side (crm-users-api.js etc).
function decodeExp(token) {
  try {
    const [body] = token.split('.')
    const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')))
    return payload.exp || 0
  } catch {
    return 0
  }
}

export function getSession() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw)
    if (!session.token || decodeExp(session.token) < Date.now()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function setSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}

export async function login(username, password) {
  const res = await fetch('/.netlify/functions/crm-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Could not sign in')
  setSession(data)
  return data
}

// Every crm-users-api.js call needs {action, token, ...}; this keeps
// that boilerplate (and the "session expired" handling) in one place.
export async function callUsersApi(action, extra = {}) {
  const session = getSession()
  const res = await fetch('/.netlify/functions/crm-users-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token: session?.token, ...extra }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}
