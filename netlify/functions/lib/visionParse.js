// AI-powered fallback for estimate PDFs whose text layer is garbled or
// missing (scanned/flattened pages). Only ever called when
// ANTHROPIC_API_KEY is set — see audit-run.js. Renders each page as an
// image and asks the model to read it directly, sidestepping whatever
// broke the text extraction.
//
// NOTE: this path has no automated test yet (requires a real API key,
// which isn't configured as of this writing). Per CLAUDE.md, it must
// get a real local invocation test before it's ever relied on for a
// live audit — treat it as unverified until then.

import Anthropic from '@anthropic-ai/sdk'

const MAX_PAGES = 20

const SYSTEM_PROMPT = `You extract structured line-item data from insurance estimate document pages.
Return ONLY the facts printed on the page: item description, quantity, unit, unit price, RCV
(replacement cost value), and ACV (actual cash value) where present. Do not add commentary,
coverage opinions, or judgments about whether items should be covered. If a page has no line
items (cover letter, legal text, summary totals), return an empty array for it.`

function buildUserContent(pageImages) {
  const content = [
    {
      type: 'text',
      text: `Extract all line items from these ${pageImages.length} estimate pages. Return a single JSON array (across all pages) of objects: {code, description, qty, unit, unit_price, rcv, acv}. Return ONLY the JSON array, no other text.`,
    },
  ]
  for (const img of pageImages) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: img.toString('base64') },
    })
  }
  return content
}

async function parseWithVision(parser) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const info = await parser.getText()
  const pageCount = Math.min(info.pages.length, MAX_PAGES)

  const screenshots = await parser.getScreenshot({ first: 1, last: pageCount })
  const images = screenshots.pages.map((p) => p.data)

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserContent(images) }],
  })

  const text = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')

  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  return JSON.parse(jsonMatch[0])
}

export { parseWithVision }
