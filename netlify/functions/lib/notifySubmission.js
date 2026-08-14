// Emails Keri whenever a new claim is submitted through the portal
// (or, later, the email intake path) - so she knows something landed
// without having to keep the CRM open. Best-effort, same pattern as
// the other notify* modules: a failed/skipped send never blocks the
// submission itself.

const CRM_ORIGIN = 'https://boscrm2.netlify.app'

export async function notifySubmission({ contractorName, address, missing }) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.NOTIFY_EMAIL
  if (!apiKey || !to) return false

  const status = missing.length === 0 ? 'all documents received, audit starting' : `missing: ${missing.join(', ')}`
  const subject = `New submission — ${contractorName || 'Unknown contractor'} — ${address || 'Untitled'} — ${status}`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'BOS CRM <notifications@businessofficenetwork.com>',
      to: [to],
      subject,
      html: `<p>${subject}</p><p><a href="${CRM_ORIGIN}/audits">View in CRM →</a></p>`,
    }),
  })

  if (!res.ok) {
    console.warn('New-submission email failed:', res.status, await res.text().catch(() => ''))
    return false
  }
  return true
}
