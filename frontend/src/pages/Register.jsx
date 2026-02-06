import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../App.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 6

/** Local part (before @) must contain at least one letter; reject numbers-only */
const emailLocalPartHasLetter = (email) => {
  const local = (email || '').trim().split('@')[0] || ''
  return /[a-zA-Z]/.test(local)
}

const getPasswordStrength = (password) => {
  if (!password) return 0
  let score = 0
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1
  if (password.length >= 8) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  return Math.min(score, 4)
}

const PASSWORD_SECURITY_NOTICE_KEY = 'issueflow-register-password-notice-dismissed'

const Register = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({ email: false, password: false, confirm: false })
  const [showPasswordNotice, setShowPasswordNotice] = useState(true)
  const { register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    try {
      setShowPasswordNotice(!sessionStorage.getItem(PASSWORD_SECURITY_NOTICE_KEY))
    } catch {
      setShowPasswordNotice(true)
    }
  }, [])
  const dismissPasswordNotice = useCallback(() => {
    setShowPasswordNotice(false)
    try { sessionStorage.setItem(PASSWORD_SECURITY_NOTICE_KEY, '1') } catch {}
  }, [])

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])
  const emailValid = !email || (EMAIL_REGEX.test(email.trim()) && emailLocalPartHasLetter(email))
  const emailError = touched.email && email && (!EMAIL_REGEX.test(email.trim()) || !emailLocalPartHasLetter(email))
  const passwordError = touched.password && password.length > 0 && password.length < MIN_PASSWORD_LENGTH
  const confirmError = touched.confirm && confirmPassword !== password && confirmPassword.length > 0

  const handleBlur = useCallback((field) => {
    setTouched((t) => ({ ...t, [field]: true }))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setTouched({ email: true, password: true, confirm: true })

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email.')
      return
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!emailLocalPartHasLetter(trimmedEmail)) {
      setError('Email must contain at least one letter before @ (e.g. user1@example.com, not numbers only).')
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const result = await register(trimmedEmail, password)
    if (result.success) {
      setSuccess('Account created! Redirecting to sign in...')
      setTimeout(() => navigate('/login'), 1500)
    } else {
      setError(result.error || 'Registration failed. Please try again.')
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
          <h1 className="auth-hero-title">Start free. Scale easy.</h1>
          <p className="auth-hero-subtitle">
            Create your account in seconds. No credit card. Unlimited projects and issues.
          </p>
          <div className="auth-hero-features">
            <div className="auth-hero-feature">
              <span className="auth-hero-feature-icon">✓</span>
              <span>Unlimited projects</span>
            </div>
            <div className="auth-hero-feature">
              <span className="auth-hero-feature-icon">✓</span>
              <span>Team collaboration</span>
            </div>
            <div className="auth-hero-feature">
              <span className="auth-hero-feature-icon">✓</span>
              <span>Secure & private</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-split auth-right-new">
        <div className="auth-form-wrap">
          <div className="auth-form-header-new">
            <h2>Create account</h2>
            <p>Enter your details to get started</p>
          </div>

          {showPasswordNotice && (
            <div className="auth-password-security-notice auth-message-animate" role="status">
              <span className="auth-password-security-icon" aria-hidden>🔒</span>
              <div className="auth-password-security-content">
                <strong>Password security</strong>
                <p>Use a strong, unique password not used on other sites. If a password was found in a data breach, choose a different one.</p>
              </div>
              <button type="button" className="auth-info-dismiss" onClick={dismissPasswordNotice} aria-label="Dismiss">Dismiss</button>
            </div>
          )}

          {error && (
            <div className="auth-error-new auth-message-animate" role="alert">
              <span className="auth-error-icon">!</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="auth-success-new auth-message-animate">
              <span className="auth-success-icon">✓</span>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-new" noValidate>
            <div className={`form-group-new ${emailError ? 'form-group-error' : ''}`}>
              <label className="form-label-new" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                className="form-input-new"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError('') }}
                onBlur={() => handleBlur('email')}
                placeholder="you@company.com"
                autoComplete="email"
                autoFocus
                aria-invalid={!!emailError}
              />
              {emailError && (
                <span className="form-field-error">
                  {email && !EMAIL_REGEX.test(email.trim())
                    ? 'Enter a valid email address'
                    : 'Email must contain at least one letter before @ (e.g. user1@example.com)'}
                </span>
              )}
            </div>

            <div className={`form-group-new ${passwordError ? 'form-group-error' : ''}`}>
              <label className="form-label-new" htmlFor="reg-password">Password</label>
              <div className="input-with-icon">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input-new"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError('') }}
                  onBlur={() => handleBlur('password')}
                  placeholder={`Min. ${MIN_PASSWORD_LENGTH} characters`}
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
              {password.length > 0 && (
                <div className="password-strength">
                  <div className="password-strength-bars">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`password-strength-bar ${passwordStrength >= i ? `strength-${passwordStrength}` : ''}`}
                      />
                    ))}
                  </div>
                  <span className="password-strength-label">
                    {passwordStrength === 0 && 'Too short'}
                    {passwordStrength === 1 && 'Fair'}
                    {passwordStrength === 2 && 'Good'}
                    {passwordStrength === 3 && 'Strong'}
                    {passwordStrength === 4 && 'Very strong'}
                  </span>
                </div>
              )}
              {passwordError && (
                <span className="form-field-error">Password must be at least {MIN_PASSWORD_LENGTH} characters</span>
              )}
            </div>

            <div className={`form-group-new ${confirmError ? 'form-group-error' : ''}`}>
              <label className="form-label-new" htmlFor="reg-confirm">Confirm Password</label>
              <div className="input-with-icon">
                <input
                  id="reg-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input-new"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError('') }}
                  onBlur={() => handleBlur('confirm')}
                  placeholder="Confirm your password"
                  autoComplete="off"
                  aria-invalid={!!confirmError}
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
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
              {confirmError && (
                <span className="form-field-error">Passwords do not match</span>
              )}
            </div>

            <button
              type="submit"
              className="btn-auth-primary"
              disabled={loading}
            >
              {loading ? (
                <><span className="loading-spinner btn-spinner"></span> Creating account...</>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="auth-switch-new">
            Already have an account?{' '}
            <Link to="/login" className="auth-link-new">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
