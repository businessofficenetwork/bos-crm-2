// Password hashing and session tokens for the contractor/admin portal.
// No bcrypt/jsonwebtoken dependency — Node's built-in crypto covers
// both needs for a single-app session, so nothing new to install.

import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto'

const SESSION_TTL_SECONDS = 60 * 60 * 12 // 12 hours

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  const [salt, hash] = (stored || '').split(':')
  if (!salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  if (candidate.length !== expected.length) return false
  return timingSafeEqual(candidate, expected)
}

function base64url(input) {
  return Buffer.from(input).toString('base64url')
}

export function signSession(payload, secret) {
  const body = base64url(JSON.stringify({ ...payload, exp: Date.now() + SESSION_TTL_SECONDS * 1000 }))
  const sig = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifySession(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expectedSig = createHmac('sha256', secret).update(body).digest('base64url')
  const sigBuf = Buffer.from(sig)
  const expectedBuf = Buffer.from(expectedSig)
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null

  let payload
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (!payload.exp || payload.exp < Date.now()) return null
  return payload
}
