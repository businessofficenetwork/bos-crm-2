// AI-powered fallback for estimate PDFs whose text layer is garbled or
// missing (scanned/flattened pages). Only ever called when
// ANTHROPIC_API_KEY is set — see audit-run.js.
//
// Sends the PDF straight to Claude as a native document content block,
// instead of the earlier approach of rendering each page to an image via
// pdf.js/pdf-parse's getScreenshot(). That path needed a `canvas` native
// module that was never installed and doesn't reliably cross-compile for
// Netlify's Linux Functions runtime (built on Windows here) — this
// sidesteps rendering entirely, so there's nothing left to compile.
// Structured outputs (output_config.format) guarantee the response is
// valid JSON matching the schema below, rather than hoping the model
// wraps a JSON array in the right way.

import Anthropic from '@anthropic-ai/sdk'

const MAX_PDF_BYTES = 32 * 1024 * 1024 // Anthropic's per-request limit

const SYSTEM_PROMPT = `You extract structured line-item data from insurance estimate documents.
Return ONLY the facts printed on the page: item code/number, description, quantity, unit, unit
price, RCV (replacement cost value), and ACV (actual cash value) where present. Do not add
commentary, coverage opinions, or judgments about whether items should be covered. Skip sections
with no line items (cover letter, legal text, summary totals).`

const LINE_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    line_items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: ['string', 'null'] },
          description: { type: 'string' },
          qty: { type: ['number', 'null'] },
          unit: { type: ['string', 'null'] },
          unit_price: { type: ['number', 'null'] },
          rcv: { type: ['number', 'null'] },
          acv: { type: ['number', 'null'] },
        },
        required: ['code', 'description', 'qty', 'unit', 'unit_price', 'rcv', 'acv'],
        additionalProperties: false,
      },
    },
  },
  required: ['line_items'],
  additionalProperties: false,
}

async function parseWithClaude(pdfBuffer) {
  if (pdfBuffer.length > MAX_PDF_BYTES) {
    throw new Error(
      `PDF is ${(pdfBuffer.length / 1024 / 1024).toFixed(1)}MB, over Claude's 32MB request limit`
    )
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      output_config: {
        effort: 'high',
        format: { type: 'json_schema', schema: LINE_ITEM_SCHEMA },
      },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBuffer.toString('base64'),
              },
            },
            { type: 'text', text: 'Extract every line item from this estimate document.' },
          ],
        },
      ],
    })
  } catch (err) {
    // Anthropic's own message for this case is accurate but easy to miss
    // buried in a JSON error blob on a kanban card - surfacing it as its
    // own clearly-labeled case so it reads as an action item, not a bug.
    if (err.message && err.message.includes('credit balance is too low')) {
      throw new Error('Needs Anthropic credits — add funds at console.anthropic.com, then Run again.')
    }
    throw err
  }

  if (message.stop_reason === 'refusal') {
    throw new Error('Claude declined to process this document')
  }

  const textBlock = message.content.find((block) => block.type === 'text')
  if (!textBlock) return []

  const parsed = JSON.parse(textBlock.text)
  return parsed.line_items
}

export { parseWithClaude }
