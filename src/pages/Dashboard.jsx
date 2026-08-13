import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPipelineSummary,
  listOverdueActions,
  getDashboardStats,
  getMonthlyFeesCollected,
} from '../lib/queries'
import RemindersPanel from '../components/RemindersPanel'
import DashboardStats from '../components/DashboardStats'
import './Contractors.css'
import './Dashboard.css'

const STAGES = [
  'Intake',
  'Docs Received',
  'Reviewed',
  'Supplement Written',
  'Submitted',
  'Carrier Response',
  'Approved',
  'Paid',
  'Invoiced',
  'Closed',
]

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState([])
  const [overdue, setOverdue] = useState([])
  const [stats, setStats] = useState(null)
  const [monthlyFees, setMonthlyFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [summaryData, overdueData, statsData, feesData] = await Promise.all([
          getPipelineSummary(),
          listOverdueActions(),
          getDashboardStats(),
          getMonthlyFeesCollected(),
        ])
        setSummary(summaryData)
        setOverdue(overdueData)
        setStats(statsData)
        setMonthlyFees(feesData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const byStage = STAGES.map((stage) => {
    const rows = summary.filter((s) => s.stage === stage)
    return {
      stage,
      count: rows.length,
      requested: rows.reduce((sum, r) => sum + (Number(r.supplement_requested) || 0), 0),
      approved: rows.reduce((sum, r) => sum + (Number(r.supplement_approved) || 0), 0),
    }
  })

  return (
    <div>
      <h1>Dashboard</h1>

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && (
        <>
          <DashboardStats stats={stats} />

          <RemindersPanel />

          <h2>Pipeline</h2>
          <table className="contractors-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Count</th>
                <th>Supp. Requested</th>
                <th>Supp. Approved</th>
              </tr>
            </thead>
            <tbody>
              {byStage.map((row) => (
                <tr key={row.stage}>
                  <td>
                    <button type="button" className="row-link" onClick={() => navigate('/pipeline')}>
                      {row.stage}
                    </button>
                  </td>
                  <td>
                    <button type="button" className="row-link" onClick={() => navigate('/pipeline')}>
                      {row.count}
                    </button>
                  </td>
                  <td>{money(row.requested)}</td>
                  <td>{money(row.approved)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Fees Collected by Month</h2>
          <table className="contractors-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Fees Collected</th>
              </tr>
            </thead>
            <tbody>
              {monthlyFees.map((row) => (
                <tr key={row.month}>
                  <td>{row.label}</td>
                  <td>{money(row.total)}</td>
                </tr>
              ))}
              {monthlyFees.length === 0 && (
                <tr>
                  <td colSpan={2}>No supplements closed out yet.</td>
                </tr>
              )}
            </tbody>
          </table>

          <h2>Overdue Actions</h2>
          <table className="contractors-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Due Date</th>
                <th>Stage</th>
                <th>Claim</th>
                <th>Contractor</th>
              </tr>
            </thead>
            <tbody>
              {overdue.map((a) => (
                <tr key={a.id}>
                  <td>{a.description}</td>
                  <td className="overdue-cell">{a.due_date}</td>
                  <td>{a.supplement?.stage}</td>
                  <td>{a.supplement?.claim?.property_address || a.supplement?.claim?.claim_number}</td>
                  <td>{a.supplement?.claim?.contractor?.name}</td>
                </tr>
              ))}
              {overdue.length === 0 && (
                <tr>
                  <td colSpan={5}>No overdue actions.</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

export default Dashboard
