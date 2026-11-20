import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowRight,
  BarChart3,
  ClipboardList,
  Gauge,
  History,
  ShieldAlert,
  SlidersHorizontal,
  Upload,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState, PageHeader, RiskBadge, StatCard } from '../components/ui'
import api from '../lib/api'
import { fmt, fmtDate, pct } from '../lib/utils'

const tooltipStyle = {
  background: '#101a2d',
  border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 10,
  color: '#e7eefb',
  fontSize: 12,
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/stats'), api.get('/analytics/timeseries?limit=160')])
      .then(([statsResponse, seriesResponse]) => {
        setStats(statsResponse.data)
        setSeries(seriesResponse.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const anomalies = series.filter((point) => point.label === 1)
  const riskData = [
    { name: 'Normal', value: stats?.normal_predictions || 0, color: '#38e8b0' },
    { name: 'Flagged', value: stats?.flagged_predictions || 0, color: '#ff5d6c' },
  ]

  return (
    <div className="page">
      <PageHeader
        eyebrow="Workspace overview"
        title="Good to see you again."
        description="Here's what your detection engine has been doing across the grid."
        actions={
          <>
            <Link to="/app/batch" className="btn btn-outline"><Upload size={16} /> Batch upload</Link>
            <Link to="/app/predict" className="btn btn-primary"><SlidersHorizontal size={16} /> New prediction</Link>
          </>
        }
      />

      <div className="stat-grid">
        <StatCard icon={ClipboardList} label="Total predictions" value={stats?.total_predictions ?? '—'} hint="Across all sessions" tone="blue" loading={loading} />
        <StatCard icon={ShieldAlert} label="Theft flagged" value={stats?.flagged_predictions ?? '—'} hint={stats ? `${stats.flag_rate}% of all predictions` : 'Loading…'} tone="red" loading={loading} />
        <StatCard icon={Gauge} label="Average risk" value={stats ? pct(stats.average_probability) : '—'} hint="Mean theft probability" tone="amber" loading={loading} />
        <StatCard icon={Activity} label="Model accuracy" value={stats ? `${(stats.model.accuracy * 100).toFixed(1)}%` : '—'} hint={stats?.model.name || 'Random Forest'} tone="mint" loading={loading} />
      </div>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-head">
            <div><h3>Consumption stream</h3><p>Smart-meter readings with flagged anomalies highlighted</p></div>
            <span className="chip"><span className="live-dot" /> Live model</span>
          </div>
          <div className="chart-large">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38e8b0" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#38e8b0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="timestamp" tick={{ fill: '#63708a', fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.max(1, Math.floor(series.length / 6))} />
                <YAxis tick={{ fill: '#63708a', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 1]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="electricity_consumed" name="Consumption" stroke="#38e8b0" strokeWidth={2} fill="url(#dashArea)" />
                <Area type="monotone" dataKey="avg_of_past12" name="12-reading avg" stroke="#4ea8ff" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
                {anomalies.map((point, index) => (
                  <ReferenceDot key={`${point.timestamp}-${index}`} x={point.timestamp} y={point.electricity_consumed} r={4} fill="#ff5d6c" stroke="#0b1220" strokeWidth={2} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <span><i className="legend-dot mint" /> Consumption</span>
            <span><i className="legend-dot blue" /> 12-reading average</span>
            <span><i className="legend-dot red" /> Theft reading</span>
          </div>
        </section>

        <section className="panel risk-panel">
          <div className="panel-head">
            <div><h3>Your detection mix</h3><p>Normal vs flagged predictions</p></div>
          </div>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskData} dataKey="value" innerRadius={62} outerRadius={86} paddingAngle={4} stroke="none">
                  {riskData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>{stats?.total_predictions ?? 0}</strong>
              <span>predictions</span>
            </div>
          </div>
          <div className="donut-labels">
            {riskData.map((entry) => (
              <div key={entry.name}><span><i className="legend-dot" style={{ background: entry.color }} /> {entry.name}</span><strong>{entry.value}</strong></div>
            ))}
          </div>
          <Link to="/app/history" className="text-link">View all predictions <ArrowRight size={15} /></Link>
        </section>
      </div>

      <div className="dashboard-lower">
        <section className="panel">
          <div className="panel-head">
            <div><h3>Recent activity</h3><p>Your latest scoring requests</p></div>
            <Link to="/app/history" className="text-link">See history <ArrowRight size={14} /></Link>
          </div>
          {stats?.recent?.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Reading</th><th>Probability</th><th>Risk</th><th>Source</th><th>When</th></tr></thead>
                <tbody>
                  {stats.recent.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{fmt(item.electricity_consumed)}</strong> kWh</td>
                      <td>{pct(item.probability)}</td>
                      <td><RiskBadge level={item.risk_level} /></td>
                      <td className="capitalize">{item.source}</td>
                      <td className="muted">{fmtDate(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={History}
              title="No predictions yet"
              description="Score your first reading or upload a CSV to start building your investigation trail."
              action={<Link to="/app/predict" className="btn btn-primary btn-sm">Make a prediction <ArrowRight size={14} /></Link>}
            />
          )}
        </section>

        <section className="panel quick-panel">
          <div className="panel-head"><div><h3>Quick actions</h3><p>Jump back into the workflow</p></div></div>
          <Link to="/app/predict" className="quick-action">
            <span className="quick-icon mint"><SlidersHorizontal size={18} /></span>
            <span><strong>Score a reading</strong><small>Enter five features and get an instant verdict</small></span>
            <ArrowRight size={16} />
          </Link>
          <Link to="/app/batch" className="quick-action">
            <span className="quick-icon blue"><Upload size={18} /></span>
            <span><strong>Analyze a CSV</strong><small>Upload up to 2,000 readings at once</small></span>
            <ArrowRight size={16} />
          </Link>
          <Link to="/app/analytics" className="quick-action">
            <span className="quick-icon violet"><BarChart3 size={18} /></span>
            <span><strong>Explore the dataset</strong><small>Charts, correlations and feature distributions</small></span>
            <ArrowRight size={16} />
          </Link>
          <div className="quick-tip">
            <Zap size={16} />
            <p><strong>Tip:</strong> Lower the decision threshold to catch more theft cases — at the cost of more false alarms.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
