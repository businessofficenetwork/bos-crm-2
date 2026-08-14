import { createClient } from '@supabase/supabase-js'
import { verifyPassword, signSession } from './lib/portalAuth.js'

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

  const username = String(payload.username || '').trim().toLowerCase()
  const password = String(payload.password || '')
  if (!username || !password) {
    return json(400, { error: 'Username and password are required' })
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: user } = await supabase
    .from('crm_users')
    .select('*')
    .eq('username', username)
    .single()

  if (!user || !user.is_active || !verifyPassword(password, user.password_hash)) {
    return json(401, { error: 'Incorrect username or password' })
  }

  await supabase.from('crm_users').update({ last_login: new Date().toISOString() }).eq('id', user.id)

  const token = signSession(
    { sub: user.id, name: user.name, role: user.role },
    process.env.CRM_SESSION_SECRET
  )
  return json(200, { token, name: user.name, role: user.role })
}
