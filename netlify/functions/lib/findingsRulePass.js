// Evaluates the active audit_rules against a parsed estimate (plus,
// when available, the measurement report and roof/property photos) in
// one Claude call. Each rule's detection_prompt is model-judged, not
// pattern-matched — this is the "rule pass" from BON_BUILD_SEQUENCE.md
// Phase A3 step 2.
//
// Compliance guard (CLAUDE.md, non-negotiable): findings must read as
// scope/quantity/code documentation only. No coverage-opinion language
// ("the carrier should cover", "this is owed") — that boundary is
// enforced structurally here in the system prompt, not left to review.

import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You audit insurance repair estimates against a set of detection rules written by an experienced Xactimate estimator. For each rule, determine whether the estimate (and, when provided, the property measurement report and photos) shows the pattern the rule describes.

Report ONLY technical scope, quantity, and code documentation: what is priced, what is missing, what the measurements or photos show, and the dollar difference. Never phrase a finding as a coverage opinion — do not write phrases like "the carrier should cover this" or "this is owed." State facts a scope reviewer would write in a technical memo, not a legal or coverage conclusion.

Only report a finding when a rule's pattern is actually present. If a rule does not apply or there isn't enough information to tell (e.g. a rule needs photos and none were provided), do not include it in the findings — leave it out entirely rather than guessing.`

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rule_id: { type: 'string' },
          tier: { type: 'integer' },
          line_item: { type: 'string' },
          shortfall_type: { type: 'string' },
          est_value: { type: ['number', 'null'] },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
          rationale: { type: 'string' },
        },
        required: ['rule_id', 'tier', 'line_item', 'shortfall_type', 'est_value', 'confidence', 'rationale'],
        additionalProperties: false,
      },
    },
  },
  required: ['findings'],
  additionalProperties: false,
}

function imageMediaType(path) {
  const ext = (path.split('.').pop() || '').toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  return null
}

// rules: audit_rules rows (id, tier, category, detection_prompt, reference_value)
// parsedEstimate: { line_items: [...] } from the parse step
// measurementReport: { buffer } | null
// photos: [{ path, buffer }] — entries with an unrecognized extension are skipped
export async function runFindingsRulePass({ rules, parsedEstimate, measurementReport, photos = [] }) {
  if (!rules || rules.length === 0) {
    return { findings: [], estTotalRecovery: 0 }
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const rulesForPrompt = rules.map((r) => ({
    rule_id: r.id,
    tier: r.tier,
    category: r.category,
    detection_prompt: r.detection_prompt,
  }))

  const content = [
    {
      type: 'text',
      text:
        `Rules to check:\n${JSON.stringify(rulesForPrompt, null, 2)}\n\n` +
        `Parsed estimate line items:\n${JSON.stringify(parsedEstimate.line_items, null, 2)}` +
        (measurementReport ? '\n\nThe property measurement report is attached as a document.' : '') +
        (photos.length ? `\n\n${photos.length} property/roof photo(s) are attached as images.` : ''),
    },
  ]

  if (measurementReport) {
    content.push({
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: measurementReport.buffer.toString('base64'),
      },
    })
  }

  for (const photo of photos) {
    const mediaType = imageMediaType(photo.path)
    if (!mediaType) continue
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: photo.buffer.toString('base64') },
    })
  }

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      output_config: {
        effort: 'high',
        format: { type: 'json_schema', schema: FINDINGS_SCHEMA },
      },
      messages: [{ role: 'user', content }],
    })
  } catch (err) {
    if (err.message && err.message.includes('credit balance is too low')) {
      throw new Error('Needs Anthropic credits — add funds at console.anthropic.com, then Run again.')
    }
    throw err
  }

  if (message.stop_reason === 'refusal') {
    throw new Error('Claude declined to process this audit')
  }

  const textBlock = message.content.find((block) => block.type === 'text')
  const findings = textBlock ? JSON.parse(textBlock.text).findings : []
  const estTotalRecovery = findings.reduce((sum, f) => sum + (Number(f.est_value) || 0), 0)

  return { findings, estTotalRecovery }
}
