// Drafts a supplement-justification email from an audit's accepted
// findings, citing the SUPP/KB knowledge base for supporting detail
// (code citations, carrier-specific notes, line-item justification).
// This is a DRAFT ONLY - per CLAUDE.md's compliance rule, there is no
// code path from AI-drafted text to something actually sent; it's
// returned as text for Keri to review, edit, and send herself.

import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You draft supplement-justification emails to a carrier/adjuster on behalf of a
roofing/restoration scope-review company. You are given accepted audit findings for one claim and a
set of knowledge-base reference entries (code citations, carrier notes, line-item justifications).

Compliance rules, non-negotiable:
- Every justification must read as technical scope, quantity, or code documentation - measurements,
  code citations, manufacturer specs, like-kind-and-quality standards, quantity math.
- NEVER use coverage-opinion language. Do not write "the carrier should cover this," "this is owed,"
  "you are required to pay," or anything asserting a coverage/legal conclusion. State the technical
  facts and let the adjuster draw their own conclusion.
- Only cite a knowledge-base entry if it is genuinely relevant to that specific finding. Do not force
  a citation that doesn't fit. It is fine to write a finding's justification with no citation if
  nothing in the provided entries actually applies.
- Do not invent facts, code sections, or measurements not present in the finding or the cited entry.

Write one paragraph per finding: state what the finding is, the technical justification, and the
dollar difference. Professional, direct, no fluff. Output a subject line and a body - plain text,
no markdown formatting (this goes into an email).`

const SCHEMA = {
  type: 'object',
  properties: {
    subject: { type: 'string' },
    body: { type: 'string' },
  },
  required: ['subject', 'body'],
  additionalProperties: false,
}

// findings: audit.findings entries with review_status === 'accepted'
// claim: { property_address, claim_number, carrier }
// knowledgeBase: fetchKnowledgeBase() output
export async function draftFindingsEmail({ findings, claim, knowledgeBase }) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const kbForPrompt = (knowledgeBase || []).map((e) => ({
    category: e.category,
    title: e.title,
    tags: e.tags,
    body: e.body,
  }))

  const message = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    output_config: {
      effort: 'high',
      format: { type: 'json_schema', schema: SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: `Claim: ${claim.property_address || claim.claim_number || 'Unknown property'}${claim.carrier ? ` — ${claim.carrier}` : ''}

Accepted findings:
${JSON.stringify(findings, null, 2)}

Knowledge base reference entries:
${JSON.stringify(kbForPrompt, null, 2)}`,
      },
    ],
  })

  if (message.stop_reason === 'refusal') {
    throw new Error('Claude declined to draft this email')
  }

  const textBlock = message.content.find((block) => block.type === 'text')
  if (!textBlock) throw new Error('No draft returned')
  return JSON.parse(textBlock.text)
}
