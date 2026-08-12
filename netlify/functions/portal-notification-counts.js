import { createClient } from '@supabase/supabase-js'

// No session token here — this is consumed from inside the CRM itself,
// which already uses the same no-login, shared-access trust model as
// every other internal page. It exists so the CRM's notification badge
// can keep working now that portal_messages is locked behind RLS.
export const handler = async function () {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const today = new Date().toISOString().slice(0, 10)
  const [{ count: unreadMessages }, { count: newIntakes }] = await Promise.all([
    supabase
      .from('portal_messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender', 'contractor')
      .eq('is_read', false),
    supabase
      .from('supplements')
      .select('id', { count: 'exact', head: true })
      .eq('stage', 'Intake')
      .gte('intake_date', today),
  ])

  return {
    statusCode: 200,
    body: JSON.stringify({ unreadMessages: unreadMessages || 0, newIntakes: newIntakes || 0 }),
  }
}
