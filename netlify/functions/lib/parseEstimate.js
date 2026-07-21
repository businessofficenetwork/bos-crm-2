// Free, no-AI parser for Xactimate estimate text. Handles the common
// "N. description" + "qty unit ...amounts... [age/life] [(deprec)] acv"
// two-line-per-item pattern. Column layouts vary by carrier (some have
// O&P, some show depreciation as a %, some don't show age/life at all
// for brand-new items) — this only trusts what's structurally
// unambiguous: quantity, unit, and RCV/ACV, which are reliably the
// second-to-last and last dollar amounts once age/life and the
// parenthesized depreciation figure are stripped out.

const UNIT_CODES =
  /^(SQ|EA|LF|SF|HR|DA|MO|WK|CY|CF|GAL|LB|TON|PR|RL|BG|BX|SET|SY)$/i
const AGE_LIFE_RE = /^\d+\/(?:\d+\s*yrs?|NA)$/i
const MONEY_RE = /^\(?-?[\d,]+\.\d+\)?$/
// A leading "* " marks a flagged item (e.g. non-recoverable
// depreciation) in some Xactimate exports — optional, doesn't change
// how the item itself is parsed.
const ITEM_START_RE = /^\*?\s*(\d+)\.\s+(.+)$/

const COMMON_WORDS = ['the', 'and', 'date', 'claim', 'estimate', 'total']

function toNumber(token) {
  const negative = token.startsWith('(') && token.endsWith(')')
  const cleaned = token.replace(/[(),]/g, '')
  const value = parseFloat(cleaned)
  return negative ? -value : value
}

// Decides whether extracted text is usable as-is, or needs the
// (currently gated) vision fallback.
function classifyText(text) {
  const stripped = text.replace(/-- \d+ of \d+ --/g, '').trim()
  if (stripped.length < 200) return 'empty'

  const lower = stripped.toLowerCase()
  const hits = COMMON_WORDS.filter((w) => new RegExp(`\\b${w}\\b`).test(lower)).length
  if (hits < 2) return 'garbled'

  return 'clean'
}

// Given a token array expected to start with "qty unit ...", parses the
// rest into unit_price/rcv/acv/age_life/deprec, or returns null if it
// doesn't look like a real numbers row.
function tryParseNumberTokens(tokens) {
  if (tokens.length < 4) return null

  const qty = toNumber(tokens[0])
  const unit = tokens[1]
  if (Number.isNaN(qty) || !UNIT_CODES.test(unit)) return null

  let ageLife = null
  let deprec = null
  const amounts = []

  for (const token of tokens.slice(2)) {
    if (AGE_LIFE_RE.test(token)) {
      ageLife = token
    } else if (token.startsWith('(') && MONEY_RE.test(token)) {
      deprec = toNumber(token)
    } else if (MONEY_RE.test(token)) {
      amounts.push(toNumber(token))
    }
    // ignore stray tokens (e.g. "yrs" split separately, "Avg." labels)
  }

  if (amounts.length < 2) return null // need at least unit_price + RCV

  return {
    qty,
    unit,
    unit_price: amounts[0],
    rcv: amounts[amounts.length - 2],
    acv: amounts[amounts.length - 1],
    age_life: ageLife,
    deprec,
  }
}

// Parses a full page of extracted text into { code, description, qty,
// unit, unit_price, rcv, acv, age_life, deprec } line items. Handles
// two different real-world layouts: description and numbers on
// separate lines, or both on the same line (varies by export style).
function parseLineItems(text) {
  const lines = text.split('\n').map((l) => l.trim())
  const items = []

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(ITEM_START_RE)
    if (!match) continue

    const fullText = match[2]
    const descTokens = fullText.split(/\s+/)

    // Same-line format: scan for where "<qty> <unit>" begins within
    // the rest of this line.
    let numbers = null
    let description = fullText

    for (let j = 1; j < descTokens.length - 1; j++) {
      if (MONEY_RE.test(descTokens[j]) && UNIT_CODES.test(descTokens[j + 1])) {
        const candidate = tryParseNumberTokens(descTokens.slice(j))
        if (candidate) {
          numbers = candidate
          description = descTokens.slice(0, j).join(' ')
          break
        }
      }
    }

    // Two-line format: numbers are on the next line instead.
    if (!numbers) {
      const nextTokens = (lines[i + 1] || '').split(/\s+/).filter(Boolean)
      numbers = tryParseNumberTokens(nextTokens)
    }

    if (!numbers) continue

    items.push({
      code: String(match[1]),
      description,
      ...numbers,
    })
  }

  return items
}

// Cross-checks parsed line items against the document's own stated
// totals (e.g. "Replacement Cost Value $24,923.17"). This is the real
// safety net for the free parser — if our parsed numbers don't
// reconcile with what the document itself claims, we don't trust the
// parse, per the reconciliation-math rule in CLAUDE.md.
function reconcile(text, items) {
  const stated = []
  const re = /Replacement Cost Value\s*\$?([\d,]+\.\d+)/g
  let m
  while ((m = re.exec(text))) {
    stated.push(parseFloat(m[1].replace(/,/g, '')))
  }

  if (stated.length === 0) {
    return { ok: false, reason: 'No "Replacement Cost Value" total found in document to check against.' }
  }

  const statedTotal = stated.reduce((sum, v) => sum + v, 0)
  const parsedTotal = items.reduce((sum, item) => sum + (item.rcv || 0), 0)
  const diff = Math.abs(statedTotal - parsedTotal)
  const tolerance = Math.max(1, statedTotal * 0.01) // 1% or $1, whichever is larger

  if (diff > tolerance) {
    return {
      ok: false,
      reason: `Parsed line items sum to $${parsedTotal.toFixed(2)}, document states $${statedTotal.toFixed(2)} (diff $${diff.toFixed(2)}).`,
    }
  }

  return { ok: true, statedTotal, parsedTotal }
}

export { classifyText, parseLineItems, reconcile }
