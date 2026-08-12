// Emails Keri when an audit's findings are ready. Raw fetch against
// Resend's REST API — one email per audit run doesn't need the SDK.

const CRM_ORIGIN = 'https://boscrm2.netlify.app'

export async function notifyFindingsReady({ auditId, address, estTotalRecovery, findingsCount }) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.NOTIFY_EMAIL
  if (!apiKey || !to) return // notification is best-effort, not a hard requirement

  const amount = Math.round(estTotalRecovery || 0).toLocaleString()
  const subject = `Audit ready — ${address || 'Untitled claim'} — est. $${amount} recoverable — ${findingsCount} finding${findingsCount === 1 ? '' : 's'}`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'BOS CRM <onboarding@resend.dev>',
      to: [to],
      subject,
      html: `<p>${subject}</p><p><a href="${CRM_ORIGIN}/audits">View in CRM →</a></p>`,
    }),
  })

  if (!res.ok) {
    console.warn('Findings-ready email failed:', res.status, await res.text().catch(() => ''))
  }
}
