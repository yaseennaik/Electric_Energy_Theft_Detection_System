import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Eye, Filter, History as HistoryIcon, Search, Trash2, X } from 'lucide-react'
import { EmptyState, PageHeader, RiskBadge, Spinner } from '../components/ui'
import api from '../lib/api'
import { downloadCsv, fmt, fmtDate, pct } from '../lib/utils'

const PAGE_SIZE = 10

export default function History() {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [prediction, setPrediction] = useState('')
  const [risk, setRisk] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = () => {
    setLoading(true)
    const params = { page, page_size: PAGE_SIZE }
    if (prediction !== '') params.prediction = prediction
    if (risk) params.risk = risk
    if (search) params.search = search
    api
      .get('/history', { params })
      .then((response) => setData(response.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [page, prediction, risk, search])

  const remove = async (id) => {
    setDeleting(id)
    try {
      await api.delete(`/history/${id}`)
      setSelected(null)
      if (data.items.length === 1 && page > 1) setPage(page - 1)
      else load()
    } catch {
      // keep the record visible if deletion fails
    } finally {
      setDeleting(null)
    }
  }

  const exportPage = () => {
    downloadCsv(
      data.items.map((item) => ({
        ID: item.id,
        Timestamp: item.timestamp_value || '',
        Created: item.created_at,
        Batch: item.batch_id || '',
        Source: item.source,
        Electricity: item.electricity_consumed,
        Temperature: item.temperature,
        Humidity: item.humidity,
        WindSpeed: item.wind_speed,
        AvgPast12: item.avg_of_past12,
        Probability: item.probability.toFixed(6),
        Threshold: item.threshold,
        Verdict: item.prediction ? 'Theft' : 'Normal',
        Risk: item.risk_level,
      })),
      `voltguard_history_page_${page}.csv`,
    )
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Investigation trail"
        title="Prediction history"
        description="Every reading you've scored, with filters, details and export."
        actions={
          <button className="btn btn-outline" onClick={exportPage} disabled={!data.items.length}>
            <Download size={16} /> Export page
          </button>
        }
      />

      <section className="panel">
        <div className="filter-bar">
          <div className="search-field"><Search size={16} /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search batch ID or timestamp…" /></div>
          <div className="filter-select"><Filter size={15} />
            <select value={prediction} onChange={(e) => { setPrediction(e.target.value); setPage(1) }}>
              <option value="">All verdicts</option>
              <option value="1">Theft flagged</option>
              <option value="0">Normal</option>
            </select>
          </div>
          <div className="filter-select">
            <select value={risk} onChange={(e) => { setRisk(e.target.value); setPage(1) }}>
              <option value="">All risk levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="elevated">Elevated</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          <span className="filter-count">{data.total} record{data.total === 1 ? '' : 's'}</span>
        </div>

        {loading ? (
          <div className="center-loader"><Spinner size={24} /><span>Loading history…</span></div>
        ) : data.items.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>ID</th><th>Reading</th><th>Probability</th><th>Risk</th><th>Source</th><th>Created</th><th className="right">Actions</th></tr></thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td className="muted">#{item.id}</td>
                    <td><strong>{fmt(item.electricity_consumed)}</strong> kWh</td>
                    <td><strong>{pct(item.probability)}</strong></td>
                    <td><RiskBadge level={item.risk_level} /></td>
                    <td className="capitalize">{item.source}{item.batch_id ? <small className="batch-tag">{item.batch_id}</small> : null}</td>
                    <td className="muted">{fmtDate(item.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" onClick={() => setSelected(item)} title="View details"><Eye size={16} /></button>
                        <button className="icon-btn danger" onClick={() => remove(item.id)} title="Delete" disabled={deleting === item.id}>
                          {deleting === item.id ? <Spinner size={14} /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={HistoryIcon} title="No matching predictions" description="Try adjusting your filters, or score a new reading to get started." />
        )}

        {data.pages > 1 && (
          <div className="pagination">
            <button className="btn btn-ghost btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={15} /> Previous</button>
            <span>Page <strong>{page}</strong> of {data.pages}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages}>Next <ChevronRight size={15} /></button>
          </div>
        )}
      </section>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div><div className="eyebrow">Prediction #{selected.id}</div><h3>{selected.prediction ? 'Theft / Anomaly' : 'Normal consumption'}</h3></div>
              <button className="icon-btn" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="modal-verdict" style={{ background: selected.prediction ? 'rgba(255,93,108,.1)' : 'rgba(56,232,176,.1)' }}>
                <div><span>Theft probability</span><strong>{pct(selected.probability)}</strong></div>
                <div><span>Decision threshold</span><strong>{selected.threshold.toFixed(2)}</strong></div>
                <div><span>Risk level</span><RiskBadge level={selected.risk_level} /></div>
              </div>
              <h4>Input features</h4>
              <div className="detail-grid">
                {[
                  ['Electricity consumed', selected.electricity_consumed],
                  ['Temperature', selected.temperature],
                  ['Humidity', selected.humidity],
                  ['Wind speed', selected.wind_speed],
                  ['12-reading average', selected.avg_of_past12],
                ].map(([label, value]) => (
                  <div key={label}><span>{label}</span><strong>{fmt(value)}</strong></div>
                ))}
              </div>
              <div className="modal-foot-info">
                <span>Source: <strong className="capitalize">{selected.source}</strong></span>
                <span>Batch: <strong>{selected.batch_id || '—'}</strong></span>
                <span>Recorded: <strong>{fmtDate(selected.created_at)}</strong></span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
              <button className="btn btn-danger" onClick={() => remove(selected.id)} disabled={deleting === selected.id}><Trash2 size={15} /> Delete record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
