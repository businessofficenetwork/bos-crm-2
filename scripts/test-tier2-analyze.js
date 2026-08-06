// Standalone test for Tier 2 (rules-based checklist audit), per the
// CLAUDE.md rule that every pipeline stage gets a command-line test with
// input before it's wired into anything else.
//
// Run: node scripts/test-tier2-analyze.js
//
// Rule selection, prompt construction, and response validation are pure
// functions and get real assertions here, no API key needed. The actual
// Claude call (runTier2Analysis) only runs if ANTHROPIC_API_KEY is set —
// same gating as visionParse.js — otherwise this prints a clear notice
// instead of silently skipping it.

import assert from 'node:assert/strict'
import {
  selectApplicableRules,
  buildAnalysisPrompt,
  parseFindingsResponse,
  runTier2Analysis,
} from '../netlify/functions/lib/analyzeFindings.js'

const RULES = [
  {
    id: 'ridge_cap_standalone_lkq',
    tier: 1,
    category: 'roofing',
    carrier_filter: null,
    detection_prompt: 'Check whether ridge cap is priced as cut-3-tab instead of a standalone product.',
    active: true,
  },
  {
    id: 'waste_factor_mismatch',
    tier: 1,
    category: 'quantity',
    carrier_filter: null,
    detection_prompt: 'Compare applied waste percentage against the measurement report.',
    active: true,
  },
  {
    id: 'state_farm_only_rule',
    tier: 2,
    category: 'roofing',
    carrier_filter: ['State Farm'],
    detection_prompt: 'A rule that only applies to State Farm estimates.',
    active: true,
  },
  {
    id: 'inactive_rule',
    tier: 1,
    category: 'roofing',
    carrier_filter: null,
    detection_prompt: 'Should never be selected.',
    active: false,
  },
]

const LINE_ITEMS = [
  { code: '1', description: 'Hip / Ridge cap - cut from 3 tab - composition shingles', qty: 42, unit: 'LF', unit_price: 3.5, rcv: 147.0, acv: 147.0 },
  { code: '2', description: 'Laminated - comp. shingle rfg. - w/out felt', qty: 28.5, unit: 'SQ', unit_price: 285.0, rcv: 8122.5, acv: 7300.0 },
]

let failures = 0
function check(name, fn) {
  try {
    fn()
    console.log(`ok   - ${name}`)
  } catch (err) {
    failures++
    console.log(`FAIL - ${name}`)
    console.log(`       ${err.message}`)
  }
}

check('selectApplicableRules: no carrier -> only carrier_filter=null, active rules', () => {
  const result = selectApplicableRules(RULES, {})
  const ids = result.map((r) => r.id)
  assert.deepEqual(ids, ['ridge_cap_standalone_lkq', 'waste_factor_mismatch'])
})

check('selectApplicableRules: matching carrier -> includes carrier-specific rule', () => {
  const result = selectApplicableRules(RULES, { carrier: 'State Farm' })
  const ids = result.map((r) => r.id)
  assert.ok(ids.includes('state_farm_only_rule'))
  assert.ok(!ids.includes('inactive_rule'))
})

check('selectApplicableRules: non-matching carrier -> excludes carrier-specific rule', () => {
  const result = selectApplicableRules(RULES, { carrier: 'USAA' })
  const ids = result.map((r) => r.id)
  assert.ok(!ids.includes('state_farm_only_rule'))
})

check('buildAnalysisPrompt: includes rule ids, detection prompts, and line items', () => {
  const applicable = selectApplicableRules(RULES, {})
  const prompt = buildAnalysisPrompt(applicable, LINE_ITEMS)
  assert.ok(prompt.includes('ridge_cap_standalone_lkq'))
  assert.ok(prompt.includes('Compare applied waste percentage'))
  assert.ok(prompt.includes('Hip / Ridge cap'))
  assert.ok(prompt.includes('RCV $147'))
})

check('parseFindingsResponse: accepts a valid finding', () => {
  const applicable = selectApplicableRules(RULES, {})
  const raw = JSON.stringify([
    {
      rule_id: 'ridge_cap_standalone_lkq',
      tier: 1,
      line_item: 'Hip / Ridge cap - cut from 3 tab',
      shortfall_type: 'missing_standalone_ridge_cap',
      est_value: 200,
      confidence: 'high',
      rationale: 'Line 1 prices ridge cap as cut-3-tab while line 2 is a laminated/architectural shingle.',
    },
  ])
  const findings = parseFindingsResponse(raw, applicable)
  assert.equal(findings.length, 1)
  assert.equal(findings[0].rule_id, 'ridge_cap_standalone_lkq')
})

check('parseFindingsResponse: drops an invented rule_id', () => {
  const applicable = selectApplicableRules(RULES, {})
  const raw = JSON.stringify([
    { rule_id: 'made_up_rule', tier: 1, confidence: 'high', rationale: 'not a real rule' },
  ])
  assert.deepEqual(parseFindingsResponse(raw, applicable), [])
})

check('parseFindingsResponse: drops a tier mismatch', () => {
  const applicable = selectApplicableRules(RULES, {})
  const raw = JSON.stringify([
    { rule_id: 'ridge_cap_standalone_lkq', tier: 2, confidence: 'high', rationale: 'wrong tier' },
  ])
  assert.deepEqual(parseFindingsResponse(raw, applicable), [])
})

check('parseFindingsResponse: drops an invalid confidence value', () => {
  const applicable = selectApplicableRules(RULES, {})
  const raw = JSON.stringify([
    { rule_id: 'ridge_cap_standalone_lkq', tier: 1, confidence: 'certain', rationale: 'bad confidence' },
  ])
  assert.deepEqual(parseFindingsResponse(raw, applicable), [])
})

check('parseFindingsResponse: malformed JSON returns empty array, not a throw', () => {
  assert.deepEqual(parseFindingsResponse('not json at all', RULES), [])
})

console.log('')
if (failures > 0) {
  console.log(`${failures} check(s) failed.`)
  process.exit(1)
}
console.log('All pure-logic checks passed (rule selection, prompt construction, response validation).')

if (!process.env.ANTHROPIC_API_KEY) {
  console.log('')
  console.log('ANTHROPIC_API_KEY is not set in this environment — runTier2Analysis (the actual')
  console.log('Claude call) has NOT been exercised against the live API. Treat it as unverified')
  console.log('until it has been run once with a real key, per CLAUDE.md.')
  process.exit(0)
}

console.log('')
console.log('ANTHROPIC_API_KEY found — running a live call against the sample line items...')
const applicable = selectApplicableRules(RULES, {})
const findings = await runTier2Analysis({
  rules: applicable,
  lineItems: LINE_ITEMS,
  apiKey: process.env.ANTHROPIC_API_KEY,
})
console.log(JSON.stringify(findings, null, 2))
