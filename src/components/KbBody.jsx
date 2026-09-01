import { parseKbBody } from '../lib/kbMarkdown'

function InlineText({ chunks }) {
  return chunks.map((c) =>
    c.bold ? <strong key={c.key}>{c.text}</strong> : <span key={c.key}>{c.text}</span>
  )
}

function KbBody({ body }) {
  const blocks = parseKbBody(body)
  return (
    <div className="kb-body">
      {blocks.map((block, i) =>
        block.type === 'list' ? (
          <ul key={i}>
            {block.items.map((item, j) => (
              <li key={j}>
                <InlineText chunks={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            {block.lines.map((line, j) => (
              <span key={j}>
                <InlineText chunks={line} />
                {j < block.lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      )}
    </div>
  )
}

export default KbBody
