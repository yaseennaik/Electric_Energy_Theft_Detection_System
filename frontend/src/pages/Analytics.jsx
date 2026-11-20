import { useEffect, useState } from 'react'
import {
  Activity,
  BarChart3,
  CalendarDays,
  Database,
  Grid3X3,
  Layers,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  ShieldAlert,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader, Spinner, StatCard } from '../components/ui'
import api from '../lib/api'
import { fmt } from '../lib/utils'

const tooltipStyle = {
  background: '#101a2d',
  border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 10,
  color: '#e7eefb',
  fontSize: 12,
}

function heatColor(value) {
  if (value >= 0.9) return 'rgba(56,232,176,.9)'
  if (value >= 0.6) return 'rgba(56,232,176,.55)'
  if (value >= 0.3) return 'rgba(78,168,255,.4)'
  if (value >= 0.1) return 'rgba(78,168,255,.2)'
  if (value >= -0.1) return 'rgba(120,140,170,.14)'
  return 'rgba(255,93,108,.45)'
}

export default function Analytics() {
  const [overview, setOverview] = useState(null)
  const [series, setSeries] = useState([])
  const [distributions, setDistributions] = useState([])
  const [correlation, setCorrelation] = useState(null)
  const [activeFeature, setActiveFeature] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/timeseries?limit=180'),
      api.get('/analytics/distributions'),
      api.get('/analytics/correlation'),
    ])
      .then(([a, b, c, d]) => {
        setOverview(a.data)
        setSeries(b.data)
        setDistributions(c.data)
        setCorrelation(d.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="page"><div className="center-loader tall-loader"><Spinner size={28} /><span>Loading dataset analytics…</span></div></div>
  }

  const anomalies = series.filter((point) => point.label === 1)
  const distribution = distributions[activeFeature]
  const classData = overview
    ? [
        { name: 'Normal', value: overview.normal_readings, color: '#38e8b0' },
        { name: 'Theft', value: overview.theft_readings, color: '#ff5d6c' },
      ]
    : []

  return (
    <div className="page">
      <PageHeader
        eyebrow="Dataset intelligence"
        title="Explore the signals"
        description="A closer look at the 5,000 half-hourly readings behind the detection model."
      />

      <div className="stat-grid">
        <StatCard icon={Database} label="Total readings" value={overview?.total_readings ?? '—'} hint="Half-hourly intervals" tone="blue" />
        <StatCard icon={ShieldAlert} label="Theft readings" value={overview?.theft_readings ?? '—'} hint={`${overview?.theft_rate ?? 0}% of dataset`} tone="red" />
        <StatCard icon={Activity} label="Mean consumption" value={overview ? fmt(overview.feature_summary[0].mean) : '—'} hint="Normalized kWh" tone="mint" />
        <StatCard icon={CalendarDays} label="Observation window" value={overview ? `${overview.start_date.slice(2)} → ${overview.end_date.slice(2)}` : '—'} hint="104 days of data" tone="amber" />
      </div>

      <div className="panel">
        <div className="panel-head">
          <div><h3>Consumption timeline</h3><p>Every sampled reading, with theft events highlighted</p></div>
          <span className="chip"><LineChartIcon size={13} /> {series.length} sampled points</span>
        </div>
        <div className="chart-xlarge">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="anaArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ea8ff" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#4ea8ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
              <XAxis dataKey="timestamp" tick={{ fill: '#63708a', fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.max(1, Math.floor(series.length / 8))} />
              <YAxis tick={{ fill: '#63708a', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 1]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="electricity_consumed" name="Consumption" stroke="#4ea8ff" strokeWidth={2} fill="url(#anaArea)" />
              <Area type="monotone" dataKey="avg_of_past12" name="12-reading avg" stroke="#38e8b0" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
              {anomalies.map((point, index) => (
                <ReferenceDot key={`${point.timestamp}-${index}`} x={point.timestamp} y={point.electricity_consumed} r={4} fill="#ff5d6c" stroke="#0b1220" strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-legend">
          <span><i className="legend-dot blue" /> Consumption</span>
          <span><i className="legend-dot mint" /> 12-reading average</span>
          <span><i className="legend-dot red" /> Theft reading</span>
        </div>
      </div>

      <div className="analytics-row">
        <section className="panel">
          <div className="panel-head"><div><h3>Class balance</h3><p>Severe imbalance handled with SMOTE</p></div><PieChartIcon size={17} /></div>
          <div className="donut-wrap compact-donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={classData} dataKey="value" innerRadius={55} outerRadius={78} paddingAngle={4} stroke="none">
                  {classData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center"><strong>{overview?.theft_rate ?? 0}%</strong><span>theft</span></div>
          </div>
          <div className="donut-labels">
            {classData.map((entry) => (
              <div key={entry.name}><span><i className="legend-dot" style={{ background: entry.color }} /> {entry.name}</span><strong>{entry.value.toLocaleString()}</strong></div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div><h3>Feature distributions</h3><p>Compare normal and theft readings</p></div>
            <Layers size={17} />
          </div>
          <div className="feature-tabs">
            {distributions.map((item, index) => (
              <button key={item.feature} className={index === activeFeature ? 'active' : ''} onClick={() => setActiveFeature(index)}>{item.label}</button>
            ))}
          </div>
          {distribution && (
            <div className="chart-medium">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution.bins} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                  <XAxis dataKey="range" tick={{ fill: '#63708a', fontSize: 9 }} tickLine={false} axisLine={false} interval={1} />
                  <YAxis tick={{ fill: '#63708a', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="normal" name="Normal" fill="#38e8b0" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="theft" name="Theft" fill="#ff5d6c" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <div className="analytics-bottom">
        <section className="panel">
          <div className="panel-head"><div><h3>Feature correlations</h3><p>Pearson correlation between the five model inputs</p></div><Grid3X3 size={17} /></div>
          {correlation && (
            <div className="heatmap" style={{ gridTemplateColumns: `130px repeat(${correlation.labels.length}, 1fr)` }}>
              <div />
              {correlation.labels.map((label) => <div className="heat-label" key={label}>{label}</div>)}
              {correlation.matrix.map((row, i) => (
                <div className="heat-row" key={correlation.labels[i]} style={{ display: 'contents' }}>
                  <div className="heat-label">{correlation.labels[i]}</div>
                  {row.map((value, j) => (
                    <div className="heat-cell" key={j} style={{ background: heatColor(value) }} title={`${correlation.labels[i]} × ${correlation.labels[j]}: ${value}`}>
                      {value.toFixed(2)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><div><h3>Feature statistics</h3><p>Distribution summary per input</p></div><BarChart3 size={17} /></div>
          <div className="table-wrap">
            <table className="table compact-table">
              <thead><tr><th>Feature</th><th>Mean</th><th>Std</th><th>Min</th><th>Max</th></tr></thead>
              <tbody>
                {overview?.feature_summary.map((item) => (
                  <tr key={item.feature}>
                    <td><strong>{item.label}</strong></td>
                    <td>{fmt(item.mean)}</td>
                    <td>{fmt(item.std)}</td>
                    <td>{fmt(item.min)}</td>
                    <td>{fmt(item.max)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
