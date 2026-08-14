// Deterministic per-contractor color, so the same contractor always
// gets the same color everywhere (Jobs table, kanban cards) without
// needing a stored color column or Keri picking one manually. Hashes
// the contractor id into a fixed, visually-distinct palette.
const PALETTE = [
  '#3a7fd5', // blue
  '#4a9c6d', // green
  '#e8a020', // gold
  '#c0392b', // red
  '#8e44ad', // purple
  '#16a085', // teal
  '#d35400', // orange
  '#2980b9', // steel blue
  '#c2185b', // magenta
  '#7f8c8d', // grey
]

export function contractorColor(contractorId) {
  if (!contractorId) return null
  let hash = 0
  for (let i = 0; i < contractorId.length; i++) {
    hash = (hash * 31 + contractorId.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}
