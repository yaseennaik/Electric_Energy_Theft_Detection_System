import { useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from './ui'

export default function Navbar() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)
  const go = (path) => {
    close()
    navigate(path)
  }

  return (
    <nav className="nav">
      <div className="nav-inner container">
        <Logo />

        <div className={`nav-links ${open ? 'open' : ''}`}>
          <a href="#features" onClick={close}>Features</a>
          <a href="#how" onClick={close}>How it works</a>
          <a href="#performance" onClick={close}>Model</a>
          <a href="#analytics" onClick={close}>Analytics</a>
          <div className="nav-mobile-actions">
            {isAuthenticated ? (
              <button className="btn btn-primary btn-sm" onClick={() => go('/app')}>Open dashboard</button>
            ) : (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => go('/login')}>Sign in</button>
                <button className="btn btn-primary btn-sm" onClick={() => go('/register')}>Get started</button>
              </>
            )}
          </div>
        </div>

        <div className="nav-actions">
          {isAuthenticated ? (
            <button className="btn btn-primary btn-sm" onClick={() => go('/app')}>
              {user?.full_name?.split(' ')[0] || 'Dashboard'} <ArrowRight size={15} />
            </button>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm nav-signin" onClick={() => go('/login')}>Sign in</button>
              <button className="btn btn-primary btn-sm" onClick={() => go('/register')}>
                Get started <ArrowRight size={15} />
              </button>
            </>
          )}
        </div>

        <button className="nav-toggle" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  )
}
