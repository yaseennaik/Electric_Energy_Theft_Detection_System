import { useState } from 'react'
import {
  Activity,
  BarChart3,
  Bell,
  ChevronDown,
  Cpu,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  SlidersHorizontal,
  Upload,
  X,
} from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from './ui'

const GROUPS = [
  {
    label: 'Workspace',
    items: [
      { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/app/predict', label: 'New prediction', icon: SlidersHorizontal },
      { to: '/app/batch', label: 'Batch analysis', icon: Upload },
      { to: '/app/history', label: 'Prediction history', icon: History },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/app/analytics', label: 'Data analytics', icon: BarChart3 },
      { to: '/app/model', label: 'Model card', icon: Cpu },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/app/settings', label: 'Settings', icon: Settings }],
  },
]

const TITLES = {
  '/app': ['Workspace', 'Overview'],
  '/app/predict': ['Workspace', 'New prediction'],
  '/app/batch': ['Workspace', 'Batch analysis'],
  '/app/history': ['Workspace', 'Prediction history'],
  '/app/analytics': ['Intelligence', 'Data analytics'],
  '/app/model': ['Intelligence', 'Model card'],
  '/app/settings': ['Account', 'Settings'],
}

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const [group, page] = TITLES[location.pathname] || ['Workspace', 'VoltGuard']

  const signOut = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-head">
          <Logo to="/app" />
          <button className="icon-btn sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-workspace">
          <span className="workspace-icon"><Activity size={17} /></span>
          <div>
            <strong>Grid Operations</strong>
            <small>Monitoring workspace</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {GROUPS.map((section) => (
            <div className="nav-group" key={section.label}>
              <div className="nav-group-label">{section.label}</div>
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="model-status">
            <span className="live-dot" />
            <div>
              <strong>Detection engine online</strong>
              <small>Random Forest · 300 trees</small>
            </div>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn topbar-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="breadcrumb">
              <span>{group}</span>
              <span className="crumb-sep">/</span>
              <strong>{page}</strong>
            </div>
          </div>
          <div className="topbar-right">
            <span className="env-pill"><span className="live-dot" /> System live</span>
            <Link to="/app/history" className="icon-btn" aria-label="Alerts">
              <Bell size={18} />
            </Link>
            <div className="user-menu-wrap">
              <button className="user-menu-trigger" onClick={() => setMenuOpen((v) => !v)}>
                <span className="avatar">{(user?.full_name || 'U').charAt(0).toUpperCase()}</span>
                <span className="user-meta">
                  <strong>{user?.full_name}</strong>
                  <small>{user?.email}</small>
                </span>
                <ChevronDown size={15} />
              </button>
              {menuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-head">
                    <strong>{user?.full_name}</strong>
                    <span>{user?.email}</span>
                  </div>
                  <Link to="/app/settings" onClick={() => setMenuOpen(false)}><Settings size={15} /> Settings</Link>
                  <button onClick={signOut}><LogOut size={15} /> Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
