import { useNavigate } from 'react-router-dom'

function money(value) {
  return `$${Number(value || 0).toLocaleString()}`
}

function StatCard({ title, to, lines }) {
  const navigate = useNavigate()
  return (
    <button type="button" className="stat-card" onClick={() => navigate(to)}>
      <div className="stat-card-title">{title}</div>
      {lines.map(([value, label]) => (
        <div className="stat-card-row" key={label}>
          <span className="stat-card-value">{value}</span>
          <span className="stat-card-label">{label}</span>
        </div>
      ))}
    </button>
  )
}

function DashboardStats({ stats }) {
  if (!stats) return null

  return (
    <div className="stats-grid">
      <StatCard
        title="Contractors"
        to="/contractors"
        lines={[
          [stats.contractors.total, 'total'],
          [stats.contractors.active, 'active'],
        ]}
      />
      <StatCard title="Jobs" to="/jobs" lines={[[stats.claims.total, 'total claims']]} />
      <StatCard
        title="Pipeline"
        to="/pipeline"
        lines={[
          [stats.pipeline.activeCount, 'active supplements'],
          [money(stats.pipeline.requested), 'requested'],
          [money(stats.pipeline.approved), 'approved'],
        ]}
      />
      <StatCard
        title="Leads"
        to="/leads"
        lines={[
          [stats.leads.active, 'active'],
          [stats.leads.new, 'new'],
        ]}
      />
      <StatCard
        title="Audit Findings"
        to="/audits"
        lines={[
          [stats.audits.awaitingReview, 'awaiting review'],
          [money(stats.audits.pendingRecovery), 'est. recovery'],
        ]}
      />
      <StatCard
        title="Aging Alerts"
        to="/pipeline"
        lines={[[stats.aging.count, 'need attention']]}
      />
    </div>
  )
}

export default DashboardStats
