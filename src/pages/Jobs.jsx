import { useEffect, useState } from 'react'
import ClaimForm from '../components/ClaimForm'
import { listClaims, createClaim, updateClaim, listContractors } from '../lib/queries'
import { toCsv, downloadCsv } from '../lib/csv'
import './Contractors.css'

const CSV_COLUMNS = [
  { key: 'contractor', label: 'Contractor', get: (row) => row.contractor?.name },
  { key: 'property_address', label: 'Property Address' },
  { key: 'homeowner_name', label: 'Homeowner Name' },
  { key: 'carrier', label: 'Carrier' },
  { key: 'claim_number', label: 'Claim #' },
  { key: 'adjuster_name', label: 'Adjuster Name' },
  { key: 'adjuster_contact', label: 'Adjuster Contact' },
  { key: 'date_of_loss', label: 'Date of Loss' },
  { key: 'created_at', label: 'Created At' },
]

function Jobs() {
  const [claims, setClaims] = useState([])
  const [contractors, setContractors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, object = editing

  async function refresh(term = search) {
    setLoading(true)
    setError(null)
    try {
      const data = await listClaims(term)
      setClaims(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh('')
    listContractors().then(setContractors).catch((err) => setError(err.message))
  }, [])

  function handleSearchChange(e) {
    const value = e.target.value
    setSearch(value)
    refresh(value)
  }

  async function handleSubmit(form) {
    if (editing.id) {
      await updateClaim(editing.id, form)
    } else {
      await createClaim(form)
    }
    setEditing(null)
    await refresh()
  }

  function handleExport() {
    downloadCsv('jobs.csv', toCsv(claims, CSV_COLUMNS))
  }

  return (
    <div>
      <div className="contractors-header">
        <h1>Jobs</h1>
        <div className="header-actions">
          <button type="button" onClick={handleExport} disabled={claims.length === 0}>
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setEditing({})}
            disabled={contractors.length === 0}
            title={contractors.length === 0 ? 'Add a contractor first' : undefined}
          >
            Add Job
          </button>
        </div>
      </div>

      {contractors.length === 0 && !loading && (
        <p>Add a contractor before creating a job.</p>
      )}

      <input
        className="contractors-search"
        type="search"
        placeholder="Search by address, homeowner, or claim #…"
        value={search}
        onChange={handleSearchChange}
      />

      {editing && (
        <ClaimForm
          contractors={contractors}
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
              <th>Contractor</th>
              <th>Property Address</th>
              <th>Homeowner</th>
              <th>Carrier</th>
              <th>Claim #</th>
              <th>Adjuster</th>
              <th>Date of Loss</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id}>
                <td>{c.contractor?.name}</td>
                <td>{c.property_address}</td>
                <td>{c.homeowner_name}</td>
                <td>{c.carrier}</td>
                <td>{c.claim_number}</td>
                <td>{c.adjuster_name}</td>
                <td>{c.date_of_loss}</td>
                <td>
                  <button type="button" onClick={() => setEditing(c)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {claims.length === 0 && (
              <tr>
                <td colSpan={8}>No jobs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Jobs
