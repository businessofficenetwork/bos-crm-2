import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import NotificationDropdown from './NotificationDropdown'
import PortalNotifications from './PortalNotifications'
import { listOverdueActions, listMentions, markCommentRead } from '../lib/queries'
import { clearSession } from '../lib/auth'

function Topbar({ session, onSignOut }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [actions, setActions] = useState([])
  const [mentions, setMentions] = useState([])

  const refresh = useCallback(() => {
    listOverdueActions().then(setActions).catch(() => {})
    listMentions().then(setMentions).catch(() => {})
  }, [])

  useEffect(() => {
    refresh()
  }, [location.pathname, refresh])

  function openAction(action, close) {
    close()
    navigate(`/pipeline?open=${action.supplement_id}`)
  }

  async function openMention(comment, close) {
    close()
    try {
      await markCommentRead(comment.id)
    } catch {
      // non-fatal — still navigate even if marking read failed
    }
    navigate(`/jobs?open=${comment.claim_id}`)
    refresh()
  }

  function handleSignOut() {
    clearSession()
    onSignOut()
  }

  return (
    <div className="topbar">
      {session && (
        <>
          <span className="topbar-user">{session.name}</span>
          <button type="button" className="topbar-signout" onClick={handleSignOut}>
            Sign Out
          </button>
        </>
      )}
      <PortalNotifications />
      <NotificationDropdown
        icon="🔔"
        label="Reminders"
        count={actions.length}
        emptyText="No overdue actions."
        items={actions}
        renderItem={(a, close) => (
          <li key={a.id}>
            <button type="button" onClick={() => openAction(a, close)}>
              {a.description}
              <span className="notif-sub">
                {a.supplement?.claim?.property_address || a.supplement?.claim?.claim_number}
              </span>
            </button>
          </li>
        )}
      />
      <NotificationDropdown
        icon="#"
        label="Mentions"
        count={mentions.length}
        emptyText="No mentions."
        items={mentions}
        renderItem={(m, close) => (
          <li key={m.id}>
            <button type="button" onClick={() => openMention(m, close)}>
              {m.body}
              <span className="notif-sub">
                {m.claim?.property_address || m.claim?.claim_number}
              </span>
            </button>
          </li>
        )}
      />
    </div>
  )
}

export default Topbar
