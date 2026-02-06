import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationsAPI } from '../services/api'
import '../App.css'

const NotificationBell = ({ collapsed }) => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  const fetchList = async () => {
    try {
      const res = await notificationsAPI.list()
      setNotifications(res.data?.notifications || [])
      setUnreadCount(res.data?.unread_count ?? 0)
    } catch {
      setNotifications([])
      setUnreadCount(0)
    }
  }

  const fetchUnreadOnly = async () => {
    try {
      const res = await notificationsAPI.unreadCount()
      setUnreadCount(res.data?.unread_count ?? 0)
    } catch {}
  }

  useEffect(() => {
    if (open) {
      setLoading(true)
      fetchList().finally(() => setLoading(false))
    } else {
      fetchUnreadOnly()
    }
  }, [open])

  useEffect(() => {
    const t = setInterval(fetchUnreadOnly, 60000)
    const onFocus = () => fetchUnreadOnly()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(t)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    if (open) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  const handleMarkRead = async (e, id) => {
    e.stopPropagation()
    try {
      await notificationsAPI.markRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {}
  }

  const handleMarkAllRead = async (e) => {
    e.stopPropagation()
    try {
      await notificationsAPI.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {}
  }

  const goToTicket = (n) => {
    const projectId = n.metadata?.project_id
    if (projectId) navigate(`/project/${projectId}`)
    if (!n.read) {
      handleMarkRead({ stopPropagation: () => {} }, n.id)
    }
    setOpen(false)
  }

  return (
    <div className="notification-bell-wrap" ref={dropdownRef}>
      <button
        type="button"
        className="nav-item notification-bell-btn"
        onClick={() => setOpen(!open)}
        title="Notifications"
        aria-label={unreadCount ? `${unreadCount} unread notifications` : 'Notifications'}
      >
        <span className="notification-bell-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="notification-bell-badge" aria-hidden="true">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </span>
        {!collapsed && <span>Notifications</span>}
      </button>

      {open && (
        <div className="notification-bell-dropdown">
          <div className="notification-bell-dropdown-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button type="button" className="notification-bell-mark-all" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>
          <div className="notification-bell-list">
            {loading ? (
              <div className="notification-bell-empty">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="notification-bell-empty">No notifications yet</div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`notification-bell-item ${n.read ? 'read' : ''}`}
                  onClick={() => goToTicket(n)}
                >
                  <span className="notification-bell-item-title">{n.title}</span>
                  <span className="notification-bell-item-time">
                    {new Date(n.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
