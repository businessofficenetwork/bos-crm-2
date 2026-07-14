import { useEffect, useState } from 'react'
import SupplementForm from '../components/SupplementForm'
import { listSupplements, createSupplement, updateSupplement, listClaims } from '../lib/queries'
import './Contractors.css'

function money(value) {
  return value === null || value === undefined ? '' : `$${Number(value).toFixed(2)}`
}

function Pipeline() {
  const [supplements, setSupplements] = useState([])
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, object = editing

  async function refresh(term = search) {
    setLoading(true)
    setError(null)
    try {
      const data = await listSupplements(term)
      setSupplements(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh('')
    listClaims().then(setClaims).catch((err) => setError(err.message))
  }, [])

  function handleSearchChange(e) {
    const value = e.target.value
    setSearch(value)
    refresh(value)
  }

  async function handleSubmit(form) {
    if (editing.id) {
      await updateSupplement(editing.id, form)
    } else {
      await createSupplement(form)
    }
    setEditing(null)
    await refresh()
  }

  return (
    <div>
      <div className="contractors-header">
        <h1>Pipeline</h1>
        <button
          type="button"
          onClick={() => setEditing({})}
          disabled={claims.length === 0}
          title={claims.length === 0 ? 'Add a job first' : undefined}
        >
          Add Supplement
        </button>
      </div>

      {claims.length === 0 && !loading && <p>Add a job before creating a supplement.</p>}

      <input
        className="contractors-search"
        type="search"
        placeholder="Search by claim address, homeowner, or claim #…"
        value={search}
        onChange={handleSearchChange}
      />

      {editing && (
        <SupplementForm
          claims={claims}
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
              <th>Claim</th>
              <th>Contractor</th>
              <th>Stage</th>
              <th>Est. RCV</th>
              <th>Supp. Requested</th>
              <th>Supp. Approved</th>
              <th>BON Fee</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {supplements.map((s) => (
              <tr key={s.id}>
                <td>{s.claim?.property_address || s.claim?.claim_number}</td>
                <td>{s.claim?.contractor?.name}</td>
                <td>{s.stage}</td>
                <td>{money(s.original_estimate_rcv)}</td>
                <td>{money(s.supplement_requested)}</td>
                <td>{money(s.supplement_approved)}</td>
                <td>{money(s.bon_fee)}</td>
                <td>
                  <button type="button" onClick={() => setEditing(s)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {supplements.length === 0 && (
              <tr>
                <td colSpan={8}>No supplements found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Pipeline
