import { createClient } from '@supabase/supabase-js'
import { verifySession } from './lib/portalAuth.js'

const STAGES_FOR_SUBMIT = 'Intake'

function json(statusCode, body) {
  return { statusCode, body: JSON.stringify(body) }
}

// Every action re-derives contractor_id from the verified session token —
// never from anything the client sends — so one contractor can never
// read or write another contractor's data through this function.
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

  const session = verifySession(payload.token, process.env.PORTAL_SESSION_SECRET)
  if (!session) {
    return json(401, { error: 'Session expired or invalid — please sign in again' })
  }
  const contractorId = session.contractor_id

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  switch (payload.action) {
    case 'queue': {
      const { data: claims } = await supabase
        .from('claims')
        .select('*')
        .eq('contractor_id', contractorId)
      const claimIds = (claims || []).map((c) => c.id)
      const { data: supplements } = claimIds.length
        ? await supabase
            .from('supplements')
            .select('*')
            .in('claim_id', claimIds)
            .order('created_at', { ascending: false })
        : { data: [] }
      const { count: unreadCount } = await supabase
        .from('portal_messages')
        .select('id', { count: 'exact', head: true })
        .eq('contractor_id', contractorId)
        .eq('sender', 'bon')
        .eq('is_read', false)
      return json(200, { claims: claims || [], supplements: supplements || [], unreadCount: unreadCount || 0 })
    }

    case 'detail': {
      const { data: supplement } = await supabase
        .from('supplements')
        .select('*')
        .eq('id', payload.supplementId)
        .single()
      if (!supplement) return json(404, { error: 'Not found' })

      const { data: claim } = await supabase
        .from('claims')
        .select('*')
        .eq('id', supplement.claim_id)
        .eq('contractor_id', contractorId)
        .single()
      if (!claim) return json(403, { error: 'Not found' })

      const { data: docFiles } = await supabase.storage.from('claim-docs').list(claim.id, { limit: 30 })
      return json(200, { supplement, claim, docFiles: docFiles || [] })
    }

    case 'messages': {
      const { data: messages } = await supabase
        .from('portal_messages')
        .select('*')
        .eq('contractor_id', contractorId)
        .order('created_at', { ascending: true })
      return json(200, { messages: messages || [] })
    }

    case 'sendMessage': {
      const text = String(payload.message || '').trim()
      if (!text) return json(400, { error: 'Message is required' })
      const { error } = await supabase.from('portal_messages').insert({
        contractor_id: contractorId,
        sender: 'contractor',
        message: text,
        is_read: false,
      })
      if (error) return json(500, { error: 'Could not send message' })
      return json(200, { ok: true })
    }

    case 'markMessagesRead': {
      await supabase
        .from('portal_messages')
        .update({ is_read: true })
        .eq('contractor_id', contractorId)
        .eq('sender', 'bon')
      return json(200, { ok: true })
    }

    case 'submitClaim': {
      const address = String(payload.address || '').trim()
      const homeowner = String(payload.homeowner || '').trim()
      const carrier = String(payload.carrier || '').trim()
      if (!address || !homeowner || !carrier) {
        return json(400, { error: 'Property address, homeowner name, and carrier are required' })
      }

      const { data: claim, error: claimErr } = await supabase
        .from('claims')
        .insert({
          contractor_id: contractorId,
          property_address: address,
          homeowner_name: homeowner,
          carrier,
          claim_number: payload.claim_number || null,
          adjuster_name: payload.adjuster_name || null,
          adjuster_contact: payload.adjuster_contact || null,
          date_of_loss: payload.date_of_loss || null,
          notes: payload.notes || 'EMPTY',
        })
        .select()
        .single()
      if (claimErr) return json(500, { error: 'Could not submit claim' })

      await supabase.from('supplements').insert({
        claim_id: claim.id,
        stage: STAGES_FOR_SUBMIT,
        intake_date: new Date().toISOString().slice(0, 10),
        complexity: payload.complexity || null,
        notes: 'EMPTY',
      })

      await supabase.from('portal_messages').insert({
        contractor_id: contractorId,
        sender: 'bon',
        message: `Got it! New claim received for ${address} — ${homeowner} · ${carrier}. Remember to send the carrier estimate, measurements, and photo report to supplements@businessofficenetwork.com. You'll see progress in your queue as we work through it.`,
        is_read: false,
      })

      return json(200, { claim })
    }

    case 'uploadUrl': {
      const { data: claim } = await supabase
        .from('claims')
        .select('id')
        .eq('id', payload.claimId)
        .eq('contractor_id', contractorId)
        .single()
      if (!claim) return json(403, { error: 'Not found' })

      const safeName = String(payload.filename || 'file').replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${claim.id}/${Date.now()}_${safeName}`
      const { data, error } = await supabase.storage.from('claim-docs').createSignedUploadUrl(path)
      if (error) return json(500, { error: 'Could not create upload URL' })
      return json(200, { path: data.path, token: data.token })
    }

    case 'downloadUrl': {
      const claimId = String(payload.path || '').split('/')[0]
      const { data: claim } = await supabase
        .from('claims')
        .select('id')
        .eq('id', claimId)
        .eq('contractor_id', contractorId)
        .single()
      if (!claim) return json(403, { error: 'Not found' })

      const { data, error } = await supabase.storage
        .from('claim-docs')
        .createSignedUrl(payload.path, 60)
      if (error) return json(500, { error: 'Could not create download URL' })
      return json(200, { url: data.signedUrl })
    }

    default:
      return json(400, { error: 'Unknown action' })
  }
}
