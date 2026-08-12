import { useEffect, useState } from 'react'

export default function PortalNotifications() {
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [newIntakes, setNewIntakes] = useState(0)
  const [loading, setLoading] = useState(true)

  async function fetchCounts() {
    try {
      const res = await fetch('/.netlify/functions/portal-notification-counts')
      const data = await res.json()
      setUnreadMessages(data.unreadMessages || 0)
      setNewIntakes(data.newIntakes || 0)
    } catch (e) {
      console.error('Portal notification fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCounts()
    const interval = setInterval(fetchCounts, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return null

  const hasActivity = unreadMessages > 0 || newIntakes > 0

  return (
    <a
      href="/portal-admin.html"
      target="_blank"
      rel="noopener noreferrer"
      className={hasActivity ? 'portal-link active' : 'portal-link'}
    >
      <span>🔗</span>
      <span>Portal</span>
      {unreadMessages > 0 && <span className="portal-badge">{unreadMessages} msg</span>}
      {newIntakes > 0 && <span className="portal-badge portal-badge-intake">{newIntakes} new</span>}
    </a>
  )
}
