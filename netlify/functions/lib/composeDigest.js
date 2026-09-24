// Turns the raw digest query results (digestQueries.js) into a short,
// prioritized email body. BON_BUILD_SEQUENCE.md Phase C step 2: "lead
// with the three things that most need action today" - this is a
// writing/prioritization task, not a data-extraction one, so no
// structured output schema needed, just plain text.

import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You write a short daily operations digest email for a one-person insurance
supplement business. You're given the raw counts and records for today. Write plain text (no
markdown headers, no bullet-heavy filler) that:
- Leads with the 1-3 things that most need action today, stated plainly
- Then briefly covers what's stale/aging and needs a nudge
- Ends with the rolling 30-day numbers in one short line
Keep it terse and skimmable in 15 seconds. No pleasantries, no "I hope this finds you well." If a
section is empty, skip it entirely rather than saying "none."`

export async function composeDigest(data) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(data, null, 2) }],
  })

  const textBlock = message.content.find((block) => block.type === 'text')
  return textBlock ? textBlock.text : ''
}

// Plain-counts version, no AI call - used for the text message (has to
// be short) and as the email's fallback when the AI call fails (e.g. the
// Anthropic account is out of credit), so a billing problem on that
// account doesn't silently cancel the whole digest.
export function composeShortDigest(data) {
  const parts = []
  if (data.newLeadsCount) parts.push(`${data.newLeadsCount} new lead${data.newLeadsCount === 1 ? '' : 's'}`)
  if (data.findingsAwaitingReview.length) {
    parts.push(`${data.findingsAwaitingReview.length} finding${data.findingsAwaitingReview.length === 1 ? '' : 's'} to review`)
  }
  if (data.overdueActions.length) parts.push(`${data.overdueActions.length} overdue action${data.overdueActions.length === 1 ? '' : 's'}`)
  if (data.dueReminders.length) parts.push(`${data.dueReminders.length} due today`)
  if (data.submittedAging.length) parts.push(`${data.submittedAging.length} submitted 7+ days, no response`)
  if (data.approvedNotInvoiced.length) parts.push(`${data.approvedNotInvoiced.length} approved, not invoiced`)

  const headline = parts.length ? parts.join(', ') : 'Nothing urgent today'
  const rolling = `30d: ${data.rolling30d.auditsRun} audits, $${Math.round(data.rolling30d.totalEstRecovery).toLocaleString()} recoverable`
  return `BOS Digest: ${headline}. ${rolling}.`
}
