import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ClaimForm from '../components/ClaimForm'
import DetailView from '../components/DetailView'
import JobComments from '../components/JobComments'
import {
  listClaims,
  createClaim,
  createClaimWithIntake,
  updateClaim,
  listContractors,
} from '../lib/queries'
import { toCsv, downloadCsv } from '../lib/csv'
import './Contractors.css'

function claimFields(c) {
  return [
    { label: 'Contractor', value: c.contractor?.name },
    { label: 'Property Address', value: c.property_address },
    { label: 'Homeowner Name', value: c.homeowner_name },
    { label: 'Carrier', value: c.carrier },
    { label: 'Claim #', value: c.claim_number },
    { label: 'Adjuster Name', value: c.adjuster_name },
    { label: 'Adjuster Contact', value: c.adjuster_contact },
    { label: 'Date of Loss', value: c.date_of_loss },
    { label: 'Notes', value: c.notes },
    { label: 'Created At', value: c.created_at },
  ]
}

const CSV_COLUMNS = [
  { key: 'contractor', label: 'Contractor', get: (row) => row.contractor?.name },
  { key: 'property_address', label: 'Property Address' },
  { key: 'homeowner_name', label: 'Homeowner Name' },
  { key: 'carrier', label: 'Carrier' },
  { key: 'claim_number', label: 'Claim #' },
  { key: 'adjuster_name', label: 'Adjuster Name' },
  { key: 'adjuster_contact', label: 'Adjuster Contact' },
  { key: 'date_of_loss', label: 'Date of Loss' },
  { key: 'notes', label: 'Notes' },
  { key: 'created_at', label: 'Created At' },
]

function Jobs() {
  const [claims, setClaims] = useState([])
  const [contractors, setContractors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, object = editing
  const [viewing, setViewing] = useState(null) // null = closed, object = viewing
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const openId = searchParams.get('open')
    if (!openId || claims.length === 0) return
    const match = claims.find((c) => c.id === openId)
    if (match) {
      setEditing(match)
    }
    setSearchParams({}, { replace: true })
  }, [claims, searchParams, setSearchParams])

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
    } else if (editing.__intake) {
      await createClaimWithIntake(form)
    } else {
      await createClaim(form)
    }
    setEditing(null)
    setViewing(null)
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
            onClick={() => setEditing({ __intake: true })}
            disabled={contractors.length === 0}
            title={contractors.length === 0 ? 'Add a contractor first' : undefined}
          >
            New Intake
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

      {viewing && !editing && (
        <DetailView
          title={viewing.property_address || viewing.claim_number || 'Job'}
          fields={claimFields(viewing)}
          onEdit={() => {
            setEditing(viewing)
            setViewing(null)
          }}
          onClose={() => setViewing(null)}
        />
      )}

      {editing && (
        <>
          <h3>{editing.id ? 'Edit Job' : editing.__intake ? 'New Intake' : 'Add Job'}</h3>
          {editing.__intake && (
            <p>This creates the job and starts it in the Pipeline at the Intake stage.</p>
          )}
          <ClaimForm
            contractors={contractors}
            initialValues={editing}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
          {editing.id && <JobComments claimId={editing.id} />}
        </>
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
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id}>
                <td>{c.contractor?.name}</td>
                <td>
                  <button type="button" className="row-link" onClick={() => setViewing(c)}>
                    {c.property_address || c.claim_number || 'View'}
                  </button>
                </td>
                <td>{c.homeowner_name}</td>
                <td>{c.carrier}</td>
                <td>{c.claim_number}</td>
                <td>{c.adjuster_name}</td>
                <td>{c.date_of_loss}</td>
              </tr>
            ))}
            {claims.length === 0 && (
              <tr>
                <td colSpan={7}>No jobs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Jobs
