import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AuditBoard from '../components/AuditBoard'
import AuditModal from '../components/AuditModal'
import { listAudits, listClaims } from '../lib/queries'
import '../pages/Contractors.css'
import '../pages/Pipeline.css'
import './Audits.css'

function Audits() {
  const [audits, setAudits] = useState([])
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewing, setViewing] = useState(null) // null = closed, {} = new, object = existing audit
  const [searchParams, setSearchParams] = useSearchParams()

  const refresh = useCallback(async () => {
    try {
      const data = await listAudits()
      setAudits(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    listClaims().then(setClaims).catch((err) => setError(err.message))
  }, [refresh])

  // Lets the findings-ready email link straight to the audit that
  // triggered it, matching the ?open= pattern Pipeline/Jobs already use.
  useEffect(() => {
    const openId = searchParams.get('open')
    if (!openId || audits.length === 0) return
    const match = audits.find((a) => a.id === openId)
    if (match) setViewing(match)
    setSearchParams({}, { replace: true })
  }, [audits, searchParams, setSearchParams])

  function handleDone() {
    setViewing(null)
    refresh()
  }

  return (
    <div>
      <div className="contractors-header">
        <h1>Scope Audit</h1>
        <div className="header-actions">
          <button
            type="button"
            onClick={() => setViewing({})}
            disabled={claims.length === 0}
            title={claims.length === 0 ? 'Add a job first' : undefined}
          >
            Add Audit
          </button>
        </div>
      </div>

      {claims.length === 0 && !loading && <p>Add a job before creating an audit.</p>}

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && (
        <AuditBoard audits={audits} onCardClick={setViewing} onRefresh={refresh} />
      )}

      {viewing && (
        <AuditModal
          audit={viewing.id ? viewing : null}
          claims={claims}
          onClose={() => setViewing(null)}
          onDone={handleDone}
        />
      )}
    </div>
  )
}

export default Audits
