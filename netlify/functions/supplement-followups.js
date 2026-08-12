import { createClient } from '@supabase/supabase-js'
import { runSupplementFollowups } from './lib/supplementFollowups.js'

// Daily scheduled function (BON_BUILD_SEQUENCE.md Phase B5) - queues
// actions for aging submissions/invoices. POST-able directly for local
// testing or a manual "check now" trigger.
export const handler = async function () {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  const result = await runSupplementFollowups(supabase)
  return { statusCode: 200, body: JSON.stringify(result) }
}
