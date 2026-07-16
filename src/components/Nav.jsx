import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { countOverdueActions } from '../lib/queries'

function Nav() {
  const location = useLocation()
  const [overdueCount, setOverdueCount] = useState(0)

  useEffect(() => {
    countOverdueActions()
      .then(setOverdueCount)
      .catch(() => {})
  }, [location.pathname])

  return (
    <nav className="nav">
      <NavLink to="/" end>
        Dashboard
        {overdueCount > 0 && <span className="nav-badge">{overdueCount}</span>}
      </NavLink>
      <NavLink to="/contractors">Contractors</NavLink>
      <NavLink to="/jobs">Jobs</NavLink>
      <NavLink to="/pipeline">Pipeline</NavLink>
    </nav>
  )
}

export default Nav
