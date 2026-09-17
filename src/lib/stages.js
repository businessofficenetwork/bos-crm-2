export const STAGES = [
  'Intake',
  'Docs Received',
  'Reviewed',
  'Supplement Written',
  'Submitted',
  'Carrier Response',
  'Approved',
  'Paid',
  'Invoiced',
  'Closed',
]

export function stageClassName(stage) {
  return 'stage-' + stage.toLowerCase().replace(/[^a-z]+/g, '-').replace(/(^-|-$)/g, '')
}

// A job can pick up more than one supplement over time (e.g. a second
// supplement added later) - the most recently created one is treated as
// the job's "current" pipeline position, same idea as estimateValue()
// taking the largest audit value in Jobs.jsx.
export function currentStage(claim) {
  const supplements = claim.supplements || []
  if (supplements.length === 0) return null
  return supplements.reduce((latest, s) =>
    !latest || new Date(s.created_at) > new Date(latest.created_at) ? s : latest
  ).stage
}

export const COMPLEXITY_LABELS = {
  roof_only: 'Roof Only',
  multiple_trades: 'Multiple Trades',
  complex: 'Complex',
}

// Kanban card color by dollar complexity, not pipeline stage - per
// Keri's request: blue/green under $1500, rising through yellow/
// orange/red above that. She only specified the $1500 blue+green
// ceiling; the exact sub-breakpoints below are a first-pass default
// (documented here so they're easy to retune) - tell me the real
// numbers and I'll adjust.
const COMPLEXITY_BREAKPOINTS = [
  { max: 750, className: 'complexity-blue' },
  { max: 1500, className: 'complexity-green' },
  { max: 3000, className: 'complexity-yellow' },
  { max: 6000, className: 'complexity-orange' },
  { max: Infinity, className: 'complexity-red' },
]

export function complexityColorClass(supplement) {
  const value = Number(supplement.supplement_requested) || Number(supplement.original_estimate_rcv) || 0
  if (!value) return ''
  return COMPLEXITY_BREAKPOINTS.find((b) => value <= b.max).className
}
