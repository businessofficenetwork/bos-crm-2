import { createClient } from '@supabase/supabase-js'
import { runSupplementFollowups } from './lib/supplementFollowups.js'
import { sendText } from './lib/sendText.js'

// Daily scheduled function (BON_BUILD_SEQUENCE.md Phase B5) - queues
// actions for aging submissions/invoices. POST-able directly for local
// testing or a manual "check now" trigger.
export const handler = async function () {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  const result = await runSupplementFollowups(supabase)

  // Only worth a text on days something actually changed - a "0 queued"
  // text every weekday would just be noise.
  if (result.created.length > 0) {
    const counts = result.created.reduce((acc, c) => {
      acc[c.rule] = (acc[c.rule] || 0) + 1
      return acc
    }, {})
    const summary = Object.entries(counts).map(([rule, n]) => `${n} ${rule}`).join(', ')
    await sendText(`BOS: ${result.created.length} supplement follow-up${result.created.length === 1 ? '' : 's'} queued — ${summary}. Check CRM.`)
  }

  return { statusCode: 200, body: JSON.stringify(result) }
}
