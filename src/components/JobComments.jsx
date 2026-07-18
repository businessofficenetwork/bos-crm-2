import { useEffect, useState } from 'react'
import { listJobComments, createJobComment } from '../lib/queries'

function JobComments({ claimId }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [author, setAuthor] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const data = await listJobComments(claimId)
      setComments(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [claimId])

  async function handleAdd(e) {
    e.preventDefault()
    if (!body.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createJobComment({
        claim_id: claimId,
        author: author.trim() || null,
        body: body.trim(),
      })
      setBody('')
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="actions-panel">
      <h3>Comments</h3>

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && (
        <ul className="comments-list">
          {comments.map((c) => (
            <li key={c.id} className={c.body.includes('@') ? 'mention' : ''}>
              <div className="comment-meta">
                <span className="comment-author">{c.author || 'Unknown'}</span>
                <span className="comment-time">{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p className="comment-body">{c.body}</p>
            </li>
          ))}
          {comments.length === 0 && <li className="actions-empty">No comments yet.</li>}
        </ul>
      )}

      <form className="comments-add" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Your name (optional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <textarea
          placeholder="Add a comment… use @name to flag a mention"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
        />
        <button type="submit" disabled={saving}>
          {saving ? 'Posting…' : 'Post'}
        </button>
      </form>
    </div>
  )
}

export default JobComments
