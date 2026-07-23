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

export const COMPLEXITY_LABELS = {
  roof_only: 'Roof Only',
  multiple_trades: 'Multiple Trades',
  complex: 'Complex',
}
