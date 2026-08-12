import { createClient } from '@supabase/supabase-js'
import { verifyPassword, signSession } from './lib/portalAuth.js'

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

  const username = String(payload.username || '').trim().toLowerCase()
  const password = String(payload.password || '')
  if (!username || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Username and password are required' }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: user, error } = await supabase
    .from('portal_users')
    .select('*, contractors(*)')
    .eq('username', username)
    .eq('is_active', true)
    .single()

  if (error || !user || !verifyPassword(password, user.password_hash)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid username or password' }) }
  }

  await supabase
    .from('portal_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.id)

  const token = signSession(
    { contractor_id: user.contractor_id, portal_user_id: user.id },
    process.env.PORTAL_SESSION_SECRET
  )

  return {
    statusCode: 200,
    body: JSON.stringify({ token, contractor: user.contractors }),
  }
}
