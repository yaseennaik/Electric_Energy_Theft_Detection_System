import { Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { riskStyle } from '../lib/utils'

export function Logo({ compact = false, to = '/' }) {
  return (
    <Link to={to} className="logo" aria-label="VoltGuard home">
      <span className="logo-mark">
        <Zap size={compact ? 16 : 19} strokeWidth={2.6} fill="currentColor" />
      </span>
      {!compact && (
        <span className="logo-text">
          Volt<span>Guard</span>
        </span>
      )}
    </Link>
  )
}

export function Spinner({ size = 18 }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-label="Loading" />
}

export function RiskBadge({ level, showDot = true }) {
  const style = riskStyle(level)
  return (
    <span className="risk-badge" style={{ color: style.color, background: style.bg }}>
      {showDot && <span className="risk-dot" style={{ background: style.color }} />}
      {style.label}
    </span>
  )
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'mint', loading }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-top">
        <span className="stat-icon">{Icon && <Icon size={19} />}</span>
        <span className="stat-label">{label}</span>
      </div>
      {loading ? <div className="skeleton-line" /> : <div className="stat-value">{value}</div>}
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <span className="empty-icon">
          <Icon size={24} />
        </span>
      )}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}
