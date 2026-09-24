import { createClient } from '@supabase/supabase-js'
import { gatherDigestData } from './lib/digestQueries.js'
import { composeDigest, composeShortDigest } from './lib/composeDigest.js'
import { sendText } from './lib/sendText.js'

// Weekday-morning ops summary (BON_BUILD_SEQUENCE.md Phase C). Netlify
// invokes this on the schedule set in netlify.toml; POSTing to it
// directly (as this handler also allows) is how it's tested locally
// and how a manual "send me the digest now" trigger could work later.
export const handler = async function () {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

  const data = await gatherDigestData(supabase)

  // The AI-written version reads better, but it depends on a funded
  // Anthropic account - if that call fails (e.g. no credit, same
  // account the audit rule-pass needs), fall back to the plain-counts
  // version rather than sending nothing at all.
  let digestText
  try {
    digestText = await composeDigest(data)
  } catch (err) {
    console.warn('AI digest compose failed, falling back to plain summary:', err.message || err)
  }
  if (!digestText) digestText = composeShortDigest(data)

  await sendText(digestText.length > 300 ? composeShortDigest(data) : digestText)

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.NOTIFY_EMAIL
  if (!apiKey || !to) {
    return { statusCode: 200, body: JSON.stringify({ sent: false, reason: 'no RESEND_API_KEY/NOTIFY_EMAIL set', digestText }) }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'BOS CRM <notifications@businessofficenetwork.com>',
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
