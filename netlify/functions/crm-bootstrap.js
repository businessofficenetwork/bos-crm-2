import { createClient } from '@supabase/supabase-js'
import { hashPassword, signSession } from './lib/portalAuth.js'

// One-time first-run setup: creates the very first admin account so
// nobody has to hand a real password over chat, and nothing needs to
// be seeded by hand in the Supabase dashboard. Only works while
// crm_users is empty - once one account exists, 'create' always
// refuses and Login.jsx falls back to the normal login form.
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

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (payload.action === 'status') {
    const { count } = await supabase.from('crm_users').select('id', { count: 'exact', head: true })
    return json(200, { hasUsers: (count || 0) > 0 })
  }

  if (payload.action === 'create') {
    const { count } = await supabase.from('crm_users').select('id', { count: 'exact', head: true })
    if ((count || 0) > 0) {
      return json(409, { error: 'Setup already complete - use the regular login.' })
    }

    const name = String(payload.name || '').trim()
    const username = String(payload.username || '').trim().toLowerCase()
    const password = String(payload.password || '')
    if (!name || !username || password.length < 8) {
      return json(400, { error: 'Name, username, and an 8+ character password are required' })
    }

    const { data: user, error } = await supabase
      .from('crm_users')
      .insert({ name, username, password_hash: hashPassword(password), role: 'admin' })
      .select()
      .single()
    if (error) return json(500, { error: error.message })

    const token = signSession(
      { sub: user.id, name: user.name, role: user.role },
      process.env.CRM_SESSION_SECRET
    )
    return json(200, { token, name: user.name, role: user.role })
  }

  return json(400, { error: 'Unknown action' })
}
