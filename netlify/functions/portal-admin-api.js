import { createClient } from '@supabase/supabase-js'
import { verifySession, hashPassword } from './lib/portalAuth.js'
import { notifyPortalInvite } from './lib/notifyPortalInvite.js'

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

  const session = verifySession(payload.token, process.env.PORTAL_SESSION_SECRET)
  if (!session || session.role !== 'admin') {
    return json(401, { error: 'Session expired or invalid — please sign in again' })
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  switch (payload.action) {
    case 'overview': {
      const [{ data: contractors }, { data: portalUsers }, { data: msgs }] = await Promise.all([
        supabase.from('contractors').select('*').order('name'),
        supabase.from('portal_users').select('id, contractor_id, username, is_active, last_login'),
        supabase
          .from('portal_messages')
          .select('id, contractor_id')
          .eq('sender', 'contractor')
          .eq('is_read', false),
      ])
      return json(200, {
        contractors: contractors || [],
        portalUsers: portalUsers || [],
        unreadByContractor: (msgs || []).reduce((acc, m) => {
          acc[m.contractor_id] = (acc[m.contractor_id] || 0) + 1
          return acc
        }, {}),
      })
    }

    case 'contractorClaims': {
      const { data: claims } = await supabase
        .from('claims')
        .select('*')
        .eq('contractor_id', payload.contractorId)
      const claimIds = (claims || []).map((c) => c.id)
      const { data: supplements } = claimIds.length
        ? await supabase
            .from('supplements')
            .select('*')
            .in('claim_id', claimIds)
            .order('created_at', { ascending: false })
        : { data: [] }
      return json(200, { claims: claims || [], supplements: supplements || [] })
    }

    case 'updateStage': {
      const { error } = await supabase
        .from('supplements')
        .update({ stage: payload.stage, updated_at: new Date().toISOString() })
        .eq('id', payload.supplementId)
      if (error) return json(500, { error: 'Could not update stage' })

      await supabase.from('portal_messages').insert({
        contractor_id: payload.contractorId,
        sender: 'bon',
        message: `Update: your supplement has moved to "${payload.stage}".`,
        is_read: false,
      })
      return json(200, { ok: true })
    }

    case 'contractorMessages': {
      const { data: messages } = await supabase
        .from('portal_messages')
        .select('*')
        .eq('contractor_id', payload.contractorId)
        .order('created_at', { ascending: true })

      await supabase
        .from('portal_messages')
        .update({ is_read: true })
        .eq('contractor_id', payload.contractorId)
        .eq('sender', 'contractor')

      return json(200, { messages: messages || [] })
    }

    case 'sendReply': {
      const text = String(payload.message || '').trim()
      if (!text) return json(400, { error: 'Message is required' })
      const { error } = await supabase.from('portal_messages').insert({
        contractor_id: payload.contractorId,
        sender: 'bon',
        message: text,
        is_read: false,
      })
      if (error) return json(500, { error: 'Could not send message' })
      return json(200, { ok: true })
    }

    case 'contractorDocs': {
      const { data: claims } = await supabase
        .from('claims')
        .select('id, property_address')
        .eq('contractor_id', payload.contractorId)
      const result = []
      for (const claim of claims || []) {
        const { data: files } = await supabase.storage.from('claim-docs').list(claim.id, { limit: 50 })
        if (files && files.length) {
          result.push({ claim, files })
        }
      }
      return json(200, { claimDocs: result })
    }

    case 'downloadUrl': {
      const { data, error } = await supabase.storage
        .from('claim-docs')
        .createSignedUrl(payload.path, 60)
      if (error) return json(500, { error: 'Could not create download URL' })
      return json(200, { url: data.signedUrl })
    }

    case 'createLogin': {
      const username = String(payload.username || '').trim().toLowerCase().replace(/\s+/g, '')
      const password = String(payload.password || '').trim()
      if (!username || !password) {
        return json(400, { error: 'Username and password are required' })
      }
      const { error } = await supabase.from('portal_users').upsert(
        {
          contractor_id: payload.contractorId,
          username,
          password_hash: hashPassword(password),
          is_active: true,
        },
        { onConflict: 'username' }
      )
      if (error) return json(500, { error: error.message })

      // Best-effort - a failed/skipped email never blocks the login
      // itself. Skips silently if the contractor has no email on
      // file; the admin panel's own success alert still shows the
      // credentials either way, so nothing is lost.
      const { data: contractor } = await supabase
        .from('contractors')
        .select('name, email')
        .eq('id', payload.contractorId)
        .single()
      const emailSent = await notifyPortalInvite({
        contractorEmail: contractor?.email,
        contractorName: contractor?.name,
        username,
        password,
      })

      return json(200, { ok: true, emailSent })
    }

    default:
      return json(400, { error: 'Unknown action' })
  }
}
