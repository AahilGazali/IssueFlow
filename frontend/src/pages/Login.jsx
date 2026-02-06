import { useState, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../App.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_NOTICE_KEY = 'issueflow-login-password-notice-dismissed'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({ email: false, password: false })
  const [showPasswordNotice, setShowPasswordNotice] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    try {
      setShowPasswordNotice(!sessionStorage.getItem(PASSWORD_NOTICE_KEY))
    } catch {
      setShowPasswordNotice(true)
    }
  }, [])

  const dismissPasswordNotice = useCallback(() => {
    setShowPasswordNotice(false)
    try {
      sessionStorage.setItem(PASSWORD_NOTICE_KEY, '1')
    } catch {}
  }, [])

  const emailValid = !email || EMAIL_REGEX.test(email.trim())
  const emailError = touched.email && email && !EMAIL_REGEX.test(email.trim())
  const passwordError = touched.password && password.length > 0 && password.length < 6

  const handleBlur = useCallback((field) => {
    setTouched((t) => ({ ...t, [field]: true }))
  }, [])

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    if (error) setError('')
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setTouched({ email: true, password: true })

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email.')
      return
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const result = await login(trimmedEmail, password)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Sign in failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-split auth-left-new">
        <div className="auth-hero">
          <div className="auth-hero-logo">
            <div className="auth-hero-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                <path d="M12 8l-2 2 2 2 2-2-2-2z" fill="currentColor" fillOpacity="0.6"/>
                <path d="M8 12l2-2 2 2-2 2-2-2z" fill="currentColor" fillOpacity="0.4"/>
                <path d="M16 12l-2-2 2-2 2 2-2 2z" fill="currentColor" fillOpacity="0.4"/>
              </svg>
            </div>
            <span className="auth-hero-brand">IssueFlow</span>
          </div>
          <h1 className="auth-hero-title">Move issues. Ship on time.</h1>
          <p className="auth-hero-subtitle">
            One place for issues, boards, and your team. Simple, fast, and built to flow.
          </p>
          <div className="auth-hero-features">
            <div className="auth-hero-feature">
              <span className="auth-hero-feature-icon">✓</span>
              <span>Kanban boards & workflows</span>
            </div>
            <div className="auth-hero-feature">
              <span className="auth-hero-feature-icon">✓</span>
              <span>Comments & activity</span>
            </div>
            <div className="auth-hero-feature">
              <span className="auth-hero-feature-icon">✓</span>
              <span>Light & dark themes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-split auth-right-new">
        <div className="auth-form-wrap">
          <div className="auth-form-header-new">
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {showPasswordNotice && (
            <div className="auth-password-security-notice auth-message-animate" role="status">
              <span className="auth-password-security-icon" aria-hidden>🔒</span>
              <div className="auth-password-security-content">
                <strong>Password security</strong>
                <p>Use a strong, unique password. If your password was found in a data breach, change it in account settings after signing in.</p>
                <p className="auth-password-security-hint">To stop your browser’s “Check your saved passwords” pop-up: Chrome → Settings → Passwords → turn off “Warn you if passwords are exposed in a data breach,” or remove this site from saved passwords.</p>
              </div>
              <button
                type="button"
                className="auth-info-dismiss"
                onClick={dismissPasswordNotice}
                aria-label="Dismiss"
              >
                Dismiss
              </button>
            </div>
          )}

          {error && (
            <div className="auth-error-new auth-message-animate" role="alert">
              <span className="auth-error-icon">!</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-new" noValidate>
            <div className={`form-group-new ${emailError ? 'form-group-error' : ''}`}>
              <label className="form-label-new" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="form-input-new"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => handleBlur('email')}
                placeholder="you@company.com"
                autoComplete="email"
                autoFocus
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'login-email-err' : undefined}
              />
              {emailError && (
                <span id="login-email-err" className="form-field-error">Enter a valid email address</span>
              )}
            </div>
            <div className={`form-group-new ${passwordError ? 'form-group-error' : ''}`}>
              <label className="form-label-new" htmlFor="login-password">Password</label>
              <div className="input-with-icon">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input-new"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password"
                  autoComplete="off"
                  aria-invalid={!!passwordError}
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && (
                <span className="form-field-error">Password must be at least 6 characters</span>
              )}
            </div>
            <button
              type="submit"
              className="btn-auth-primary"
              disabled={loading}
            >
              {loading ? (
                <><span className="loading-spinner btn-spinner"></span> Signing in...</>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="auth-switch-new">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="auth-link-new">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
