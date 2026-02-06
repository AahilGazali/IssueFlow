import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useProjects } from '../contexts/ProjectContext'
import { useAuth } from '../contexts/AuthContext'
import NotificationBell from './NotificationBell'
import '../App.css'

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { projects } = useProjects()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const isProjectActive = (id) => location.pathname === `/project/${id}`
  const hash = location.hash.replace('#', '') // e.g. 'projects' or ''

  const starredProjects = projects.filter(p => p.is_starred)
  const recentProjects = projects.filter(p => !p.is_starred).slice(0, 5 - starredProjects.length)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleNavClick = (item) => {
    const target = item.section ? `/dashboard#${item.section}` : '/dashboard'
    if (location.pathname === '/dashboard' && (item.section ? location.hash === `#${item.section}` : !location.hash)) {
      return // already on this section
    }
    navigate(target)
    // Scroll to section is handled by Dashboard when hash changes
  }

  const isNavItemActive = (item) => {
    if (location.pathname !== '/dashboard') return false
    if (item.section) return hash === item.section
    return !hash
  }

  const navItems = [
    { path: '/dashboard', section: '', label: 'Dashboard', icon: 'dashboard' },
    { path: '/dashboard', section: 'projects', label: 'Projects', icon: 'folder' },
    { path: '/dashboard', section: 'tasks', label: 'My Tasks', icon: 'tasks' },
    { path: '/dashboard', section: 'members', label: 'Members', icon: 'members' },
  ]

  return (
    <aside className={`sidebar sidebar-ref ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={() => navigate('/dashboard')}>
          <div className="logo-icon logo-flow">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              <path d="M12 8l-2 2 2 2 2-2-2-2z" fill="currentColor" fillOpacity="0.7"/>
            </svg>
          </div>
          {!collapsed && <span className="logo-text">IssueFlow</span>}
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-main">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`nav-item ${isNavItemActive(item) ? 'active' : ''}`}
              onClick={() => handleNavClick(item)}
            >
            {item.icon === 'dashboard' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            )}
            {item.icon === 'folder' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            )}
            {item.icon === 'tasks' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            )}
            {item.icon === 'members' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            )}
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
        </div>

        {starredProjects.length > 0 && (
          <div className="nav-section nav-section-starred">
            {!collapsed && <span className="nav-section-title">Starred</span>}
            <div className="nav-section-list">
            {starredProjects.map(project => (
              <button
                key={project.id}
                type="button"
                className={`nav-item ${isProjectActive(project.id) ? 'active' : ''}`}
                onClick={() => navigate(`/project/${project.id}`)}
                title={project.title}
              >
                <div className="project-icon starred">{project.title.charAt(0).toUpperCase()}</div>
                {!collapsed && <span className="truncate">{project.title}</span>}
              </button>
            ))}
            </div>
          </div>
        )}

        {recentProjects.length > 0 && (
          <div className="nav-section nav-section-recent">
            {!collapsed && <span className="nav-section-title">Recent</span>}
            <div className="nav-section-list">
            {recentProjects.map(project => (
              <button
                key={project.id}
                type="button"
                className={`nav-item ${isProjectActive(project.id) ? 'active' : ''}`}
                onClick={() => navigate(`/project/${project.id}`)}
                title={project.title}
              >
                <div className="project-icon">{project.title.charAt(0).toUpperCase()}</div>
                {!collapsed && <span className="truncate">{project.title}</span>}
              </button>
            ))}
            </div>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-inner">
        <NotificationBell collapsed={collapsed} />
        <button type="button" className="nav-item theme-toggle" onClick={toggleTheme} title={`${theme === 'light' ? 'Dark' : 'Light'} mode`}>
          {theme === 'light' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
          {!collapsed && <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>}
        </button>
        <button type="button" className={`nav-item ${location.pathname === '/help' ? 'active' : ''}`} onClick={() => navigate('/help')} title="Help & Support">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          {!collapsed && <span>Help & Support</span>}
        </button>
        <button type="button" className="nav-item nav-logout" onClick={handleLogout} title="Logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span>Logout</span>}
        </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
