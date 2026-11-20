import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Info,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader, RiskBadge, Spinner } from '../components/ui'
import api from '../lib/api'
import { fmt, pct, riskStyle } from '../lib/utils'

const FIELDS = [
  { key: 'electricity_consumed', label: 'Electricity consumed', unit: 'kWh', hint: 'Normalized consumption for this interval (0–1)' },
  { key: 'temperature', label: 'Temperature', unit: 'norm', hint: 'Normalized ambient temperature (0–1)' },
  { key: 'humidity', label: 'Humidity', unit: 'norm', hint: 'Normalized relative humidity (0–1)' },
  { key: 'wind_speed', label: 'Wind speed', unit: 'norm', hint: 'Normalized wind speed (0–1)' },
  { key: 'avg_of_past12', label: '12-reading average', unit: 'kWh', hint: 'Rolling mean of the last 12 readings' },
]

const EMPTY = {
  electricity_consumed: 0.3767,
  temperature: 0.5251,
  humidity: 0.4976,
  wind_speed: 0.4646,
  avg_of_past12: 0.3767,
}

const RECOMMENDATIONS = {
  critical: 'Immediate review recommended. Cross-check the meter for tampering, bypass wiring or an unregistered load.',
  high: 'Investigate this connection. Compare against nearby intervals and verify the meter seal on site.',
  elevated: 'Flag for monitoring. This reading crosses your alert threshold — watch the next few intervals.',
  normal: 'No action required. Consumption patterns are consistent with normal operation.',
}

function Gauge({ value, color }) {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - Math.min(Math.max(value, 0), 1) * circumference
  return (
    <div className="gauge">
      <svg viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={radius} className="gauge-track" />
        <circle
          cx="90" cy="90" r={radius} className="gauge-value"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="gauge-center">
        <strong style={{ color }}>{pct(value, 1)}</strong>
        <span>theft probability</span>
      </div>
    </div>
  )
}

export default function Predict() {
  const [form, setForm] = useState(EMPTY)
  const [threshold, setThreshold] = useState(0.5)
  const [result, setResult] = useState(null)
  const [samples, setSamples] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/analytics/samples').then((response) => setSamples(response.data)).catch(() => {})
  }, [])

  const change = (key) => (event) => {
    const value = event.target.value === '' ? '' : Number(event.target.value)
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const loadSample = (kind) => {
    if (!samples?.[kind]) return
    setForm(samples[kind])
    setResult(null)
    setError('')
  }

  const reset = () => {
    setForm(EMPTY)
    setResult(null)
    setError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { ...form, threshold }
      const { data } = await api.post('/predict', payload)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const risk = result ? riskStyle(result.risk_level) : null

  return (
    <div className="page">
      <PageHeader
        eyebrow="Detection engine"
        title="Score a single reading"
        description="Enter the five model features, tune the decision threshold and inspect the explanation."
        actions={<Link to="/app/history" className="btn btn-outline"><ChevronRight size={16} /> View history</Link>}
      />

      <div className="predict-grid">
        <section className="panel form-panel">
          <div className="panel-head">
            <div><h3>Reading details</h3><p>All values are normalized between 0 and 1</p></div>
            <span className="chip"><SlidersHorizontal size={13} /> 5 features</span>
          </div>

          <div className="sample-bar">
            <span><Sparkles size={14} /> Try a sample:</span>
            <button type="button" onClick={() => loadSample('normal')} disabled={!samples}>Normal reading</button>
            <button type="button" onClick={() => loadSample('theft')} disabled={!samples}>Theft reading</button>
            <button type="button" className="reset-btn" onClick={reset}><RotateCcw size={13} /> Reset</button>
          </div>

          {error && <div className="alert error">{error}</div>}

          <form onSubmit={submit} className="predict-form">
            {FIELDS.map(({ key, label, unit, hint }) => (
              <div className="field" key={key}>
                <div className="field-top">
                  <label htmlFor={key}>{label}</label>
                  <span className="field-unit">{unit}</span>
                </div>
                <div className="field-control">
                  <input
                    id={key}
                    type="number"
                    min="0"
                    max="1"
                    step="0.0001"
                    value={form[key]}
                    onChange={change(key)}
                    required
                  />
                  <input
                    className="field-range"
                    type="range"
                    min="0"
                    max="1"
                    step="0.001"
                    value={form[key] || 0}
                    onChange={change(key)}
                    aria-label={`${label} slider`}
                  />
                </div>
                <small>{hint}</small>
              </div>
            ))}

            <div className="threshold-box">
              <div className="threshold-head">
                <div><strong>Decision threshold</strong><small>Lower = more sensitive, higher = more conservative</small></div>
                <span>{threshold.toFixed(2)}</span>
              </div>
              <input type="range" min="0" max="1" step="0.01" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="threshold-range" />
              <div className="threshold-scale"><span>0.00 · sensitive</span><span>0.50</span><span>1.00 · strict</span></div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? <Spinner /> : <><Zap size={17} fill="currentColor" /> Run detection</>}
            </button>
          </form>
        </section>

        <div className="result-column">
          {!result ? (
            <section className="panel result-placeholder">
              <span className="placeholder-icon"><SlidersHorizontal size={28} /></span>
              <h3>Your verdict will appear here</h3>
              <p>Fill in the reading on the left and run the model. Each result includes a risk tier, a probability gauge and a feature-level explanation.</p>
              <div className="placeholder-list">
                <span><CheckCircle2 size={15} /> Instant model scoring</span>
                <span><CheckCircle2 size={15} /> Explainable feature influences</span>
                <span><CheckCircle2 size={15} /> Saved to your history</span>
              </div>
            </section>
          ) : (
            <>
              <section className="panel result-panel">
                <div className="result-head">
                  <div>
                    <div className="eyebrow">Detection result</div>
                    <h3 className={result.prediction ? 'result-theft' : 'result-normal'}>
                      {result.prediction ? 'Theft / Anomaly detected' : 'Normal consumption'}
                    </h3>
                    <RiskBadge level={result.risk_level} />
                  </div>
                  <Gauge value={result.probability} color={risk.color} />
                </div>
                <div className="result-meta">
                  <div><span>Threshold</span><strong>{result.threshold.toFixed(2)}</strong></div>
                  <div><span>Classification</span><strong>{result.prediction ? 'Anomaly' : 'Normal'}</strong></div>
                  <div><span>Record</span><strong>#{result.id}</strong></div>
                </div>
                <div className="recommendation" style={{ borderColor: risk.color, background: risk.bg }}>
                  {result.prediction ? <AlertTriangle size={17} color={risk.color} /> : <CheckCircle2 size={17} color={risk.color} />}
                  <p>{RECOMMENDATIONS[result.risk_level]}</p>
                </div>
              </section>

              <section className="panel explain-panel">
                <div className="panel-head">
                  <div><h3>Why this verdict?</h3><p>Feature influence based on z-scores and model importances</p></div>
                  <Info size={17} />
                </div>
                <div className="contribution-list">
                  {result.contributions.map((item) => (
                    <div className="contribution" key={item.feature}>
                      <div className="contribution-top">
                        <span>{item.label}</span>
                        <span className={item.direction === 'increases' ? 'up' : 'down'}>
                          {item.direction === 'increases' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          {item.share}%
                        </span>
                      </div>
                      <div className="contribution-bar"><i style={{ width: `${Math.min(item.share * 2.2, 100)}%` }} /></div>
                      <div className="contribution-foot"><span>value {fmt(item.value)}</span><span>z {fmt(item.z_score, 2)}</span></div>
                    </div>
                  ))}
                </div>
                <p className="explain-note">
                  Positive z-scores indicate values above the training mean. This is an interpretability aid,
                  not a causal claim — see the model card for details.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
