import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { authAPI } from '../services/api'
import '../App.css'

const DEFAULT_PREFS = {
  email_on_assign: false,
  email_on_comment: false,
  email_digest: false,
}

const Settings = () => {
  const navigate = useNavigate()
  const { user, logout, refreshUser, updateUser } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const prefsFromUser = user?.user_metadata?.notification_preferences || {}
  const [prefs, setPrefs] = useState(() => ({ ...DEFAULT_PREFS, ...prefsFromUser }))
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsMessage, setPrefsMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    const fromUser = user?.user_metadata?.notification_preferences || {}
    setPrefs((prev) => ({ ...DEFAULT_PREFS, ...fromUser }))
  }, [user?.user_metadata?.notification_preferences])

  const currentDisplayName = user?.user_metadata?.display_name ?? ''

  const handleNotificationToggle = async (key, value) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    setSavingPrefs(true)
    setPrefsMessage({ type: '', text: '' })
    try {
      const res = await authAPI.updateProfile({
        display_name: currentDisplayName,
        notification_preferences: next,
      })
      if (res.data?.user) {
        updateUser(res.data.user)
      } else {
        await refreshUser()
      }
      setPrefsMessage({ type: 'success', text: 'Notification preferences saved' })
    } catch (err) {
      setPrefs((prev) => ({ ...prev, [key]: !value })) // revert on error
      setPrefsMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to save preferences',
      })
    } finally {
      setSavingPrefs(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      <Sidebar />
      <main className="main-content settings-page">
        <header className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your account and preferences.</p>
        </header>

        <div className="settings-sections">
          {/* Appearance */}
          <section className="settings-section">
            <h2 className="settings-section-title">Appearance</h2>
            <div className="settings-card">
              <div className="settings-row settings-row-toggle">
                <div>
                  <label className="settings-label">Theme</label>
                  <p className="settings-desc">Choose light or dark mode for the interface.</p>
                </div>
                <button
                  type="button"
                  className="theme-toggle-btn"
                  onClick={toggleTheme}
                  title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                  <span className={`theme-option ${theme === 'light' ? 'active' : ''}`}>Light</span>
                  <span className={`theme-option ${theme === 'dark' ? 'active' : ''}`}>Dark</span>
                </button>
              </div>
            </div>
          </section>

          {/* Quick actions */}
          <section className="settings-section">
            <h2 className="settings-section-title">Quick actions</h2>
            <div className="settings-card">
              <div className="settings-actions">
                <button type="button" className="settings-action-btn" onClick={() => navigate('/dashboard')}>
                  <span className="settings-action-icon">📋</span>
                  Go to Dashboard
                </button>
                <button type="button" className="settings-action-btn" onClick={() => navigate('/dashboard#projects')}>
                  <span className="settings-action-icon">📁</span>
                  View all projects
                </button>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="settings-section">
            <h2 className="settings-section-title">Notifications</h2>
            <div className="settings-card">
              {prefsMessage.text && (
                <p className={`settings-prefs-message ${prefsMessage.type === 'error' ? 'error' : 'success'}`}>
                  {prefsMessage.text}
                </p>
              )}
              <div className="settings-row settings-row-toggle">
                <div>
                  <label className="settings-label">When I’m assigned to a ticket</label>
                  <p className="settings-desc">Email me when someone assigns me to an issue.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs.email_on_assign}
                  disabled={savingPrefs}
                  className={`settings-switch ${prefs.email_on_assign ? 'on' : ''}`}
                  onClick={() => handleNotificationToggle('email_on_assign', !prefs.email_on_assign)}
                >
                  <span className="settings-switch-thumb" />
                </button>
              </div>
              <div className="settings-row settings-row-toggle">
                <div>
                  <label className="settings-label">Comments on my tickets</label>
                  <p className="settings-desc">Email me when someone comments on a ticket I’m involved in.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs.email_on_comment}
                  disabled={savingPrefs}
                  className={`settings-switch ${prefs.email_on_comment ? 'on' : ''}`}
                  onClick={() => handleNotificationToggle('email_on_comment', !prefs.email_on_comment)}
                >
                  <span className="settings-switch-thumb" />
                </button>
              </div>
              <div className="settings-row settings-row-toggle">
                <div>
                  <label className="settings-label">Weekly digest</label>
                  <p className="settings-desc">Receive a weekly summary of activity in your projects.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs.email_digest}
                  disabled={savingPrefs}
                  className={`settings-switch ${prefs.email_digest ? 'on' : ''}`}
                  onClick={() => handleNotificationToggle('email_digest', !prefs.email_digest)}
                >
                  <span className="settings-switch-thumb" />
                </button>
              </div>
            </div>
          </section>

          {/* Account */}
          <section className="settings-section">
            <h2 className="settings-section-title">Account</h2>
            <div className="settings-card">
              <button type="button" className="settings-logout-btn" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default Settings
