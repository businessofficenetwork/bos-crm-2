import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Contractors from './pages/Contractors'
import Jobs from './pages/Jobs'
import Pipeline from './pages/Pipeline'
import Leads from './pages/Leads'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Nav />
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contractors" element={<Contractors />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/leads" element={<Leads />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
