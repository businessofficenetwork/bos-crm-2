import { timingSafeEqual } from 'crypto'
import { signSession } from './lib/portalAuth.js'

function safeEqual(a, b) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export const handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const password = String(payload.password || '')
  const expected = process.env.PORTAL_ADMIN_PASSWORD || ''
  if (!expected || !password || !safeEqual(password, expected)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Incorrect password' }) }
  }

  const token = signSession({ role: 'admin' }, process.env.PORTAL_SESSION_SECRET)
  return { statusCode: 200, body: JSON.stringify({ token }) }
}
