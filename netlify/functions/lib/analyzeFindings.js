// Tier 2: rules-based checklist audit. Takes the parsed estimate from
// Tier 1 (audit-run.js) plus the active audit_rules checklist, and asks
// Claude to judge which rules apply to this specific estimate —
// judgment the deterministic Tier 1 parser can't do (e.g. "does the
// ridge cap line item match the roof's actual shingle type"). The model
// is scoped to ONLY the rules it's given; it can't invent a finding
// against a rule_id that isn't in the checklist.
//
// NOTE: like visionParse.js, this has no live-API test yet (no
// ANTHROPIC_API_KEY configured as of this writing) — see
// scripts/test-tier2-analyze.js for what IS verified without a key
// (rule selection, prompt construction, response validation) and what's
// still pending a real call.

import Anthropic from '@anthropic-ai/sdk'

const VALID_CONFIDENCE = ['low', 'medium', 'high']

const SYSTEM_PROMPT = `You are auditing an insurance repair/replacement estimate against a fixed checklist of known scope gaps. You will be given a numbered checklist of rules (each with an id and a detection instruction) and the estimate's line items as extracted text.

For each rule, decide whether the estimate actually exhibits that gap. Only flag a rule if the estimate's own text supports it — do not guess or infer facts that aren't present in the given line items. If the information needed to judge a rule isn't present in the estimate text (e.g. it requires photos or a measurement report you weren't given), do not flag it.

Rules:
- Only use rule_id values from the checklist you were given. Never invent a rule_id or describe a gap that isn't one of the listed rules.
- tier must match the tier given for that rule_id in the checklist.
- confidence must be one of: low, medium, high.
- est_value is a dollar estimate of the recovery impact if you can support one from the text, otherwise null.
- rationale must cite the specific line item text or figures that support the finding.

Return ONLY a JSON array (no other text) of objects: {rule_id, tier, line_item, shortfall_type, est_value, confidence, rationale}. Return an empty array if no rules are triggered.`

// Filters the full audit_rules table down to what applies to this
// audit: active rules only, and carrier_filter either unset or
// including this audit's carrier.
function selectApplicableRules(rules, { carrier } = {}) {
  return rules.filter((rule) => {
    if (!rule.active) return false
    if (!rule.carrier_filter || rule.carrier_filter.length === 0) return true
    if (!carrier) return false
    return rule.carrier_filter.includes(carrier)
  })
}

function formatLineItems(lineItems) {
  return lineItems
    .map((item) => {
      const parts = [`${item.code}. ${item.description}`, `qty ${item.qty} ${item.unit}`]
      if (item.unit_price != null) parts.push(`unit price $${item.unit_price}`)
      if (item.rcv != null) parts.push(`RCV $${item.rcv}`)
      if (item.acv != null) parts.push(`ACV $${item.acv}`)
      return `- ${parts.join(' | ')}`
    })
    .join('\n')
}

function buildAnalysisPrompt(rules, lineItems) {
  const checklist = rules
    .map((rule) => `- id: ${rule.id}\n  tier: ${rule.tier}\n  category: ${rule.category || 'n/a'}\n  detection: ${rule.detection_prompt}`)
    .join('\n')

  return `Checklist:\n${checklist}\n\nEstimate line items:\n${formatLineItems(lineItems)}`
}

// Validates and filters the model's raw response against the rule set
// it was actually given — this is the enforcement point for "never
// invent a citation." Anything that doesn't match a real rule_id/tier
// pair, or has a malformed confidence value, is dropped rather than
// passed through.
function parseFindingsResponse(rawText, rules) {
  const ruleById = new Map(rules.map((r) => [r.id, r]))

  const jsonMatch = rawText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  let parsed
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  return parsed.filter((finding) => {
    if (!finding || typeof finding !== 'object') return false
    const rule = ruleById.get(finding.rule_id)
    if (!rule) return false
    if (finding.tier !== rule.tier) return false
    if (!VALID_CONFIDENCE.includes(finding.confidence)) return false
    if (typeof finding.rationale !== 'string' || !finding.rationale.trim()) return false
    return true
  })
}

async function runTier2Analysis({ rules, carrier, lineItems, apiKey }) {
  const applicableRules = selectApplicableRules(rules, { carrier })
  if (applicableRules.length === 0) return []

  const anthropic = new Anthropic({ apiKey })
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildAnalysisPrompt(applicableRules, lineItems) }],
  })

  const text = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')

  return parseFindingsResponse(text, applicableRules)
}

export { selectApplicableRules, buildAnalysisPrompt, parseFindingsResponse, runTier2Analysis }
