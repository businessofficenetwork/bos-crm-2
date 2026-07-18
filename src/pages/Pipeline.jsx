import { useEffect, useState } from 'react'
import SupplementForm from '../components/SupplementForm'
import ActionsPanel from '../components/ActionsPanel'
import DetailView from '../components/DetailView'
import { listSupplements, createSupplement, updateSupplement, listClaims } from '../lib/queries'
import { toCsv, downloadCsv } from '../lib/csv'
import './Contractors.css'

function money(value) {
  return value === null || value === undefined ? '' : `$${Number(value).toFixed(2)}`
}

function supplementFields(s) {
  return [
    { label: 'Claim', value: s.claim?.property_address },
    { label: 'Claim #', value: s.claim?.claim_number },
    { label: 'Contractor', value: s.claim?.contractor?.name },
    { label: 'Stage', value: s.stage },
    { label: 'Original Estimate RCV', value: money(s.original_estimate_rcv) },
    { label: 'Supplement Requested', value: money(s.supplement_requested) },
    { label: 'Supplement Approved', value: money(s.supplement_approved) },
    { label: 'BON Fee', value: money(s.bon_fee) },
    { label: 'Intake Date', value: s.intake_date },
    { label: 'Docs Received Date', value: s.docs_received_date },
    { label: 'Reviewed Date', value: s.reviewed_date },
    { label: 'Supplement Written Date', value: s.supplement_written_date },
    { label: 'Submitted Date', value: s.submitted_date },
    { label: 'Carrier Response Date', value: s.carrier_response_date },
    { label: 'Approved Date', value: s.approved_date },
    { label: 'Paid Date', value: s.paid_date },
    { label: 'Invoiced Date', value: s.invoiced_date },
    { label: 'Closed Date', value: s.closed_date },
    { label: 'Notes', value: s.notes },
    { label: 'Created At', value: s.created_at },
  ]
}

const CSV_COLUMNS = [
  { key: 'claim_address', label: 'Claim', get: (row) => row.claim?.property_address },
  { key: 'claim_number', label: 'Claim #', get: (row) => row.claim?.claim_number },
  { key: 'contractor', label: 'Contractor', get: (row) => row.claim?.contractor?.name },
  { key: 'stage', label: 'Stage' },
  { key: 'original_estimate_rcv', label: 'Original Estimate RCV' },
  { key: 'supplement_requested', label: 'Supplement Requested' },
  { key: 'supplement_approved', label: 'Supplement Approved' },
  { key: 'bon_fee', label: 'BON Fee' },
  { key: 'intake_date', label: 'Intake Date' },
  { key: 'docs_received_date', label: 'Docs Received Date' },
  { key: 'reviewed_date', label: 'Reviewed Date' },
  { key: 'supplement_written_date', label: 'Supplement Written Date' },
  { key: 'submitted_date', label: 'Submitted Date' },
  { key: 'carrier_response_date', label: 'Carrier Response Date' },
  { key: 'approved_date', label: 'Approved Date' },
  { key: 'paid_date', label: 'Paid Date' },
  { key: 'invoiced_date', label: 'Invoiced Date' },
  { key: 'closed_date', label: 'Closed Date' },
  { key: 'notes', label: 'Notes' },
  { key: 'created_at', label: 'Created At' },
]

function Pipeline() {
  const [supplements, setSupplements] = useState([])
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, object = editing
  const [viewing, setViewing] = useState(null) // null = closed, object = viewing

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
    setViewing(null)
    await refresh()
  }

  function handleExport() {
    downloadCsv('pipeline.csv', toCsv(supplements, CSV_COLUMNS))
  }

  return (
    <div>
      <div className="contractors-header">
        <h1>Pipeline</h1>
        <div className="header-actions">
          <button type="button" onClick={handleExport} disabled={supplements.length === 0}>
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setEditing({})}
            disabled={claims.length === 0}
            title={claims.length === 0 ? 'Add a job first' : undefined}
          >
            Add Supplement
          </button>
        </div>
      </div>

      {claims.length === 0 && !loading && <p>Add a job before creating a supplement.</p>}

      <input
        className="contractors-search"
        type="search"
        placeholder="Search by claim address, homeowner, or claim #…"
        value={search}
        onChange={handleSearchChange}
      />

      {viewing && !editing && (
        <DetailView
          title={viewing.claim?.property_address || viewing.claim?.claim_number || 'Supplement'}
          fields={supplementFields(viewing)}
          onEdit={() => {
            setEditing(viewing)
            setViewing(null)
          }}
          onClose={() => setViewing(null)}
        />
      )}

      {editing && (
        <>
          <SupplementForm
            claims={claims}
            initialValues={editing}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
          {editing.id && <ActionsPanel supplementId={editing.id} />}
        </>
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
            </tr>
          </thead>
          <tbody>
            {supplements.map((s) => (
              <tr key={s.id}>
                <td>
                  <button type="button" className="row-link" onClick={() => setViewing(s)}>
                    {s.claim?.property_address || s.claim?.claim_number || 'View'}
                  </button>
                </td>
                <td>{s.claim?.contractor?.name}</td>
                <td>{s.stage}</td>
                <td>{money(s.original_estimate_rcv)}</td>
                <td>{money(s.supplement_requested)}</td>
                <td>{money(s.supplement_approved)}</td>
                <td>{money(s.bon_fee)}</td>
              </tr>
            ))}
            {supplements.length === 0 && (
              <tr>
                <td colSpan={7}>No supplements found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Pipeline
