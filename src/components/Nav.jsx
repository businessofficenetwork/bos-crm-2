import { NavLink } from 'react-router-dom'

function Nav() {
  return (
    <nav className="nav">
      <NavLink to="/" end>Dashboard</NavLink>
      <NavLink to="/contractors">Contractors</NavLink>
      <NavLink to="/jobs">Jobs</NavLink>
      <NavLink to="/pipeline">Pipeline</NavLink>
    </nav>
  )
}

export default Nav
