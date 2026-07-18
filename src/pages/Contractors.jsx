import { useEffect, useState } from 'react'
import ContractorForm from '../components/ContractorForm'
import DetailView from '../components/DetailView'
import { listContractors, createContractor, updateContractor } from '../lib/queries'
import { toCsv, downloadCsv } from '../lib/csv'
import './Contractors.css'

function contractorFields(c) {
  return [
    { label: 'Name', value: c.name },
    { label: 'Contact Name', value: c.contact_name },
    { label: 'Phone', value: c.phone },
    { label: 'Email', value: c.email },
    { label: 'Market', value: c.market },
    { label: 'Pricing Tier', value: c.pricing_tier },
    { label: 'Status', value: c.status },
    { label: 'Notes', value: c.notes },
    { label: 'Created At', value: c.created_at },
  ]
}

const CSV_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'contact_name', label: 'Contact Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'market', label: 'Market' },
  { key: 'pricing_tier', label: 'Pricing Tier' },
  { key: 'status', label: 'Status' },
  { key: 'notes', label: 'Notes' },
  { key: 'created_at', label: 'Created At' },
]

function Contractors() {
  const [contractors, setContractors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, object = editing
  const [viewing, setViewing] = useState(null) // null = closed, object = viewing

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
    setViewing(null)
    await refresh()
  }

  function handleExport() {
    downloadCsv('contractors.csv', toCsv(contractors, CSV_COLUMNS))
  }

  return (
    <div>
      <div className="contractors-header">
        <h1>Contractors</h1>
        <div className="header-actions">
          <button type="button" onClick={handleExport} disabled={contractors.length === 0}>
            Export CSV
          </button>
          <button type="button" onClick={() => setEditing({})}>
            Add Contractor
          </button>
        </div>
      </div>

      <input
        className="contractors-search"
        type="search"
        placeholder="Search by name, contact, or email…"
        value={search}
        onChange={handleSearchChange}
      />

      {viewing && !editing && (
        <DetailView
          title={viewing.name}
          fields={contractorFields(viewing)}
          onEdit={() => {
            setEditing(viewing)
            setViewing(null)
          }}
          onClose={() => setViewing(null)}
        />
      )}

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
            </tr>
          </thead>
          <tbody>
            {contractors.map((c) => (
              <tr key={c.id}>
                <td>
                  <button type="button" className="row-link" onClick={() => setViewing(c)}>
                    {c.name}
                  </button>
                </td>
                <td>{c.contact_name}</td>
                <td>{c.phone}</td>
                <td>{c.email}</td>
                <td>{c.market}</td>
                <td>{c.pricing_tier}</td>
                <td>{c.status}</td>
              </tr>
            ))}
            {contractors.length === 0 && (
              <tr>
                <td colSpan={7}>No contractors found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Contractors
