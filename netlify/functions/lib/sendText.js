// Shared SMS sender (Twilio's REST API via raw fetch, same lightweight
// pattern as the Resend email helpers - no SDK needed for one endpoint).
// Best-effort: a missing/failed text never blocks whatever triggered it,
// same contract as the notify* email helpers.

export async function sendText(body) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER
  const to = process.env.NOTIFY_PHONE
  if (!accountSid || !authToken || !from || !to) return false

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: from, To: to, Body: body }),
  })

  if (!res.ok) {
    console.warn('Text send failed:', res.status, await res.text().catch(() => ''))
    return false
  }
  return true
}
