import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import '../App.css'

const Account = () => {
  const navigate = useNavigate()
  const { user, refreshUser, updateUser, logout } = useAuth()

  const savedDisplayName = user?.user_metadata?.display_name?.trim()
  const fallbackName = user?.email ? user.email.split('@')[0].replace(/^./, c => c.toUpperCase()) : 'User'
  const displayName = savedDisplayName || fallbackName

  const [editDisplayName, setEditDisplayName] = useState(displayName)
  const [savingName, setSavingName] = useState(false)
  const [nameMessage, setNameMessage] = useState({ type: '', text: '' })

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })

  const handleSaveDisplayName = async (e) => {
    e.preventDefault()
    const name = editDisplayName.trim()
    if (!name) {
      setNameMessage({ type: 'error', text: 'Display name cannot be empty' })
      return
    }
    setSavingName(true)
    setNameMessage({ type: '', text: '' })
    try {
      const res = await authAPI.updateProfile({ display_name: name })
      if (res.data?.user) updateUser(res.data.user)
      else await refreshUser()
      setNameMessage({ type: 'success', text: 'Display name updated successfully' })
    } catch (err) {
      setNameMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to update display name',
      })
    } finally {
      setSavingName(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordMessage({ type: '', text: '' })
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Fill in all password fields' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match' })
      return
    }
    setSavingPassword(true)
    try {
      await authAPI.updatePassword(currentPassword, newPassword)
      setPasswordMessage({
        type: 'success',
        text: 'Password updated. Please sign in again with your new password.',
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(async () => {
        await logout()
        navigate('/login', { state: { message: 'Password changed. Sign in with your new password.' } })
      }, 1500)
    } catch (err) {
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to update password',
      })
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <>
      <Sidebar />
      <main className="main-content account-page">
        <header className="account-header">
          <h1 className="account-title">My account</h1>
          <p className="account-subtitle">Your profile and account information.</p>
        </header>

        <div className="account-sections">
          <section className="account-section">
            <div className="account-card account-profile-card">
              <div className="account-avatar-large">
                {(displayName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="account-profile-info">
                <h2 className="account-display-name">{displayName}</h2>
                <p className="account-email">{user?.email || '—'}</p>
              </div>
            </div>
          </section>

          <section className="account-section">
            <h2 className="account-section-title">Change display name</h2>
            <div className="account-card">
              <form onSubmit={handleSaveDisplayName} className="account-form">
                <div className="account-form-group">
                  <label htmlFor="display-name" className="account-label">Display name</label>
                  <input
                    id="display-name"
                    type="text"
                    className="account-input"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="Your display name"
                    maxLength={100}
                  />
                </div>
                {nameMessage.text && (
                  <p className={`account-message account-message-${nameMessage.type}`}>{nameMessage.text}</p>
                )}
                <button type="submit" className="btn btn-primary" disabled={savingName}>
                  {savingName ? 'Saving...' : 'Save display name'}
                </button>
              </form>
            </div>
          </section>

          <section className="account-section">
            <h2 className="account-section-title">Change password</h2>
            <div className="account-card">
              <form onSubmit={handleChangePassword} className="account-form">
                <div className="account-form-group">
                  <label htmlFor="current-password" className="account-label">Current password</label>
                  <input
                    id="current-password"
                    type="password"
                    className="account-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                </div>
                <div className="account-form-group">
                  <label htmlFor="new-password" className="account-label">New password</label>
                  <input
                    id="new-password"
                    type="password"
                    className="account-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    minLength={6}
                  />
                </div>
                <div className="account-form-group">
                  <label htmlFor="confirm-password" className="account-label">Confirm new password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    className="account-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                </div>
                {passwordMessage.text && (
                  <p className={`account-message account-message-${passwordMessage.type}`}>{passwordMessage.text}</p>
                )}
                <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                  {savingPassword ? 'Updating...' : 'Update password'}
                </button>
              </form>
            </div>
          </section>

          <section className="account-section">
            <h2 className="account-section-title">Account details</h2>
            <div className="account-card">
              <div className="account-row">
                <span className="account-label">Display name</span>
                <span className="account-value">{displayName}</span>
              </div>
              <div className="account-row">
                <span className="account-label">Email</span>
                <span className="account-value">{user?.email || '—'}</span>
              </div>
              <p className="account-hint">Email is used to sign in and cannot be changed here. Use the forms above to change your display name or password.</p>
            </div>
          </section>

          <section className="account-section">
            <div className="account-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/settings')}>
                Open Settings
              </button>
              <button type="button" className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default Account
