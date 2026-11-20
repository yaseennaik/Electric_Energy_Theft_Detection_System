// Representative series used on the public landing page before authentication.
const base = [
  0.46, 0.41, 0.52, 0.49, 0.44, 0.55, 0.61, 0.58, 0.5, 0.47, 0.39, 0.36,
  0.42, 0.48, 0.53, 0.5, 0.45, 0.4, 0.37, 0.44, 0.51, 0.56, 0.62, 0.57,
  0.49, 0.43, 0.38, 0.33, 0.29, 0.24, 0.19, 0.41, 0.47, 0.52, 0.48, 0.44,
]

const anomalyIndexes = new Set([8, 21, 29, 30, 31])

export const heroSeries = base.map((value, index) => ({
  time: `${String(index).padStart(2, '0')}:00`,
  consumption: value,
  average: index === 0 ? value : (base[index - 1] + value) / 2,
  label: anomalyIndexes.has(index) ? 1 : 0,
}))

export const heroAnomalies = heroSeries.filter((point) => point.label === 1)

export const fallbackMetrics = {
  accuracy: 0.9689,
  roc_auc: 0.9967,
  precision: 0.9543,
  recall: 0.9839,
  f1: 0.9689,
  confusion_matrix: [[923, 44], [15, 918]],
}

export const fallbackImportance = [
  { label: 'Electricity consumed', importance: 0.4375 },
  { label: '12-reading average', importance: 0.3971 },
  { label: 'Temperature', importance: 0.0606 },
  { label: 'Wind speed', importance: 0.0571 },
  { label: 'Humidity', importance: 0.0478 },
]
