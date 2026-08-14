import { useEffect, useState } from 'react'
import { listContractorMessages, sendContractorMessage } from '../lib/queries'

function formatTime(value) {
  return value ? new Date(value).toLocaleString() : ''
}

// Same thread contractors see in their portal (portal.html) - reading
// it here means Keri doesn't have to log into portal-admin.html
// separately just to check messages.
function ContractorCommunications({ contractorId }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const data = await listContractorMessages(contractorId)
      setMessages(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [contractorId])

  async function handleSend(e) {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    setError(null)
    try {
      await sendContractorMessage(contractorId, reply.trim())
      setReply('')
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <p>Loading…</p>

  return (
    <div>
      {error && <p className="form-error">{error}</p>}
      <ul className="comments-list">
        {messages.map((m) => (
          <li key={m.id} className={m.sender === 'bon' ? 'comm-bon' : 'comm-contractor'}>
            <div className="comment-meta">
              <span className="comment-author">{m.sender === 'bon' ? 'BON' : 'Contractor'}</span>
              <span className="comment-time">{formatTime(m.created_at)}</span>
            </div>
            <p className="comment-body">{m.message}</p>
          </li>
        ))}
        {messages.length === 0 && <li className="actions-empty">No messages yet.</li>}
      </ul>

      <form className="comments-add" onSubmit={handleSend}>
        <textarea
          rows={2}
          placeholder="Reply to this contractor…"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
        <button type="submit" disabled={sending}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default ContractorCommunications
