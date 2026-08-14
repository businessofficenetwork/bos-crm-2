// Pulls entries from the separate SUPP/KB tool (bosknowledge.netlify.app)
// for use as justification source material when drafting a findings
// email. That tool has no API/backend - it's a static single-page app
// with all its content embedded as a JS array literal in the page's
// own HTML (confirmed directly: no separate JSON/data requests, no
// localStorage - just `const DEFAULT_CATEGORIES = [...]` in the
// served HTML itself). This fetches that public page and evaluates
// just that one array-literal expression to get the real data back
// out, rather than re-typing or guessing at its content.

const KB_URL = 'https://bosknowledge.netlify.app/'

export async function fetchKnowledgeBase() {
  const res = await fetch(KB_URL)
  if (!res.ok) throw new Error(`Could not reach knowledge base (${res.status})`)
  const html = await res.text()

  const startMarker = 'const DEFAULT_CATEGORIES = ['
  const startIdx = html.indexOf(startMarker)
  if (startIdx === -1) throw new Error('Knowledge base page structure has changed - DEFAULT_CATEGORIES not found')

  // Bracket-matched scan for the closing `]` of the array literal,
  // rather than a regex, since entry bodies contain arbitrary text
  // (including square brackets) that would break a naive match.
  let depth = 0
  let i = startIdx + startMarker.length - 1 // start at the opening '['
  for (; i < html.length; i++) {
    if (html[i] === '[') depth++
    else if (html[i] === ']') {
      depth--
      if (depth === 0) break
    }
  }
  const arrayLiteral = html.slice(startIdx + startMarker.length - 1, i + 1)

  // eslint-disable-next-line no-new-func
  const categories = new Function(`return (${arrayLiteral})`)()

  const entries = []
  for (const cat of categories) {
    for (const entry of cat.entries || []) {
      entries.push({ category: cat.label, ...entry })
    }
  }
  return entries
}
