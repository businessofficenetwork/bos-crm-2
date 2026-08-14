import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Topbar from './components/Topbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Contractors from './pages/Contractors'
import Jobs from './pages/Jobs'
import Pipeline from './pages/Pipeline'
import Leads from './pages/Leads'
import Audits from './pages/Audits'
import Settings from './pages/Settings'
import { getSession } from './lib/auth'
import './App.css'

function App() {
  const [session, setSessionState] = useState(getSession)

  if (!session) {
    return <Login onSignedIn={() => setSessionState(getSession())} />
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Topbar session={session} onSignOut={() => setSessionState(null)} />
        <div className="app">
          <Nav isAdmin={session.role === 'admin'} />
          <main className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/contractors" element={<Contractors />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/audits" element={<Audits />} />
              {session.role === 'admin' && <Route path="/settings" element={<Settings />} />}
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
