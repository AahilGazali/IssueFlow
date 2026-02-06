import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../App.css'

const Header = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const displayName = user?.user_metadata?.display_name?.trim() || (user?.email ? user.email.split('@')[0].replace(/^./, c => c.toUpperCase()) : 'User')
  const getInitials = () => {
    if (displayName) return displayName.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return 'U'
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand" onClick={() => navigate('/dashboard')}>
          <div className="header-brand-icon">🐛</div>
          <h1>Bug<span>Tracker</span></h1>
        </div>
        <div className="header-actions">
          {user && (
            <>
              <div className="header-user">
                <div className="header-avatar">{getInitials()}</div>
                <div className="header-user-info">
                  <span className="header-user-name">
                    {displayName}
                  </span>
                  <span className="header-user-email">{user.email}</span>
                </div>
              </div>
              <button className="btn btn-ghost" onClick={handleLogout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
