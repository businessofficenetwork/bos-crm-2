import { useEffect, useState } from 'react'
import LeadForm from '../components/LeadForm'
import { listLeads, createLead, updateLead } from '../lib/queries'
import './Contractors.css'

function truncate(text, max = 60) {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '…' : text
}

function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, object = editing

  async function refresh(term = search) {
    setLoading(true)
    setError(null)
    try {
      const data = await listLeads(term)
      setLeads(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh('')
  }, [])

  function handleSearchChange(e) {
    const value = e.target.value
    setSearch(value)
    refresh(value)
  }

  async function handleSubmit(form) {
    if (editing.id) {
      await updateLead(editing.id, form)
    } else {
      await createLead(form)
    }
    setEditing(null)
    await refresh()
  }

  return (
    <div>
      <div className="contractors-header">
        <h1>Leads</h1>
        <div className="header-actions">
          <button type="button" onClick={() => setEditing({})}>
            Add Lead
          </button>
        </div>
      </div>

      <input
        className="contractors-search"
        type="search"
        placeholder="Search by name, company, or email…"
        value={search}
        onChange={handleSearchChange}
      />

      {editing && (
        <LeadForm
          initialValues={editing}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
        />
      )}

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && (
        <table className="contractors-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Message</th>
              <th>Source</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td>{l.company}</td>
                <td>{l.phone}</td>
                <td>{l.email}</td>
                <td>{truncate(l.message)}</td>
                <td>{l.source}</td>
                <td>{l.status}</td>
                <td>
                  <button type="button" onClick={() => setEditing(l)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={8}>No leads found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Leads
