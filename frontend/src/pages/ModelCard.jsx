import { useEffect, useState } from 'react'
import { AlertTriangle, Award, BarChart3, Check, Cpu, GitBranch, Info, Layers, ListChecks, Target } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader, Spinner } from '../components/ui'
import api from '../lib/api'
import { pct } from '../lib/utils'

const tooltipStyle = {
  background: '#101a2d',
  border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 10,
  color: '#e7eefb',
  fontSize: 12,
}

export default function ModelCard() {
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/model/info').then((response) => setInfo(response.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="page"><div className="center-loader tall-loader"><Spinner size={28} /><span>Loading model card…</span></div></div>
  }

  if (!info) return <div className="page"><div className="alert error">Model information is unavailable.</div></div>

  const metrics = info.metrics
  const matrix = metrics.confusion_matrix

  return (
    <div className="page">
      <PageHeader
        eyebrow="Model documentation"
        title="Model card"
        description={`${info.name} · ${info.task}`}
      />

      <section className="model-hero panel">
        <div>
          <span className="model-hero-icon"><Cpu size={24} /></span>
          <h2>{info.name}</h2>
          <p>Supervised anomaly detection for half-hourly smart-meter readings. The serialized Random Forest and StandardScaler artifacts served by this API are the exact ones trained in the project notebook.</p>
        </div>
        <div className="model-hero-score">
          <span><Award size={17} /> Held-out accuracy</span>
          <strong>{pct(metrics.accuracy)}</strong>
          <small>ROC-AUC {pct(metrics.roc_auc)}</small>
        </div>
      </section>

      <div className="stat-grid">
        {[
          ['Accuracy', metrics.accuracy, 'mint', Target],
          ['Precision', metrics.precision, 'blue', BarChart3],
          ['Recall', metrics.recall, 'amber', Check],
          ['F1 score', metrics.f1, 'violet', Award],
        ].map(([label, value, tone, Icon]) => (
          <div className={`stat-card tone-${tone}`} key={label}>
            <div className="stat-top"><span className="stat-icon"><Icon size={19} /></span><span className="stat-label">{label}</span></div>
            <div className="stat-value">{pct(value, 2)}</div>
            <div className="stat-hint">Theft class · threshold {metrics.threshold}</div>
          </div>
        ))}
      </div>

      <div className="model-grid">
        <section className="panel">
          <div className="panel-head"><div><h3>Confusion matrix</h3><p>{metrics.test_samples.toLocaleString()} SMOTE-balanced test samples</p></div><ListChecks size={17} /></div>
          <div className="matrix-block large">
            <div className="matrix-grid">
              <div className="matrix-corner" />
              <div className="matrix-col">Predicted normal</div>
              <div className="matrix-col">Predicted theft</div>
              <div className="matrix-row">Actual normal</div>
              <div className="matrix-cell good">{matrix[0][0]}</div>
              <div className="matrix-cell soft">{matrix[0][1]}</div>
              <div className="matrix-row">Actual theft</div>
              <div className="matrix-cell soft">{matrix[1][0]}</div>
              <div className="matrix-cell strong">{matrix[1][1]}</div>
            </div>
          </div>
          <div className="matrix-foot">
            <div><span>True negatives</span><strong>{matrix[0][0]}</strong></div>
            <div><span>False positives</span><strong>{matrix[0][1]}</strong></div>
            <div><span>False negatives</span><strong>{matrix[1][0]}</strong></div>
            <div><span>True positives</span><strong>{matrix[1][1]}</strong></div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><div><h3>Feature importance</h3><p>Mean decrease in impurity across 300 trees</p></div><BarChart3 size={17} /></div>
          <div className="chart-medium tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={info.features} layout="vertical" margin={{ top: 4, right: 26, left: 10, bottom: 4 }}>
                <CartesianGrid stroke="rgba(255,255,255,.05)" horizontal={false} />
                <XAxis type="number" domain={[0, 0.5]} tick={{ fill: '#63708a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" width={115} tick={{ fill: '#aebbd2', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${(v * 100).toFixed(2)}%`} />
                <Bar dataKey="importance" radius={[0, 6, 6, 0]} barSize={18}>
                  {info.features.map((entry, index) => <Cell key={entry.feature} fill={index < 2 ? '#38e8b0' : '#4ea8ff'} fillOpacity={1 - index * 0.12} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="model-grid lower">
        <section className="panel">
          <div className="panel-head"><div><h3>Training pipeline</h3><p>From raw readings to deployed artifact</p></div><GitBranch size={17} /></div>
          <ol className="pipeline-list">
            {info.pipeline.map((step, index) => (
              <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>
            ))}
          </ol>
        </section>

        <section className="panel">
          <div className="panel-head"><div><h3>Configuration</h3><p>Hyperparameters of the saved estimator</p></div><Layers size={17} /></div>
          <div className="config-grid">
            {Object.entries(info.params).map(([key, value]) => (
              <div key={key}><span>{key.replace(/_/g, ' ')}</span><strong>{String(value)}</strong></div>
            ))}
          </div>
          <div className="dataset-note">
            <span><Layers size={16} /></span>
            <p>Trained on <strong>{metrics.resampled_samples.toLocaleString()}</strong> SMOTE-resampled rows ({metrics.train_samples.toLocaleString()} train / {metrics.test_samples.toLocaleString()} test).</p>
          </div>
        </section>
      </div>

      <section className="caveats panel">
        <div className="caveats-head"><AlertTriangle size={19} /><h3>Interpretation notes</h3></div>
        <ul>
          {info.notes.map((note) => <li key={note}><Info size={14} /> {note}</li>)}
        </ul>
      </section>
    </div>
  )
}
