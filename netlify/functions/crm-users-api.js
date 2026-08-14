import { createClient } from '@supabase/supabase-js'
import { hashPassword, verifySession } from './lib/portalAuth.js'

function json(statusCode, body) {
  return { statusCode, body: JSON.stringify(body) }
}

export const handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON' })
  }

  const session = verifySession(payload.token, process.env.CRM_SESSION_SECRET)
  if (!session) {
    return json(401, { error: 'Session expired or invalid - please sign in again' })
  }
  if (session.role !== 'admin') {
    return json(403, { error: 'Only Admin can manage logins' })
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  switch (payload.action) {
    case 'list': {
      const { data, error } = await supabase
        .from('crm_users')
        .select('id, name, username, role, is_active, last_login, created_at')
        .order('name')
      if (error) return json(500, { error: error.message })
      return json(200, { users: data })
    }

    case 'create': {
      const name = String(payload.name || '').trim()
      const username = String(payload.username || '').trim().toLowerCase()
      const password = String(payload.password || '')
      const role = payload.role === 'admin' ? 'admin' : 'staff'
      if (!name || !username || password.length < 8) {
        return json(400, { error: 'Name, username, and an 8+ character password are required' })
      }
      const { error } = await supabase
        .from('crm_users')
        .insert({ name, username, password_hash: hashPassword(password), role })
      if (error) {
        return json(409, { error: error.code === '23505' ? 'That username is already taken' : error.message })
      }
      return json(200, { ok: true })
    }

    case 'setActive': {
      const { error } = await supabase
        .from('crm_users')
        .update({ is_active: !!payload.isActive })
        .eq('id', payload.userId)
      if (error) return json(500, { error: error.message })
      return json(200, { ok: true })
    }

    case 'resetPassword': {
      const password = String(payload.password || '')
      if (password.length < 8) {
        return json(400, { error: 'Password must be at least 8 characters' })
      }
      const { error } = await supabase
        .from('crm_users')
        .update({ password_hash: hashPassword(password) })
        .eq('id', payload.userId)
      if (error) return json(500, { error: error.message })
      return json(200, { ok: true })
    }

    default:
      return json(400, { error: 'Unknown action' })
  }
}
