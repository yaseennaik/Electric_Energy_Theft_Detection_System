import { useState } from 'react'
import { CalendarDays, Cpu, ExternalLink, Github, KeyRound, LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { fmtDate } from '../lib/utils'

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const signOut = () => {
    logout()
    navigate('/')
  }

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(localStorage.getItem('vg_token') || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Account" title="Settings" description="Manage your session and learn about the platform." />

      <div className="settings-grid">
        <section className="panel">
          <div className="panel-head"><div><h3>Profile</h3><p>Your analyst account details</p></div><UserRound size={17} /></div>
          <div className="profile-card">
            <span className="profile-avatar">{(user?.full_name || 'U').charAt(0).toUpperCase()}</span>
            <div><h4>{user?.full_name}</h4><p>{user?.email}</p></div>
            <span className="role-pill">Analyst</span>
          </div>
          <div className="settings-list">
            <div><Mail size={16} /><span>Email</span><strong>{user?.email}</strong></div>
            <div><UserRound size={16} /><span>Full name</span><strong>{user?.full_name}</strong></div>
            <div><CalendarDays size={16} /><span>Member since</span><strong>{fmtDate(user?.created_at)}</strong></div>
            <div><KeyRound size={16} /><span>Authentication</span><strong>JWT · PBKDF2</strong></div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><div><h3>Session & security</h3><p>Your API access</p></div><ShieldCheck size={17} /></div>
          <div className="security-callout">
            <ShieldCheck size={20} />
            <div><strong>Protected workspace</strong><p>Passwords are salted and hashed with PBKDF2-SHA256. API requests are authorized with a signed, expiring bearer token.</p></div>
          </div>
          <div className="token-box">
            <div><span>Access token</span><small>Stored locally in your browser</small></div>
            <button className="btn btn-outline btn-sm" onClick={copyToken}>{copied ? 'Copied!' : 'Copy token'}</button>
          </div>
          <button className="btn btn-danger btn-block" onClick={signOut}><LogOut size={16} /> Sign out</button>
        </section>

        <section className="panel">
          <div className="panel-head"><div><h3>About VoltGuard</h3><p>End-to-end energy theft detection</p></div><Cpu size={17} /></div>
          <p className="about-text">
            VoltGuard is a portfolio project that takes a machine-learning research notebook all the way to a
            deployed full-stack application: FastAPI model serving, a React analytics workspace, persistent
            prediction history and an explainable scoring experience.
          </p>
          <div className="about-links">
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer"><ExternalLink size={15} /> Interactive API docs</a>
            <a href="https://github.com/yaseennaik/Electric_Energy_Theft_Detection_System" target="_blank" rel="noreferrer"><Github size={15} /> Source repository</a>
          </div>
        </section>
      </div>
    </div>
  )
}
