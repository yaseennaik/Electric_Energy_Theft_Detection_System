import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  CheckCircle2,
  Cpu,
  Database,
  FileSpreadsheet,
  History,
  LineChart as LineChartIcon,
  Lock,
  Play,
  ScanLine,
  Server,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { fallbackImportance, fallbackMetrics, heroAnomalies, heroSeries } from '../lib/demoData'

const FEATURES = [
  {
    icon: ScanLine,
    title: 'Real-time anomaly scoring',
    text: 'Score any meter reading instantly with a tuned probability threshold and clear risk tier.',
    color: 'mint',
  },
  {
    icon: FileSpreadsheet,
    title: 'Batch CSV analysis',
    text: 'Drop in thousands of readings, auto-derive rolling averages and export an auditable report.',
    color: 'blue',
  },
  {
    icon: BrainCircuit,
    title: 'Explainable decisions',
    text: 'Every alert includes the features that drove it — no black-box guesswork for your team.',
    color: 'violet',
  },
  {
    icon: BarChart3,
    title: 'Dataset intelligence',
    text: 'Explore consumption trends, class balance, feature distributions and correlations in one place.',
    color: 'amber',
  },
  {
    icon: History,
    title: 'Persistent investigation trail',
    text: 'Every prediction is stored against your account with timestamps, filters and search.',
    color: 'pink',
  },
  {
    icon: Lock,
    title: 'Secure analyst access',
    text: 'JWT-protected API, hashed passwords and per-user prediction history out of the box.',
    color: 'mint',
  },
]

const STEPS = [
  { n: '01', icon: Database, title: 'Collect readings', text: 'Half-hourly consumption, temperature, humidity and wind speed feed the pipeline.' },
  { n: '02', icon: Cpu, title: 'Prepare & balance', text: 'Rolling averages, standardization and SMOTE prepare the imbalanced 5% theft class.' },
  { n: '03', icon: Activity, title: 'Score with the model', text: 'A 300-tree random forest outputs a calibrated theft probability for every row.' },
  { n: '04', icon: ShieldCheck, title: 'Act on alerts', text: 'Review risk tiers, inspect explanations and export investigation-ready reports.' },
]

const tooltipStyle = {
  background: '#101a2d',
  border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 10,
  color: '#e7eefb',
  fontSize: 12,
}

export default function Landing() {
  const navigate = useNavigate()
  const { demoLogin, isAuthenticated } = useAuth()
  const [info, setInfo] = useState(null)
  const [demoLoading, setDemoLoading] = useState(false)

  useEffect(() => {
    api.get('/model/info').then((response) => setInfo(response.data)).catch(() => {})
  }, [])

  const metrics = info?.metrics || fallbackMetrics
  const importance = info?.features?.length
    ? info.features.map((item) => ({ label: item.label, importance: item.importance }))
    : fallbackImportance
  const matrix = metrics.confusion_matrix || fallbackMetrics.confusion_matrix

  const tryDemo = async () => {
    setDemoLoading(true)
    try {
      if (!isAuthenticated) await demoLogin()
      navigate('/app')
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="landing">
      <Navbar />

      <main>
        {/* ------------------------------------------------------------- hero */}
        <section className="hero">
          <div className="hero-grid-bg" />
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="container hero-inner">
            <div className="hero-copy">
              <div className="eyebrow-pill">
                <Sparkles size={14} /> Machine learning for smarter grids
              </div>
              <h1>
                Catch energy theft <span className="gradient-text">before it costs you.</span>
              </h1>
              <p className="hero-lead">
                VoltGuard turns raw smart-meter readings into precise, explainable theft alerts.
                One trained Random Forest, a complete analyst workspace, and decisions you can defend.
              </p>
              <div className="hero-cta">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Start detecting <ArrowRight size={17} />
                </Link>
                <button className="btn btn-outline btn-lg" onClick={tryDemo} disabled={demoLoading}>
                  <Play size={15} fill="currentColor" /> {demoLoading ? 'Launching…' : 'Try live demo'}
                </button>
              </div>
              <div className="hero-trust">
                {[
                  ['96.9%', 'Accuracy'],
                  ['99.7%', 'ROC-AUC'],
                  ['5,000', 'Readings analyzed'],
                  ['30 min', 'Data resolution'],
                ].map(([value, label]) => (
                  <div key={label}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-visual">
              <div className="mock-window">
                <div className="mock-titlebar">
                  <div className="window-dots"><i /><i /><i /></div>
                  <span>voltguard / live-monitor</span>
                  <span className="mock-live"><span className="live-dot" /> LIVE</span>
                </div>
                <div className="mock-body">
                  <div className="mock-metrics">
                    <div><span>Consumption</span><strong>0.376 <small>kWh</small></strong><em>+2.4%</em></div>
                    <div><span>Flagged today</span><strong>07</strong><em className="down">−12%</em></div>
                    <div><span>Model confidence</span><strong>96.9%</strong><em>stable</em></div>
                  </div>
                  <div className="mock-chart-head">
                    <strong>Consumption stream</strong>
                    <span>Last 36 readings</span>
                  </div>
                  <div className="mock-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={heroSeries} margin={{ top: 6, right: 4, left: -32, bottom: 0 }}>
                        <defs>
                          <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38e8b0" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#38e8b0" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                        <XAxis dataKey="time" tick={{ fill: '#61708a', fontSize: 10 }} tickLine={false} axisLine={false} interval={8} />
                        <YAxis tick={{ fill: '#61708a', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 0.8]} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area type="monotone" dataKey="consumption" stroke="#38e8b0" strokeWidth={2} fill="url(#heroArea)" />
                        {heroAnomalies.map((point) => (
                          <ReferenceDot key={point.time} x={point.time} y={point.consumption} r={4} fill="#ff5d6c" stroke="#0b1220" strokeWidth={2} />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mock-alerts">
                    <div className="mock-alert-head"><span>Recent detections</span><Link to="/app/history">View all</Link></div>
                    <div className="mock-alert-row">
                      <span className="alert-icon red"><AlertTriangle size={13} /></span>
                      <div><strong>Abnormal consumption</strong><small>Timestamp 09:30 · 98% probability</small></div>
                      <span className="mock-sev critical">Critical</span>
                    </div>
                    <div className="mock-alert-row">
                      <span className="alert-icon amber"><Zap size={13} /></span>
                      <div><strong>Load deviation</strong><small>Timestamp 13:00 · 71% probability</small></div>
                      <span className="mock-sev high">High</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="float-card float-top">
                <span className="float-icon"><ShieldCheck size={17} /></span>
                <div><strong>99.7% ROC-AUC</strong><small>Verified on held-out data</small></div>
              </div>
              <div className="float-card float-bottom">
                <span className="float-icon warn"><Zap size={17} /></span>
                <div><strong>Theft isolated</strong><small>Rolling average anomaly</small></div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- stats */}
        <section className="stat-band">
          <div className="container stat-band-inner">
            {[
              ['5,000', 'Labeled smart-meter readings'],
              ['5', 'Engineered numeric features'],
              ['300', 'Trees in the ensemble'],
              ['95% → 100%', 'Class balance after SMOTE'],
            ].map(([value, label]) => (
              <div key={label}><strong>{value}</strong><span>{label}</span></div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------- features */}
        <section className="section" id="features">
          <div className="container">
            <div className="section-head center">
              <div className="eyebrow">Everything you need</div>
              <h2>From raw readings to <span className="gradient-text">confident action</span></h2>
              <p>A complete detection workflow — not just a notebook. Built for analysts who need to investigate, explain and share every decision.</p>
            </div>
            <div className="feature-grid">
              {FEATURES.map(({ icon: Icon, title, text, color }) => (
                <article className="feature-card" key={title}>
                  <span className={`feature-icon ${color}`}><Icon size={21} /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <span className="feature-line" />
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- how it works */}
        <section className="section section-alt" id="how">
          <div className="container">
            <div className="section-head center">
              <div className="eyebrow">The pipeline</div>
              <h2>How VoltGuard <span className="gradient-text">detects theft</span></h2>
              <p>The same preprocessing and model used in the research notebook, served through a reliable production API.</p>
            </div>
            <div className="steps-grid">
              {STEPS.map(({ n, icon: Icon, title, text }) => (
                <div className="step" key={n}>
                  <div className="step-num">{n}</div>
                  <span className="step-icon"><Icon size={22} /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- performance */}
        <section className="section" id="performance">
          <div className="container perf-grid">
            <div className="perf-copy">
              <div className="eyebrow">Model performance</div>
              <h2>Numbers that <span className="gradient-text">hold up</span></h2>
              <p>
                Evaluated on a 1,900-row held-out test set generated from the SMOTE-balanced dataset.
                The model catches almost every theft case while keeping false alarms low.
              </p>
              <div className="metric-grid">
                {[
                  ['Accuracy', metrics.accuracy],
                  ['Precision', metrics.precision],
                  ['Recall', metrics.recall],
                  ['ROC-AUC', metrics.roc_auc],
                ].map(([label, value]) => (
                  <div className="metric-tile" key={label}>
                    <strong>{(value * 100).toFixed(1)}%</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div className="matrix-block">
                <div className="matrix-title">Confusion matrix <span>held-out test set</span></div>
                <div className="matrix-grid">
                  <div className="matrix-corner" />
                  <div className="matrix-col">Pred. Normal</div>
                  <div className="matrix-col">Pred. Theft</div>
                  <div className="matrix-row">Normal</div>
                  <div className="matrix-cell good">{matrix[0][0]}</div>
                  <div className="matrix-cell soft">{matrix[0][1]}</div>
                  <div className="matrix-row">Theft</div>
                  <div className="matrix-cell soft">{matrix[1][0]}</div>
                  <div className="matrix-cell strong">{matrix[1][1]}</div>
                </div>
              </div>
            </div>

            <div className="perf-card">
              <div className="perf-card-head">
                <div><strong>Feature influence</strong><span>What drives a theft alert</span></div>
                <BarChart3 size={18} />
              </div>
              <div className="importance-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={importance} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 4 }}>
                    <XAxis type="number" domain={[0, 0.5]} hide />
                    <YAxis type="category" dataKey="label" width={120} tick={{ fill: '#aebbd2', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${(v * 100).toFixed(1)}%`} />
                    <Bar dataKey="importance" radius={[0, 6, 6, 0]} barSize={16}>
                      {importance.map((entry, index) => (
                        <Cell key={entry.label} fill={index < 2 ? '#38e8b0' : '#4ea8ff'} fillOpacity={1 - index * 0.13} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="perf-callout">
                <CheckCircle2 size={18} />
                <p>Consumption level and its 12-reading rolling average account for over <strong>83%</strong> of the model's decisions.</p>
              </div>
              <Link to="/app/model" className="text-link">Open the full model card <ArrowRight size={15} /></Link>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------- analytics */}
        <section className="section section-alt" id="analytics">
          <div className="container analytics-preview">
            <div className="analytics-copy">
              <div className="eyebrow">Explore the data</div>
              <h2>See the signal <span className="gradient-text">behind the alert</span></h2>
              <p>
                Investigate 104 days of half-hourly readings, compare feature distributions across
                classes and understand exactly where anomalies appear in the timeline.
              </p>
              <ul className="check-list">
                <li><Check size={15} /> Interactive consumption timeline with theft markers</li>
                <li><Check size={15} /> Feature distribution and correlation analysis</li>
                <li><Check size={15} /> Dataset summary and class balance statistics</li>
              </ul>
              <Link to="/register" className="btn btn-primary">Unlock analytics <ArrowRight size={16} /></Link>
            </div>
            <div className="analytics-card">
              <div className="analytics-card-head">
                <div><strong>Electricity consumption over time</strong><span>Anomalies highlighted in red</span></div>
                <span className="chip"><LineChartIcon size={13} /> 5,000 points</span>
              </div>
              <div className="analytics-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={heroSeries} margin={{ top: 14, right: 8, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id="analyticsArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4ea8ff" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#4ea8ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: '#61708a', fontSize: 10 }} tickLine={false} axisLine={false} interval={7} />
                    <YAxis tick={{ fill: '#61708a', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="consumption" stroke="#4ea8ff" strokeWidth={2} fill="url(#analyticsArea)" />
                    <Area type="monotone" dataKey="average" stroke="#38e8b0" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
                    {heroAnomalies.map((point) => (
                      <ReferenceDot key={point.time} x={point.time} y={point.consumption} r={5} fill="#ff5d6c" stroke="#0b1220" strokeWidth={2} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="analytics-card-foot">
                <span><i className="legend-dot blue" /> Consumption</span>
                <span><i className="legend-dot mint" /> 12-reading average</span>
                <span><i className="legend-dot red" /> Theft flagged</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- stack */}
        <section className="section">
          <div className="container">
            <div className="section-head center">
              <div className="eyebrow">Built with</div>
              <h2>A modern, <span className="gradient-text">portable stack</span></h2>
            </div>
            <div className="stack-row">
              {[
                [Server, 'FastAPI', 'Async REST API'],
                [BrainCircuit, 'scikit-learn', 'Random Forest + SMOTE'],
                [Database, 'SQLite + SQLAlchemy', 'Persistent history'],
                [Zap, 'React + Vite', 'Responsive SPA'],
              ].map(([Icon, name, detail]) => (
                <div className="stack-item" key={name}>
                  <Icon size={20} />
                  <strong>{name}</strong>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ cta */}
        <section className="cta-section">
          <div className="container cta-inner">
            <div className="cta-glow" />
            <div className="eyebrow-pill"><Sparkles size={14} /> Ready when you are</div>
            <h2>Your grid has a story.<br /><span className="gradient-text">Start reading it.</span></h2>
            <p>Create a free analyst account or jump straight into the live demo. No setup, no credentials to remember.</p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-light btn-lg">Create account <ArrowRight size={17} /></Link>
              <button className="btn btn-outline-light btn-lg" onClick={tryDemo} disabled={demoLoading}>
                <Play size={15} fill="currentColor" /> Try live demo
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
