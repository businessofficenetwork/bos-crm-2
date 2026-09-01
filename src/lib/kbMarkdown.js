// Minimal markdown-lite parser for Knowledge Base entry bodies: paragraphs
// separated by blank lines, "- " lines grouped into bullet lists, and
// **bold** inline. Matches the formatting convention already used in the
// KB's existing entry text - not a general markdown parser.

function splitBold(line) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) => {
    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      return { bold: true, text: chunk.slice(2, -2), key: i }
    }
    return { bold: false, text: chunk, key: i }
  })
}

export function parseKbBody(body) {
  const blocks = (body || '').split(/\n\n+/).filter((b) => b.trim())
  return blocks.map((block) => {
    const lines = block.split('\n').filter((l) => l.trim())
    const isList = lines.length > 0 && lines.every((l) => l.trim().startsWith('- '))
    if (isList) {
      return { type: 'list', items: lines.map((l) => splitBold(l.trim().slice(2))) }
    }
    return { type: 'paragraph', lines: lines.map(splitBold) }
  })
}
