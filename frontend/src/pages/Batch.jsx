import { useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Gauge,
  ListChecks,
  ShieldAlert,
  UploadCloud,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader, RiskBadge, Spinner, StatCard } from '../components/ui'
import api from '../lib/api'
import { downloadCsv, fmt, pct, templateCsv } from '../lib/utils'

const VISIBLE_ROWS = 40

export default function Batch() {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [threshold, setThreshold] = useState(0.5)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const pick = (selected) => {
    if (!selected) return
    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setError('Please choose a .csv file.')
      return
    }
    setFile(selected)
    setError('')
    setSummary(null)
  }

  const drop = (event) => {
    event.preventDefault()
    setDragging(false)
    pick(event.dataTransfer.files?.[0])
  }

  const run = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post('/predict/batch', form, { params: { threshold } })
      setSummary(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const exportResults = () => {
    if (!summary?.results?.length) return
    downloadCsv(
      summary.results.map((row) => ({
        Row: row.row,
        Timestamp: row.timestamp || '',
        Electricity_Consumed: row.electricity_consumed,
        Temperature: row.temperature,
        Humidity: row.humidity,
        Wind_Speed: row.wind_speed,
        Avg_of_past12: row.avg_of_past12,
        Probability: row.probability.toFixed(6),
        Prediction: row.prediction ? 'Theft' : 'Normal',
        Risk: row.risk_level,
      })),
      `${summary.batch_id}_results.csv`,
    )
  }

  const downloadTemplate = () => {
    const blob = new Blob([templateCsv()], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'voltguard_template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Detection engine"
        title="Batch CSV analysis"
        description="Upload meter readings, score them all in one request and export an investigation-ready report."
        actions={<Link to="/app/history" className="btn btn-outline">View saved batches <ArrowRight size={16} /></Link>}
      />

      <div className="batch-layout">
        <section className="panel upload-panel">
          <div className="panel-head">
            <div><h3>Upload readings</h3><p>CSV up to 10 MB · maximum 2,000 rows</p></div>
            <button className="text-link" onClick={downloadTemplate}><Download size={14} /> Template</button>
          </div>

          <div
            className={`dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={drop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => pick(e.target.files?.[0])} />
            {file ? (
              <>
                <span className="dropzone-icon success"><FileSpreadsheet size={26} /></span>
                <strong>{file.name}</strong>
                <span className="muted">{(file.size / 1024).toFixed(1)} KB · ready to analyze</span>
                <button className="remove-file" onClick={(event) => { event.stopPropagation(); setFile(null); setSummary(null) }}><X size={14} /> Remove</button>
              </>
            ) : (
              <>
                <span className="dropzone-icon"><UploadCloud size={28} /></span>
                <strong>Drop your CSV here</strong>
                <span className="muted">or click to browse files</span>
                <small>Required: Electricity_Consumed, Temperature, Humidity, Wind_Speed<br />Optional: Timestamp, Avg_of_past12 (auto-derived if missing)</small>
              </>
            )}
          </div>

          <div className="threshold-box compact">
            <div className="threshold-head">
              <div><strong>Decision threshold</strong><small>Applied to every row in the file</small></div>
              <span>{threshold.toFixed(2)}</span>
            </div>
            <input type="range" min="0" max="1" step="0.01" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="threshold-range" />
          </div>

          {error && <div className="alert error"><AlertCircle size={16} /> {error}</div>}
          {summary?.errors?.length ? <div className="alert warning"><AlertCircle size={16} /> {summary.errors.join(' ')}</div> : null}

          <button className="btn btn-primary btn-block btn-lg" onClick={run} disabled={!file || uploading}>
            {uploading ? <Spinner /> : <><UploadCloud size={17} /> Analyze readings</>}
          </button>
        </section>

        <div className="batch-results">
          {!summary ? (
            <section className="panel result-placeholder tall">
              <span className="placeholder-icon"><ListChecks size={28} /></span>
              <h3>No analysis yet</h3>
              <p>Your batch summary and row-by-row results will appear here after you upload a CSV.</p>
              <div className="format-list">
                <div><strong>Expected columns</strong><code>Timestamp, Electricity_Consumed, Temperature, Humidity, Wind_Speed</code></div>
                <div><strong>Auto-derived</strong><code>Avg_of_past12 = rolling 12-reading mean</code></div>
              </div>
            </section>
          ) : (
            <>
              <div className="stat-grid batch-stats">
                <StatCard icon={ListChecks} label="Rows analyzed" value={summary.processed_rows} hint={`${summary.total_rows} in file`} tone="blue" />
                <StatCard icon={ShieldAlert} label="Theft flagged" value={summary.flagged_count} hint={`${summary.flag_rate}% flag rate`} tone="red" />
                <StatCard icon={Gauge} label="Avg probability" value={pct(summary.average_probability)} hint="Across the batch" tone="amber" />
                <StatCard icon={CheckCircle2} label="Critical alerts" value={summary.critical_count} hint="Probability ≥ 0.85" tone="mint" />
              </div>

              <section className="panel">
                <div className="panel-head">
                  <div><h3>Row-level results</h3><p>Batch {summary.batch_id} · showing first {Math.min(summary.results.length, VISIBLE_ROWS)} of {summary.results.length}</p></div>
                  <button className="btn btn-outline btn-sm" onClick={exportResults}><Download size={14} /> Export CSV</button>
                </div>
                <div className="table-wrap scroll-table">
                  <table className="table">
                    <thead><tr><th>Row</th><th>Timestamp</th><th>Consumption</th><th>Avg 12</th><th>Probability</th><th>Risk</th><th>Verdict</th></tr></thead>
                    <tbody>
                      {summary.results.slice(0, VISIBLE_ROWS).map((row) => (
                        <tr key={row.row}>
                          <td className="muted">{row.row}</td>
                          <td className="muted">{row.timestamp || '—'}</td>
                          <td>{fmt(row.electricity_consumed)}</td>
                          <td>{fmt(row.avg_of_past12)}</td>
                          <td><strong>{pct(row.probability)}</strong></td>
                          <td><RiskBadge level={row.risk_level} /></td>
                          <td className={row.prediction ? 'result-theft' : 'result-normal'}>{row.prediction ? 'Theft' : 'Normal'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
