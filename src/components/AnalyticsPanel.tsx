import React, { useState } from 'react';
import { TrendingUp, ShieldAlert, Award } from 'lucide-react';
import type { Greenhouse, HistoricalTelemetry } from '../types';

interface AnalyticsPanelProps {
  greenhouse: Greenhouse;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ greenhouse }) => {
  const { historicalData, yesterdayData, alerts } = greenhouse;
  const [selectedMetric, setSelectedMetric] = useState<keyof Omit<HistoricalTelemetry, 'timestamp'>>('temperature');

  const metricMeta = {
    temperature: { label: 'Temperature', color: 'var(--color-temp)', unit: '°C' },
    humidity: { label: 'Air Humidity', color: 'var(--color-humidity)', unit: '%' },
    soilMoisture: { label: 'Soil Moisture', color: 'var(--color-soil)', unit: '%' },
    co2: { label: 'CO₂ Levels', color: 'var(--color-co2)', unit: 'ppm' },
    light: { label: 'Light Intensity', color: 'var(--color-light)', unit: 'lux' },
    waterLevel: { label: 'Reservoir Level', color: 'var(--color-water)', unit: '%' },
  };

  // 1. Calculate Environmental Quality Score based on crop health and alert frequency
  const calculateQualityScore = () => {
    let score = greenhouse.healthScore;
    const activeAlertCount = alerts.filter(a => a.active).length;
    score -= activeAlertCount * 5; // subtract points for active hardware failures
    return Math.max(0, parseFloat(score.toFixed(0)));
  };

  const score = calculateQualityScore();

  // 2. Custom SVG Chart Drawing Logic
  // We map the array of data to fit an SVG viewBox of 600 x 220
  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 30, left: 50 };

  const drawChartPaths = (data: HistoricalTelemetry[]) => {
    if (data.length < 2) return { path: '', points: [] };

    // Find min and max for scaling
    const values = data.map(d => d[selectedMetric]);
    let min = Math.min(...values);
    let max = Math.max(...values);

    // Padding values slightly to prevent touching edges
    const range = max - min;
    min = min - (range * 0.1 || 2);
    max = max + (range * 0.1 || 2);

    const points = data.map((d, index) => {
      const x = padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
      const y = height - padding.bottom - ((d[selectedMetric] - min) / (max - min)) * (height - padding.top - padding.bottom);
      return { x, y, val: d[selectedMetric], time: d.timestamp };
    });

    const path = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return { path, points, min, max };
  };

  const liveChart = drawChartPaths(historicalData);
  const yesterdayChart = drawChartPaths(yesterdayData.slice(0, historicalData.length));

  return (
    <div style={styles.container}>
      {/* Intro */}
      <div style={styles.intro}>
        <h2>📈 Crop Analytics & Historical Trend Comparison</h2>
        <p style={styles.subtitle}>
          Compare real-time crop telemetry with historical cycles. Analytics help identify microclimate anomalies.
        </p>
      </div>

      {/* Overview Cards */}
      <div style={styles.topRow}>
        {/* Score Card */}
        <div className="glass-panel" style={styles.scorePanel}>
          <div style={styles.scoreHeader}>
            <Award size={24} color="var(--color-emerald)" />
            <h3>Environmental Quality Score</h3>
          </div>
          <div style={styles.scoreBody}>
            <div style={styles.scoreDialContainer}>
              {/* Radial Score Gauge */}
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="none" 
                  stroke={score > 80 ? 'var(--color-emerald)' : score > 50 ? 'var(--color-temp)' : 'var(--color-red)'}
                  strokeWidth="8" 
                  strokeDasharray="251"
                  strokeDashoffset={251 - (251 * score) / 100}
                  transform="rotate(-90 50 50)"
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
                <text x="50" y="55" fill="#fff" fontSize="18" fontWeight="bold" textAnchor="middle">{score}%</text>
              </svg>
            </div>
            <div style={styles.scoreMeta}>
              <div style={styles.scoreRating}>
                Rating: <strong style={{ color: score > 80 ? 'var(--color-emerald)' : score > 50 ? 'var(--color-temp)' : 'var(--color-red)' }}>
                  {score > 80 ? 'EXCELLENT' : score > 50 ? 'WARNING (STRESSED)' : 'CRITICAL'}
                </strong>
              </div>
              <p style={styles.scoreDesc}>
                Synthesized live from crop growth rate, ambient health, and sensor faults.
              </p>
            </div>
          </div>
        </div>

        {/* Metric Select */}
        <div className="glass-panel" style={styles.metricSelectPanel}>
          <h3>Select Analytics Metric</h3>
          <div style={styles.metricGrid}>
            {Object.entries(metricMeta).map(([key, meta]) => {
              const isSelected = selectedMetric === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedMetric(key as any)}
                  style={{
                    ...styles.metricBtn,
                    ...(isSelected ? { background: meta.color, color: '#000', fontWeight: 'bold' } : {})
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={styles.chartGrid}>
        {/* Main Chart Panel */}
        <div className="glass-panel" style={styles.chartPanel}>
          <div style={styles.chartHeader}>
            <div style={styles.chartTitleGroup}>
              <TrendingUp size={20} color={metricMeta[selectedMetric].color} />
              <h4>{metricMeta[selectedMetric].label} Overlays ({metricMeta[selectedMetric].unit})</h4>
            </div>
            <div style={styles.legends}>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendLine, backgroundColor: metricMeta[selectedMetric].color }} />
                <span>Today (Live Telemetry)</span>
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendLine, border: `1.5px dashed var(--text-dim)`, backgroundColor: 'transparent' }} />
                <span style={{ color: 'var(--text-muted)' }}>Yesterday (Benchmark)</span>
              </div>
            </div>
          </div>

          {/* SVG Graph rendering */}
          <div style={styles.svgWrapper}>
            <svg viewBox={`0 0 ${width} ${height}`} style={styles.chartSvg}>
              {/* Grid Lines */}
              <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="rgba(255,255,255,0.05)" />
              <line x1={padding.left} y1={height / 2} x2={width - padding.right} y2={height / 2} stroke="rgba(255,255,255,0.05)" />
              <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="rgba(255,255,255,0.1)" />

              {/* Y Axis Labels */}
              {liveChart.points.length > 0 && (
                <g fontSize="9" fill="var(--text-dim)" textAnchor="end">
                  <text x={padding.left - 10} y={padding.top + 4}>{liveChart.max?.toFixed(1)}</text>
                  <text x={padding.left - 10} y={height / 2 + 4}>{((liveChart.max! + liveChart.min!) / 2).toFixed(1)}</text>
                  <text x={padding.left - 10} y={height - padding.bottom + 4}>{liveChart.min?.toFixed(1)}</text>
                </g>
              )}

              {/* Yesterday Line Path */}
              {yesterdayChart.path && (
                <path 
                  d={yesterdayChart.path}
                  fill="none"
                  stroke="var(--text-dim)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.4"
                />
              )}

              {/* Today Live Path */}
              {liveChart.path && (
                <path 
                  d={liveChart.path}
                  fill="none"
                  stroke={metricMeta[selectedMetric].color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.5))"
                />
              )}

              {/* Today Data Dots (only render if list is small for readability) */}
              {liveChart.points.map((p, i) => (
                <circle 
                  key={i} 
                  cx={p.x} 
                  cy={p.y} 
                  r="3.5" 
                  fill="#000" 
                  stroke={metricMeta[selectedMetric].color} 
                  strokeWidth="2"
                />
              ))}

              {/* X Axis Time Labels */}
              <g fontSize="8" fill="var(--text-dim)" textAnchor="middle">
                {liveChart.points.filter((_, idx) => idx % 6 === 0).map((p, i) => (
                  <text key={i} x={p.x} y={height - 10}>{p.time.split(' ')[0]}</text>
                ))}
              </g>
            </svg>
          </div>
        </div>

        {/* Anomaly Alerts Tracker */}
        <div className="glass-panel" style={styles.anomalyPanel}>
          <div style={styles.anomalyHeader}>
            <ShieldAlert size={20} color="var(--color-red)" />
            <h4>Security & Failure Log</h4>
          </div>
          <p style={styles.anomalySubtitle}>Hardware sensor reports & automated interlocks.</p>

          <div style={styles.anomalyList}>
            {alerts.length === 0 ? (
              <div style={styles.emptyAnomaly}>
                No hardware failure modes or climate anomalies detected. Systems are nominal.
              </div>
            ) : (
              [...alerts].reverse().map((al) => (
                <div 
                  key={al.id} 
                  style={{
                    ...styles.anomalyItem,
                    borderColor: al.severity === 'danger' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(249, 115, 22, 0.25)',
                    background: al.severity === 'danger' ? 'rgba(239, 68, 68, 0.03)' : 'rgba(249, 115, 22, 0.03)'
                  }}
                >
                  <div style={styles.anomalyMeta}>
                    <span style={styles.anomalyTime}>[{al.timestamp}]</span>
                    <span 
                      className={`badge ${al.severity === 'danger' ? 'badge-danger' : 'badge-warning'}`}
                      style={{ fontSize: '0.6rem', padding: '2px 6px' }}
                    >
                      {al.severity.toUpperCase()}
                    </span>
                  </div>
                  <div style={styles.anomalyMessage}>{al.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '24px',
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
  },
  topRow: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px',
  },
  scorePanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  scoreHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  scoreBody: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  scoreDialContainer: {
    flexShrink: 0,
  },
  scoreMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  scoreRating: {
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  scoreDesc: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  metricSelectPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    flexGrow: 1,
  },
  metricBtn: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)',
    gap: '24px',
  },
  chartPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  chartTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  legends: {
    display: 'flex',
    gap: '16px',
    fontSize: '0.75rem',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendLine: {
    width: '18px',
    height: '3px',
    borderRadius: '2px',
    display: 'inline-block',
  },
  svgWrapper: {
    width: '100%',
    background: 'rgba(4, 7, 13, 0.45)',
    border: '1px solid var(--glass-border)',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  chartSvg: {
    display: 'block',
    width: '100%',
    height: 'auto',
  },
  anomalyPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '300px',
    overflow: 'hidden',
  },
  anomalyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  anomalySubtitle: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
  },
  anomalyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflowY: 'auto',
    flexGrow: 1,
    paddingRight: '4px',
  },
  emptyAnomaly: {
    color: 'var(--text-dim)',
    fontSize: '0.8rem',
    textAlign: 'center',
    padding: '40px 20px',
    border: '1.5px dashed var(--glass-border)',
    borderRadius: '8px',
  },
  anomalyItem: {
    border: '1px solid transparent',
    borderRadius: '8px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  anomalyMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  anomalyTime: {
    fontSize: '0.7rem',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
  },
  anomalyMessage: {
    fontSize: '0.78rem',
    color: 'var(--text-main)',
    lineHeight: '1.45',
  },
};
