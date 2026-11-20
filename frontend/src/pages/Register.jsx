import { useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Lock, Mail, ShieldCheck, Sparkles, UserRound, Zap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo, Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register, demoLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await register({ full_name: form.full_name, email: form.email, password: form.password })
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const demo = async () => {
    setDemoLoading(true)
    try {
      await demoLogin()
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-grid" />
        <Logo />
        <div className="auth-visual-copy">
          <div className="eyebrow-pill"><Sparkles size={14} /> Join the workspace</div>
          <h1>Your own command center for <span className="gradient-text">grid intelligence.</span></h1>
          <p>Create an account to keep every prediction, batch report and investigation in one secure place.</p>
          <div className="auth-points">
            <span><CheckCircle2 size={17} /> Instant detection scoring</span>
            <span><CheckCircle2 size={17} /> CSV batch reports</span>
            <span><CheckCircle2 size={17} /> Full analytics suite</span>
          </div>
        </div>
        <div className="auth-metric-card">
          <span className="auth-metric-icon"><ShieldCheck size={20} /></span>
          <div><strong>JWT secured</strong><span>Hashed passwords · private history</span></div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <Link to="/" className="back-link"><ArrowLeft size={15} /> Back to home</Link>
          <div className="auth-form-head">
            <h2>Create your account</h2>
            <p>Get full access in under a minute.</p>
          </div>

          {error && <div className="alert error"><AlertCircle size={16} /> {error}</div>}

          <form onSubmit={submit} className="auth-form">
            <label>
              <span>Full name</span>
              <div className="input-with-icon"><UserRound size={16} /><input value={form.full_name} onChange={update('full_name')} placeholder="Energy Analyst" required /></div>
            </label>
            <label>
              <span>Email address</span>
              <div className="input-with-icon"><Mail size={16} /><input type="email" value={form.email} onChange={update('email')} placeholder="you@company.com" required /></div>
            </label>
            <label>
              <span>Password</span>
              <div className="input-with-icon"><Lock size={16} /><input type="password" value={form.password} onChange={update('password')} placeholder="At least 6 characters" minLength={6} required /></div>
            </label>
            <label>
              <span>Confirm password</span>
              <div className="input-with-icon"><Lock size={16} /><input type="password" value={form.confirm} onChange={update('confirm')} placeholder="Repeat your password" minLength={6} required /></div>
            </label>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <Spinner /> : <>Create account <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>
          <button className="btn btn-outline btn-block" onClick={demo} disabled={demoLoading}>
            {demoLoading ? <Spinner /> : <><Zap size={16} /> Explore with demo account</>}
          </button>

          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  )
}
