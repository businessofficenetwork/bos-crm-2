import { useEffect, useState } from 'react'
import { getPipelineSummary, listOverdueActions } from '../lib/queries'
import './Contractors.css'

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
  const [summary, setSummary] = useState([])
  const [overdue, setOverdue] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [summaryData, overdueData] = await Promise.all([
          getPipelineSummary(),
          listOverdueActions(),
        ])
        setSummary(summaryData)
        setOverdue(overdueData)
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
                  <td>{row.stage}</td>
                  <td>{row.count}</td>
                  <td>{money(row.requested)}</td>
                  <td>{money(row.approved)}</td>
                </tr>
              ))}
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
