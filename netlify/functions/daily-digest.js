import { createClient } from '@supabase/supabase-js'
import { gatherDigestData } from './lib/digestQueries.js'
import { composeDigest } from './lib/composeDigest.js'

// Weekday-morning ops summary (BON_BUILD_SEQUENCE.md Phase C). Netlify
// invokes this on the schedule set in netlify.toml; POSTing to it
// directly (as this handler also allows) is how it's tested locally
// and how a manual "send me the digest now" trigger could work later.
export const handler = async function () {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

  const data = await gatherDigestData(supabase)
  const digestText = await composeDigest(data)

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.NOTIFY_EMAIL
  if (!apiKey || !to) {
    return { statusCode: 200, body: JSON.stringify({ sent: false, reason: 'no RESEND_API_KEY/NOTIFY_EMAIL set', digestText }) }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'BOS CRM <onboarding@resend.dev>',
      to: [to],
      subject: `BOS Daily Digest — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      text: digestText,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    return { statusCode: 500, body: JSON.stringify({ sent: false, error: errText }) }
  }

  return { statusCode: 200, body: JSON.stringify({ sent: true }) }
}
