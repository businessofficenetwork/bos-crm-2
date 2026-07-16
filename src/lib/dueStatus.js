const DUE_SOON_DAYS = 3

export function dueStatus(item) {
  if (item.completed || !item.due_date) return null

  const today = new Date().toISOString().slice(0, 10)
  if (item.due_date < today) return 'overdue'

  const soon = new Date()
  soon.setDate(soon.getDate() + DUE_SOON_DAYS)
  const soonStr = soon.toISOString().slice(0, 10)
  if (item.due_date <= soonStr) return 'due-soon'

  return null
}
