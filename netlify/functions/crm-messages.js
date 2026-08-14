import { createClient } from '@supabase/supabase-js'

// portal_messages has RLS enabled with zero policies (0017_secure_portal_tables.sql)
// - only the service-role key can touch it, so the CRM's own Communications
// tab has to go through a function too, same as the portal admin panel does.
// No session token required here: the main CRM has no login gate yet
// (deferred until the whole project is done), so this matches the trust
// level of every other internal CRM read/write today.
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

  const contractorId = payload.contractorId
  if (!contractorId) {
    return json(400, { error: 'contractorId is required' })
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  switch (payload.action) {
    case 'list': {
      const { data: messages, error } = await supabase
        .from('portal_messages')
        .select('*')
        .eq('contractor_id', contractorId)
        .order('created_at', { ascending: true })
      if (error) return json(500, { error: 'Could not load messages' })

      await supabase
        .from('portal_messages')
        .update({ is_read: true })
        .eq('contractor_id', contractorId)
        .eq('sender', 'contractor')

      return json(200, { messages: messages || [] })
    }

    case 'send': {
      const text = String(payload.message || '').trim()
      if (!text) return json(400, { error: 'Message is required' })
      const { error } = await supabase.from('portal_messages').insert({
        contractor_id: contractorId,
        sender: 'bon',
        message: text,
        is_read: false,
      })
      if (error) return json(500, { error: 'Could not send message' })
      return json(200, { ok: true })
    }

    default:
      return json(400, { error: 'Unknown action' })
  }
}
