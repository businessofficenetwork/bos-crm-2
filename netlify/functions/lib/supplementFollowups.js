// BON_BUILD_SEQUENCE.md Phase B5. Finds supplements that need a nudge
// and queues an action for Keri to act on - nothing is ever sent
// automatically, this only writes to the same `actions` table the
// Pipeline board and Topbar reminders already read from.
//
// Idempotent: each rule has a fixed description prefix, and a
// supplement only gets one open (incomplete) action per rule at a
// time - re-running this daily won't pile up duplicate actions for
// the same supplement.

const RULES = [
  {
    tag: 'Follow up',
    description: (s) =>
      `Follow up: submission over 7 days with no carrier response — nudge the contractor to check with the adjuster.`,
    matches: (s, todayISO) =>
      s.stage === 'Submitted' && !s.carrier_response_date && s.submitted_date && s.submitted_date < daysAgo(7, todayISO),
  },
  {
    tag: 'Invoice reminder',
    description: () => `Invoice reminder: supplement approved but not yet invoiced.`,
    matches: (s) => s.stage === 'Approved' && !s.invoiced_date,
  },
  {
    tag: 'Collections',
    description: () => `Collections: invoice outstanding 30+ days with no payment.`,
    matches: (s, todayISO) =>
      s.invoiced_date && s.invoiced_date < daysAgo(30, todayISO) && !['Paid', 'Closed'].includes(s.stage),
  },
]

function daysAgo(days, todayISO) {
  const d = new Date(todayISO)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export async function runSupplementFollowups(supabase) {
  const today = new Date().toISOString().slice(0, 10)

  // Every supplement, not just open ones - an action needs to be
  // auto-cleared below even after its supplement moves to Paid/Closed
  // or otherwise stops matching the rule that created it.
  const { data: supplements, error } = await supabase
    .from('supplements')
    .select('id, stage, submitted_date, carrier_response_date, invoiced_date')
  if (error) throw error
  const supplementsById = new Map((supplements || []).map((s) => [s.id, s]))

  const { data: openActions } = await supabase
    .from('actions')
    .select('id, supplement_id, description')
    .eq('completed', false)

  const created = []
  const cleared = []

  for (const s of supplements || []) {
    for (const rule of RULES) {
      if (!rule.matches(s, today)) continue

      const desc = rule.description(s)
      const alreadyQueued = (openActions || []).some(
        (a) => a.supplement_id === s.id && a.description.startsWith(rule.tag + ':')
      )
      if (alreadyQueued) continue

      const { error: insertError } = await supabase
        .from('actions')
        .insert({ supplement_id: s.id, description: desc, due_date: today })
      if (insertError) throw insertError
      created.push({ supplement_id: s.id, rule: rule.tag })
    }
  }

  // Auto-clear: an open action we generated whose rule no longer
  // matches (supplement moved on, or was deleted) doesn't need her to
  // manually close it out.
  for (const action of openActions || []) {
    const rule = RULES.find((r) => action.description.startsWith(r.tag + ':'))
    if (!rule) continue // not one of ours - never touch manually-created actions
    const supplement = supplementsById.get(action.supplement_id)
    if (supplement && rule.matches(supplement, today)) continue

    const { error: updateError } = await supabase
      .from('actions')
      .update({ completed: true })
      .eq('id', action.id)
    if (updateError) throw updateError
    cleared.push({ supplement_id: action.supplement_id, rule: rule.tag })
  }

  return { created, cleared }
}
