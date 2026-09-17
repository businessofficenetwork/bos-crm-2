import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ClaimForm from '../components/ClaimForm'
import DetailView from '../components/DetailView'
import JobComments from '../components/JobComments'
import OpBadge from '../components/OpBadge'
import SolBadge from '../components/SolBadge'
import StageBadge from '../components/StageBadge'
import ScopeAuditUpload from '../components/ScopeAuditUpload'
import {
  listClaims,
  createClaimWithIntake,
  updateClaim,
  listContractors,
  createContractor,
  listOpThresholdRules,
  listSolRules,
} from '../lib/queries'
import { toCsv, downloadCsv } from '../lib/csv'
import { contractorColor } from '../lib/contractorColor'
import { matchOpRule, computeOpQualifies, getOpDisplayStatus } from '../lib/opThreshold'
import { matchSolRule, computeSolDeadline, computeSolStatus } from '../lib/statuteOfLimitations'
import './Contractors.css'

function money(value) {
  return value === null || value === undefined ? '' : `$${Number(value).toLocaleString()}`
}

// "Largest number on the estimate" - for a free-parsed audit that's
// the document's own stated total (reconciled_total, cross-checked
// against the PDF's own RCV line in parseEstimate.js); an AI-parsed
// audit has no single stated total, so it's the sum of line items'
// RCV instead. A claim can have more than one audit (original,
// revised) - takes the largest across all of them.
function estimateValue(claim) {
  const values = (claim.audits || []).map((a) => {
    const est = a.parsed_estimate
    if (!est) return 0
    if (est.reconciled_total) return Number(est.reconciled_total) || 0
    return (est.line_items || []).reduce((sum, item) => sum + (Number(item.rcv) || 0), 0)
  })
  return values.length ? Math.max(...values) : null
}

function claimFields(c, rules, solRules) {
  return [
    { label: 'Contractor', value: c.contractor?.name },
    { label: 'Property Address', value: c.property_address },
    { label: 'Homeowner Name', value: c.homeowner_name },
    { label: 'Carrier', value: c.carrier },
    { label: 'Claim #', value: c.claim_number },
    { label: 'State', value: c.state },
    { label: 'Adjuster Name', value: c.adjuster_name },
    { label: 'Adjuster Contact', value: c.adjuster_contact },
    { label: 'Date of Loss', value: c.date_of_loss },
    { label: 'Statute of Limitations', value: <SolBadge claim={c} rules={solRules} /> },
    { label: 'Pipeline Stage', value: <StageBadge claim={c} /> },
    { label: 'Trades Involved', value: (c.trades_involved || []).join(', ') },
    { label: 'O&P Status', value: <OpBadge claim={c} rules={rules} /> },
    { label: 'O&P Notes', value: c.op_notes },
    { label: 'Notes', value: c.notes },
    { label: 'Created At', value: c.created_at },
  ]
}

const OP_FILTER_OPTIONS = [
  { value: '', label: 'All O&P Statuses' },
  { value: 'qualifies', label: 'O&P Qualifies' },
  { value: 'does_not_qualify', label: 'O&P Does Not Qualify' },
  { value: 'overridden', label: 'Manually Overridden' },
]

function opFilterKey(claim, rules) {
  const rule = matchOpRule(rules || [], { carrierName: claim.carrier, state: claim.state })
  const status = getOpDisplayStatus({ tradesInvolved: claim.trades_involved, opOverride: claim.op_override, rule })
  if (status.overridden) return 'overridden'
  if (status.displayQualifies === true) return 'qualifies'
  if (status.displayQualifies === false) return 'does_not_qualify'
  return ''
}

const CSV_COLUMNS = [
  { key: 'contractor', label: 'Contractor', get: (row) => row.contractor?.name },
  { key: 'property_address', label: 'Property Address' },
  { key: 'homeowner_name', label: 'Homeowner Name' },
  { key: 'carrier', label: 'Carrier' },
  { key: 'claim_number', label: 'Claim #' },
  { key: 'state', label: 'State' },
  { key: 'adjuster_name', label: 'Adjuster Name' },
  { key: 'adjuster_contact', label: 'Adjuster Contact' },
  { key: 'date_of_loss', label: 'Date of Loss' },
  { key: 'estimate_value', label: 'Estimate Value', get: (row) => estimateValue(row) },
  { key: 'trades_involved', label: 'Trades Involved', get: (row) => (row.trades_involved || []).join(', ') },
  { key: 'op_qualifies', label: 'O&P Qualifies', get: (row) => (row.op_override ?? row.op_qualifies) },
  { key: 'notes', label: 'Notes' },
  { key: 'created_at', label: 'Created At' },
]

function Jobs() {
  const [claims, setClaims] = useState([])
  const [contractors, setContractors] = useState([])
  const [rules, setRules] = useState([])
  const [solRules, setSolRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [opFilter, setOpFilter] = useState('')
  const [opSort, setOpSort] = useState('') // '', 'asc', 'desc'
  const [editing, setEditing] = useState(null) // null = closed, {} = new, object = editing
  const [viewing, setViewing] = useState(null) // null = closed, object = viewing
  // True right after Save turns a brand-new job into a saved one, so the
  // screen can say so and prompt for the scope audit instead of silently
  // relabeling itself "Edit Job".
  const [justCreated, setJustCreated] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const openId = searchParams.get('open')
    if (!openId || claims.length === 0) return
    const match = claims.find((c) => c.id === openId)
    if (match) {
      setJustCreated(false)
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
    // O&P rules are a supplementary feature - if the table isn't there yet
    // (e.g. migration not applied), the claims list should still work,
    // just with badges showing "No Rule" instead of a computed status.
    listOpThresholdRules()
      .then(setRules)
      .catch((err) => console.error('Could not load O&P threshold rules:', err.message))
    // Same reasoning as O&P rules above - SOL is supplementary, a missing
    // table shouldn't take down the claims list.
    listSolRules()
      .then(setSolRules)
      .catch((err) => console.error('Could not load SOL rules:', err.message))
  }, [])

  function handleSearchChange(e) {
    const value = e.target.value
    setSearch(value)
    refresh(value)
  }

  // Matches an existing contractor by name (case-insensitive) so typing
  // the same contractor on a later job reuses it instead of duplicating -
  // only creates a new contractor row when nothing matches.
  async function resolveContractorId(name) {
    const trimmed = name.trim()
    const existing = contractors.find((c) => c.name.trim().toLowerCase() === trimmed.toLowerCase())
    if (existing) return existing.id
    const created = await createContractor({ name: trimmed })
    setContractors((list) => [...list, created].sort((a, b) => a.name.localeCompare(b.name)))
    return created.id
  }

  async function handleSubmit(form) {
    const { contractor_name, ...fields } = form
    const contractor_id = await resolveContractorId(contractor_name)
    const claimFields = { ...fields, contractor_id }
    const rule = matchOpRule(rules, { carrierName: claimFields.carrier, state: claimFields.state })
    const solRule = matchSolRule(solRules, { state: claimFields.state })
    const solDeadline = computeSolDeadline(claimFields, solRule)
    const payload = {
      ...claimFields,
      op_qualifies: computeOpQualifies(claimFields.trades_involved, rule),
      sol_deadline: solDeadline,
      sol_status: computeSolStatus(solDeadline),
    }
    if (editing.id) {
      await updateClaim(editing.id, payload)
      setEditing(null)
    } else {
      // Every new job starts in the Pipeline at Intake automatically - no
      // separate "New Intake" step. Stays open (now in "edit" mode, with
      // an id) instead of closing so the scope-audit upload section below
      // can appear immediately - that's the whole point of the combined flow.
      const newClaim = await createClaimWithIntake(payload)
      setEditing(newClaim)
      setJustCreated(true)
    }
    setViewing(null)
    await refresh()
  }

  function handleExport() {
    downloadCsv('jobs.csv', toCsv(claims, CSV_COLUMNS))
  }

  function toggleOpSort() {
    setOpSort((s) => (s === '' ? 'asc' : s === 'asc' ? 'desc' : ''))
  }

  const displayedClaims = claims
    .filter((c) => !opFilter || opFilterKey(c, rules) === opFilter)
    .sort((a, b) => {
      if (!opSort) return 0
      const av = opFilterKey(a, rules) === 'qualifies' ? 1 : 0
      const bv = opFilterKey(b, rules) === 'qualifies' ? 1 : 0
      return opSort === 'asc' ? av - bv : bv - av
    })

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
            onClick={() => {
              setJustCreated(false)
              setEditing({})
            }}
          >
            Add Job
          </button>
        </div>
      </div>

      <div className="form-row wrap">
        <input
          className="contractors-search"
          type="search"
          placeholder="Search by address, homeowner, or claim #…"
          value={search}
          onChange={handleSearchChange}
        />
        <select value={opFilter} onChange={(e) => setOpFilter(e.target.value)}>
          {OP_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {viewing && !editing && (
        <DetailView
          title={viewing.property_address || viewing.claim_number || 'Job'}
          fields={claimFields(viewing, rules, solRules)}
          headerColor={contractorColor(viewing.contractor?.id)}
          onEdit={() => {
            setJustCreated(false)
            setEditing(viewing)
            setViewing(null)
          }}
          onClose={() => setViewing(null)}
        />
      )}

      {editing && (
        <>
          <h3>{justCreated ? 'Job Saved' : editing.id ? 'Edit Job' : 'Add Job'}</h3>
          {!editing.id && !justCreated && (
            <p>This creates the job and starts it in the Pipeline at the Intake stage.</p>
          )}
          {justCreated && (
            <p>Upload the scope audit below to run it now, or close and come back to it later.</p>
          )}
          <ClaimForm
            contractors={contractors}
            initialValues={editing}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
          {editing.id && <ScopeAuditUpload claimId={editing.id} />}
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
              <th>Estimate Value</th>
              <th className="row-link" onClick={toggleOpSort} style={{ cursor: 'pointer' }}>
                O&amp;P{opSort === 'asc' ? ' ▲' : opSort === 'desc' ? ' ▼' : ''}
              </th>
              <th>SOL Deadline</th>
              <th>Pipeline Stage</th>
            </tr>
          </thead>
          <tbody>
            {displayedClaims.map((c) => (
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
                <td>{money(estimateValue(c))}</td>
                <td>
                  <OpBadge claim={c} rules={rules} />
                </td>
                <td>
                  <SolBadge claim={c} rules={solRules} />
                </td>
                <td>
                  <StageBadge claim={c} />
                </td>
              </tr>
            ))}
            {displayedClaims.length === 0 && (
              <tr>
                <td colSpan={11}>No jobs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Jobs
