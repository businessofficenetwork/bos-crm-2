import { useEffect, useState } from 'react'
import ContractorForm from '../components/ContractorForm'
import { listContractors, createContractor, updateContractor } from '../lib/queries'
import './Contractors.css'

function Contractors() {
  const [contractors, setContractors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, object = editing

  async function refresh(term = search) {
    setLoading(true)
    setError(null)
    try {
      const data = await listContractors(term)
      setContractors(data)
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
      await updateContractor(editing.id, form)
    } else {
      await createContractor(form)
    }
    setEditing(null)
    await refresh()
  }

  return (
    <div>
      <div className="contractors-header">
        <h1>Contractors</h1>
        <button type="button" onClick={() => setEditing({})}>
          Add Contractor
        </button>
      </div>

      <input
        className="contractors-search"
        type="search"
        placeholder="Search by name, contact, or email…"
        value={search}
        onChange={handleSearchChange}
      />

      {editing && (
        <ContractorForm
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
              <th>Contact</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Market</th>
              <th>Tier</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contractors.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.contact_name}</td>
                <td>{c.phone}</td>
                <td>{c.email}</td>
                <td>{c.market}</td>
                <td>{c.pricing_tier}</td>
                <td>{c.status}</td>
                <td>
                  <button type="button" onClick={() => setEditing(c)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {contractors.length === 0 && (
              <tr>
                <td colSpan={8}>No contractors found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Contractors
