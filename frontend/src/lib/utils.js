export const RISK_STYLES = {
  critical: { label: 'Critical', color: '#ff5d6c', bg: 'rgba(255,93,108,.14)' },
  high: { label: 'High', color: '#ff9f45', bg: 'rgba(255,159,69,.14)' },
  elevated: { label: 'Elevated', color: '#f2cf5b', bg: 'rgba(242,207,91,.14)' },
  normal: { label: 'Normal', color: '#38e8b0', bg: 'rgba(56,232,176,.14)' },
}

export function riskStyle(level) {
  return RISK_STYLES[level] || RISK_STYLES.normal
}

export function fmt(value, digits = 4) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return Number(value).toFixed(digits)
}

export function fmtDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function pct(value, digits = 1) {
  return `${fmt((value || 0) * 100, digits)}%`
}

export function downloadCsv(rows, filename) {
  if (!rows?.length) return
  const headers = Object.keys(rows[0])
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function templateCsv() {
  return [
    'Timestamp,Electricity_Consumed,Temperature,Humidity,Wind_Speed',
    '2024-01-01 00:00:00,0.4577,0.4695,0.3963,0.4454',
    '2024-01-01 00:30:00,0.3519,0.4655,0.4511,0.4587',
  ].join('\n')
}
