const COMPLEXITY_ORDER = { roof_only: 0, multiple_trades: 1, complex: 2 }

export const SORT_OPTIONS = [
  { value: 'received', label: 'Date Received' },
  { value: 'submitted', label: 'Date Submitted' },
  { value: 'due', label: 'Due Date' },
  { value: 'complexity', label: 'Complexity' },
]

export function sortValue(sortKey, supplement, nextAction) {
  switch (sortKey) {
    case 'submitted':
      return supplement.submitted_date || ''
    case 'due':
      return nextAction?.due_date || '9999-99-99'
    case 'complexity':
      return COMPLEXITY_ORDER[supplement.complexity] ?? 9
    case 'received':
    default:
      return supplement.intake_date || supplement.created_at || ''
  }
}
