import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { countOverdueActions, countOverdueReminders } from '../lib/queries'

function Nav({ isAdmin }) {
  const location = useLocation()
  const [overdueCount, setOverdueCount] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    Promise.all([countOverdueActions(), countOverdueReminders()])
      .then(([actions, reminders]) => setOverdueCount(actions + reminders))
      .catch(() => {})
  }, [location.pathname])

  // Closes the drawer whenever the route changes, so tapping a link
  // on mobile navigates AND puts the drawer away in one action.
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <>
      <button
        type="button"
        className="nav-toggle"
        onClick={() => setMobileOpen((open) => !open)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>
      {mobileOpen && <div className="nav-backdrop" onClick={() => setMobileOpen(false)} />}
      <nav className={`nav ${mobileOpen ? 'nav-open' : ''}`}>
        <NavLink to="/" end>
          Dashboard
          {overdueCount > 0 && <span className="nav-badge">{overdueCount}</span>}
        </NavLink>
        <NavLink to="/contractors">Contractors</NavLink>
        <NavLink to="/jobs">Jobs</NavLink>
        <NavLink to="/pipeline">Pipeline</NavLink>
        <NavLink to="/leads">Leads</NavLink>
        <NavLink to="/audits">Scope Audit</NavLink>
        <NavLink to="/supplement-guide">Supplement Guide</NavLink>
        <NavLink to="/knowledge-base">Knowledge Base</NavLink>
        {isAdmin && <NavLink to="/settings">Settings</NavLink>}
      </nav>
    </>
  )
}

export default Nav
