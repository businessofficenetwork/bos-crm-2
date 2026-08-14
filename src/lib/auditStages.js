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

// Which of the three required documents an audit is still missing -
// used both for the "waiting on X" display and for gating whether
// Run Parser should even be attempted.
export function missingDocuments(audit) {
  const missing = []
  if (!audit.estimate_pdf_path) missing.push('Estimate')
  if (!audit.measurement_report_path) missing.push('Measurement Report')
  if (!audit.photos_paths || audit.photos_paths.length === 0) missing.push('Photos')
  return missing
}
