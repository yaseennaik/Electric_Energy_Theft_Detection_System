import { useState } from 'react'
import { AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, Lock, Mail, Sparkles, Zap } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Logo, Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, demoLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destination = location.state?.from?.pathname || '/app'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const demo = async () => {
    setError('')
    setDemoLoading(true)
    try {
      await demoLogin()
      navigate(destination, { replace: true })
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
          <div className="eyebrow-pill"><Sparkles size={14} /> Welcome back</div>
          <h1>Pick up where your <span className="gradient-text">grid left off.</span></h1>
          <p>Sign in to score new readings, investigate alerts and explore your detection history.</p>
          <div className="auth-points">
            <span><CheckCircle2 size={17} /> Live model scoring</span>
            <span><CheckCircle2 size={17} /> Batch analysis & exports</span>
            <span><CheckCircle2 size={17} /> Per-user investigation history</span>
          </div>
        </div>
        <div className="auth-metric-card">
          <span className="auth-metric-icon"><Zap size={20} fill="currentColor" /></span>
          <div><strong>96.9%</strong><span>Detection accuracy on held-out data</span></div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <Link to="/" className="back-link"><ArrowLeft size={15} /> Back to home</Link>
          <div className="auth-form-head">
            <h2>Sign in to VoltGuard</h2>
            <p>Enter your analyst credentials to continue.</p>
          </div>

          {error && <div className="alert error"><AlertCircle size={16} /> {error}</div>}

          <form onSubmit={submit} className="auth-form">
            <label>
              <span>Email address</span>
              <div className="input-with-icon"><Mail size={16} /><input type="email" value={form.email} onChange={update('email')} placeholder="you@company.com" required /></div>
            </label>
            <label>
              <span>Password</span>
              <div className="input-with-icon"><Lock size={16} /><input type="password" value={form.password} onChange={update('password')} placeholder="Your password" required /></div>
            </label>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <Spinner /> : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>
          <button className="btn btn-outline btn-block" onClick={demo} disabled={demoLoading}>
            {demoLoading ? <Spinner /> : <><Zap size={16} /> Explore with demo account</>}
          </button>
          <p className="demo-hint">Demo access · demo@voltguard.io / demo1234</p>

          <p className="auth-switch">New to VoltGuard? <Link to="/register">Create an account</Link></p>
        </div>
      </div>
    </div>
  )
}
