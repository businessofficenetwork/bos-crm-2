import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import KanbanBoard from '../components/KanbanBoard'
import SupplementListView from '../components/SupplementListView'
import SupplementModal from '../components/SupplementModal'
import {
  listSupplements,
  createSupplement,
  updateSupplement,
  listClaims,
  listAllPendingActions,
} from '../lib/queries'
import { toCsv, downloadCsv } from '../lib/csv'
import './Contractors.css'
import './Pipeline.css'

const CSV_COLUMNS = [
  { key: 'claim_address', label: 'Claim', get: (row) => row.claim?.property_address },
  { key: 'claim_number', label: 'Claim #', get: (row) => row.claim?.claim_number },
  { key: 'contractor', label: 'Contractor', get: (row) => row.claim?.contractor?.name },
  { key: 'stage', label: 'Stage' },
  { key: 'original_estimate_rcv', label: 'Original Estimate RCV' },
  { key: 'supplement_requested', label: 'Supplement Requested' },
  { key: 'supplement_approved', label: 'Supplement Approved' },
  { key: 'bon_fee', label: 'BON Fee' },
  { key: 'closing_date', label: 'Closing Date' },
  { key: 'complexity', label: 'Complexity' },
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

function groupNextActions(actions) {
  const map = {}
  for (const action of actions) {
    if (!map[action.supplement_id]) {
      map[action.supplement_id] = action
    }
  }
  return map
}

function Pipeline() {
  const [supplements, setSupplements] = useState([])
  const [claims, setClaims] = useState([])
  const [nextActionsBySupplement, setNextActionsBySupplement] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState('board') // 'board' or 'list'
  const [viewing, setViewing] = useState(null) // null = closed, {} = new, object = viewing/editing
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const openId = searchParams.get('open')
    if (!openId || supplements.length === 0) return
    const match = supplements.find((s) => s.id === openId)
    if (match) {
      setViewing(match)
    }
    setSearchParams({}, { replace: true })
  }, [supplements, searchParams, setSearchParams])

  async function refresh(term = search) {
    setLoading(true)
    setError(null)
    try {
      const data = await listSupplements(term)
      setSupplements(data)
      return data
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }

  function handleSearchChange(e) {
    const value = e.target.value
    setSearch(value)
    refresh(value)
  }

  async function refreshActions() {
    try {
      const actions = await listAllPendingActions()
      setNextActionsBySupplement(groupNextActions(actions))
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    refresh()
    refreshActions()
    listClaims().then(setClaims).catch((err) => setError(err.message))
  }, [])

  async function handleSave(target, form) {
    if (target.id) {
      await updateSupplement(target.id, form)
    } else {
      await createSupplement(form)
    }
    const data = await refresh()
    if (target.id) {
      setViewing(data.find((s) => s.id === target.id) || null)
    }
  }

  function handleClose() {
    setViewing(null)
    refreshActions()
  }

  function handleExport() {
    downloadCsv('pipeline.csv', toCsv(supplements, CSV_COLUMNS))
  }

  return (
    <div>
      <div className="contractors-header">
        <h1>Pipeline</h1>
        <div className="header-actions">
          <button
            type="button"
            className={view === 'board' ? 'view-toggle active' : 'view-toggle'}
            onClick={() => setView('board')}
          >
            Board
          </button>
          <button
            type="button"
            className={view === 'list' ? 'view-toggle active' : 'view-toggle'}
            onClick={() => setView('list')}
          >
            List
          </button>
          <button type="button" onClick={handleExport} disabled={supplements.length === 0}>
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setViewing({})}
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

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && view === 'board' && (
        <KanbanBoard
          supplements={supplements}
          nextActionsBySupplement={nextActionsBySupplement}
          onCardClick={setViewing}
        />
      )}

      {!loading && !error && view === 'list' && (
        <SupplementListView
          supplements={supplements}
          nextActionsBySupplement={nextActionsBySupplement}
          onRowClick={setViewing}
        />
      )}

      {viewing && (
        <SupplementModal
          supplement={viewing}
          claims={claims}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  )
}

export default Pipeline
