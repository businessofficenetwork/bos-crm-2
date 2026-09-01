import { useEffect, useState } from 'react'
import { listKbCategories, getKbEntry, createKbEntry, deleteKbEntry } from '../lib/queries'
import KbBody from '../components/KbBody'
import './KnowledgeBase.css'

function matches(text, term) {
  return (text || '').toLowerCase().includes(term)
}

function KnowledgeBase() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [expandedEntry, setExpandedEntry] = useState(null)
  const [entryLoading, setEntryLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newTags, setNewTags] = useState('')
  const [newBody, setNewBody] = useState('')
  const [saving, setSaving] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      setCategories(await listKbCategories())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function openEntry(id) {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedEntry(null)
      return
    }
    setExpandedId(id)
    setExpandedEntry(null)
    setEntryLoading(true)
    try {
      setExpandedEntry(await getKbEntry(id))
    } catch (err) {
      setError(err.message)
    } finally {
      setEntryLoading(false)
    }
  }

  function openCategory(id) {
    setSelectedCategoryId(id)
    setExpandedId(null)
    setExpandedEntry(null)
    setShowAddForm(false)
    setSearch('')
  }

  async function handleAddEntry(e) {
    e.preventDefault()
    if (!newTitle.trim() || !newBody.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createKbEntry({
        id: crypto.randomUUID(),
        category_id: selectedCategoryId,
        title: newTitle.trim(),
        tags: newTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        body: newBody.trim(),
      })
      setNewTitle('')
      setNewTags('')
      setNewBody('')
      setShowAddForm(false)
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteEntry(entry) {
    if (!window.confirm(`Delete "${entry.title}"? This cannot be undone.`)) return
    setError(null)
    try {
      await deleteKbEntry(entry.id)
      if (expandedId === entry.id) {
        setExpandedId(null)
        setExpandedEntry(null)
      }
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const term = search.trim().toLowerCase()

  // Flat search across every category/entry, by title/tag - used only on
  // the dashboard so it doesn't need entry bodies (kept out of the
  // lightweight listKbCategories query for payload size).
  const searchResults = term
    ? categories.flatMap((cat) =>
        (cat.entries || [])
          .filter((e) => matches(e.title, term) || (e.tags || []).some((t) => matches(t, term)))
          .map((e) => ({ ...e, categoryId: cat.id, categoryLabel: cat.label }))
      )
    : []

  return (
    <div className="knowledge-base">
      <div className="contractors-header">
        <h1>Knowledge Base</h1>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !selectedCategoryId && (
        <>
          <input
            className="contractors-search"
            type="search"
            placeholder="Search across every category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {term ? (
            <ul className="kb-search-results">
              {searchResults.map((e) => (
                <li key={e.id}>
                  <button type="button" className="row-link" onClick={() => openCategory(e.categoryId)}>
                    {e.title}
                  </button>
                  <span className="kb-search-result-category">{e.categoryLabel}</span>
                </li>
              ))}
              {searchResults.length === 0 && <li className="actions-empty">No matches.</li>}
            </ul>
          ) : (
            <div className="kb-category-grid">
              {categories.map((cat) => (
                <button
                  type="button"
                  className="kb-category-tile"
                  key={cat.id}
                  onClick={() => openCategory(cat.id)}
                >
                  <h3>{cat.label}</h3>
                  <p>{cat.description}</p>
                  <span className="kb-category-count">{(cat.entries || []).length} entries</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && selectedCategory && (
        <div className="kb-category-view">
          <button type="button" className="row-link kb-back" onClick={() => openCategory(null)}>
            ← All categories
          </button>
          <h2>{selectedCategory.label}</h2>
          <p className="guide-intro">{selectedCategory.description}</p>

          <input
            className="contractors-search"
            type="search"
            placeholder="Filter entries in this category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <ul className="kb-entry-list">
            {(selectedCategory.entries || [])
              .filter((e) => !term || matches(e.title, term) || (e.tags || []).some((t) => matches(t, term)))
              .map((e) => (
                <li key={e.id} className="kb-entry-item">
                  <button type="button" className="kb-entry-toggle" onClick={() => openEntry(e.id)}>
                    {expandedId === e.id ? '▾' : '▸'} {e.title}
                  </button>
                  {expandedId === e.id && (
                    <div className="kb-entry-detail">
                      {entryLoading && <p>Loading…</p>}
                      {expandedEntry && (
                        <>
                          {expandedEntry.tags?.length > 0 && (
                            <div className="kb-tag-row">
                              {expandedEntry.tags.map((t) => (
                                <span className="kb-tag" key={t}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                          <KbBody body={expandedEntry.body} />
                          <button
                            type="button"
                            className="row-link"
                            onClick={() => handleDeleteEntry(expandedEntry)}
                          >
                            Delete this entry
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
            {(selectedCategory.entries || []).length === 0 && (
              <li className="actions-empty">No entries in this category yet.</li>
            )}
          </ul>

          {showAddForm ? (
            <form className="claim-form" onSubmit={handleAddEntry}>
              <label>
                Title
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
              </label>
              <label>
                Tags (comma separated)
                <input value={newTags} onChange={(e) => setNewTags(e.target.value)} />
              </label>
              <label className="form-notes">
                Body
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  rows={6}
                  required
                />
              </label>
              <div className="form-actions">
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Add Entry'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} disabled={saving}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => setShowAddForm(true)}>
              + Add Entry
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default KnowledgeBase
