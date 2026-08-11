export const AUDIT_STATUSES = [
  'queued',
  'parsing',
  'analyzing',
  'manual_review',
  'findings_ready',
  'failed',
]

export const AUDIT_STATUS_LABELS = {
  queued: 'Queued',
  parsing: 'Parsing',
  analyzing: 'Analyzing',
  manual_review: 'Needs Review',
  findings_ready: 'Findings Ready',
  failed: 'Failed',
}

export function statusClassName(status) {
  return 'audit-status-' + status
}
