import { useState } from 'react'

function NotificationDropdown({ icon, label, count, emptyText, items, renderItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="notif">
      <button
        type="button"
        className="notif-icon"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
      >
        {icon}
        {count > 0 && <span className="notif-badge">{count}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <p className="notif-title">{label}</p>
          {items.length === 0 && <p className="notif-empty">{emptyText}</p>}
          <ul className="notif-list">{items.map((item) => renderItem(item, () => setOpen(false)))}</ul>
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown
