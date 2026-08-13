// Emails a contractor their new portal login when Keri creates one,
// so she doesn't have to copy/paste and send it herself. Best-effort,
// same pattern as notifyFindings.js - a failed email never blocks the
// login from being created, and this silently no-ops when the
// contractor has no email on file (the admin panel still shows the
// credentials in that case, so nothing is lost, she just has to send
// them another way).

const PORTAL_URL = 'https://boscrm2.netlify.app/portal.html'

export async function notifyPortalInvite({ contractorEmail, contractorName, username, password }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !contractorEmail) return false

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'BON Client Portal <notifications@businessofficenetwork.com>',
      to: [contractorEmail],
      subject: 'Your BON Client Portal login',
      html: `<p>Hi${contractorName ? ' ' + contractorName : ''},</p>
<p>You now have access to the BON Client Portal, where you can track your supplement queue and message us directly.</p>
<p><strong>Username:</strong> ${username}<br><strong>Password:</strong> ${password}</p>
<p><a href="${PORTAL_URL}">Sign in here →</a></p>
<p>Please keep this password somewhere secure. Questions? Call Keri at (918) 526-3300 or reply to this email.</p>`,
    }),
  })

  if (!res.ok) {
    console.warn('Portal invite email failed:', res.status, await res.text().catch(() => ''))
    return false
  }
  return true
}
