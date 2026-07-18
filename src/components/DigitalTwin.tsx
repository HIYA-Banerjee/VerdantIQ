import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Sun, 
  Database,
  AlertTriangle,
  Gauge
} from 'lucide-react';
import type { Greenhouse } from '../types';
import { CROP_PROFILES } from '../types';

interface DigitalTwinProps {
  greenhouse: Greenhouse;
}

export const DigitalTwin: React.FC<DigitalTwinProps> = ({ greenhouse }) => {
  const { sensors, actuators, sensorStatus, crop, healthScore, growthStage, growthProgress } = greenhouse;
  const thresholds = CROP_PROFILES[crop];

  // Helper to format values
  const formatVal = (val: number, sensorName: keyof typeof sensors) => {
    if (sensorStatus[sensorName] === 'offline') return 'OFFLINE';
    if (sensorName === 'co2' || sensorName === 'light') return val.toFixed(0);
    return val.toFixed(1);
  };

  // Helper to check if a sensor value is in the optimal range
  const getStatusClass = (sensorName: keyof typeof sensors) => {
    if (sensorStatus[sensorName] !== 'online') return 'badge-danger';
    
    const val = sensors[sensorName];
    switch (sensorName) {
      case 'temperature':
        if (val < thresholds.tempMin || val > thresholds.tempMax) return 'badge-warning';
        return 'badge-success';
      case 'humidity':
        if (val < thresholds.humidMin || val > thresholds.humidMax) return 'badge-warning';
        return 'badge-success';
      case 'soilMoisture':
        if (val < thresholds.soilMin || val > thresholds.soilMax) return 'badge-warning';
        return 'badge-success';
      case 'co2':
        if (val < thresholds.co2Min) return 'badge-warning';
        return 'badge-success';
      case 'light':
        if (val < thresholds.lightMin) return 'badge-warning';
        return 'badge-success';
      case 'waterLevel':
        if (val < 20) return 'badge-danger';
        if (val < 50) return 'badge-warning';
        return 'badge-success';
      default:
        return 'badge-success';
    }
  };

  const getStatusText = (sensorName: keyof typeof sensors) => {
    if (sensorStatus[sensorName] === 'offline') return 'offline';
    if (sensorStatus[sensorName] === 'erratic') return 'erratic';
    if (sensorStatus[sensorName] === 'frozen') return 'frozen';
    
    const badge = getStatusClass(sensorName);
    if (badge === 'badge-warning') return 'stress';
    if (badge === 'badge-danger') return 'critical';
    return 'optimal';
  };

  return (
    <div style={styles.container}>
      {/* Header Cards Grid */}
      <div className="dashboard-grid">
        {/* Temperature Card */}
        <div className="glass-panel" style={{ ...styles.card, borderTop: '4px solid var(--color-temp)' }}>
          <div style={styles.cardHeader}>
            <Thermometer color="var(--color-temp)" size={20} />
            <span style={styles.cardTitle}>Temperature</span>
            <span className={`badge ${getStatusClass('temperature')}`}>{getStatusText('temperature')}</span>
          </div>
          <div style={styles.cardValue}>{formatVal(sensors.temperature, 'temperature')} <span style={styles.unit}>°C</span></div>
          <div style={styles.cardRange}>Range: {thresholds.tempMin}-{thresholds.tempMax}°C</div>
        </div>

        {/* Humidity Card */}
        <div className="glass-panel" style={{ ...styles.card, borderTop: '4px solid var(--color-humidity)' }}>
          <div style={styles.cardHeader}>
            <Droplets color="var(--color-humidity)" size={20} />
            <span style={styles.cardTitle}>Air Humidity</span>
            <span className={`badge ${getStatusClass('humidity')}`}>{getStatusText('humidity')}</span>
          </div>
          <div style={styles.cardValue}>{formatVal(sensors.humidity, 'humidity')} <span style={styles.unit}>%</span></div>
          <div style={styles.cardRange}>Range: {thresholds.humidMin}-{thresholds.humidMax}%</div>
        </div>

        {/* Soil Moisture Card */}
        <div className="glass-panel" style={{ ...styles.card, borderTop: '4px solid var(--color-soil)' }}>
          <div style={styles.cardHeader}>
            <Database color="var(--color-soil)" size={20} />
            <span style={styles.cardTitle}>Soil Moisture</span>
            <span className={`badge ${getStatusClass('soilMoisture')}`}>{getStatusText('soilMoisture')}</span>
          </div>
          <div style={styles.cardValue}>{formatVal(sensors.soilMoisture, 'soilMoisture')} <span style={styles.unit}>%</span></div>
          <div style={styles.cardRange}>Range: {thresholds.soilMin}-{thresholds.soilMax}%</div>
        </div>

        {/* CO2 Card */}
        <div className="glass-panel" style={{ ...styles.card, borderTop: '4px solid var(--color-co2)' }}>
          <div style={styles.cardHeader}>
            <Gauge color="var(--color-co2)" size={20} />
            <span style={styles.cardTitle}>CO₂ Concentration</span>
            <span className={`badge ${getStatusClass('co2')}`}>{getStatusText('co2')}</span>
          </div>
          <div style={styles.cardValue}>{formatVal(sensors.co2, 'co2')} <span style={styles.unit}>ppm</span></div>
          <div style={styles.cardRange}>Optimal: &gt;{thresholds.co2Min} ppm</div>
        </div>

        {/* Light Card */}
        <div className="glass-panel" style={{ ...styles.card, borderTop: '4px solid var(--color-light)' }}>
          <div style={styles.cardHeader}>
            <Sun color="var(--color-light)" size={20} />
            <span style={styles.cardTitle}>Light Intensity</span>
            <span className={`badge ${getStatusClass('light')}`}>{getStatusText('light')}</span>
          </div>
          <div style={styles.cardValue}>{formatVal(sensors.light, 'light')} <span style={styles.unit}>lux</span></div>
          <div style={styles.cardRange}>Optimal: &gt;{thresholds.lightMin} lux</div>
        </div>

        {/* Water Reservoir Card */}
        <div className="glass-panel" style={{ ...styles.card, borderTop: '4px solid var(--color-water)' }}>
          <div style={styles.cardHeader}>
            <Droplets color="var(--color-water)" size={20} />
            <span style={styles.cardTitle}>Reservoir Tank</span>
            <span className={`badge ${getStatusClass('waterLevel')}`}>{getStatusText('waterLevel')}</span>
          </div>
          <div style={styles.cardValue}>{formatVal(sensors.waterLevel, 'waterLevel')} <span style={styles.unit}>%</span></div>
          <div style={styles.cardRange}>Status: {sensors.waterLevel < 20 ? 'REFILL NOW' : 'NORMAL'}</div>
        </div>
      </div>

      {/* Interactive Digital Twin Visualization */}
      <div className="glass-panel" style={styles.twinPanel}>
        <div style={styles.twinHeader}>
          <h3>🛰️ Real-Time Digital Twin Virtualization</h3>
          <div style={styles.twinStats}>
            <span style={styles.twinStatItem}>🌱 Growth Stage: <strong>{growthStage}</strong> ({growthProgress.toFixed(1)}%)</span>
            <span style={styles.twinStatItem}>❤️ Crop Health: <strong style={{ color: healthScore > 75 ? 'var(--color-emerald)' : healthScore > 40 ? 'var(--color-temp)' : 'var(--color-red)' }}>{healthScore}%</strong></span>
          </div>
        </div>

        <div style={styles.twinVisualizer}>
          {/* SVG Smart Greenhouse Schematic */}
          <svg viewBox="0 0 800 450" style={styles.svg}>
            {/* Defs for gradients & glowing effects */}
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#080c16" />
                <stop offset="100%" stopColor="#0c1220" />
              </linearGradient>
              <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2e1a0c" />
                <stop offset="100%" stopColor="#1a0f07" />
              </linearGradient>
              <linearGradient id="heaterGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="lightBeam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#eab308" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#eab308" stopOpacity="0.0" />
              </linearGradient>
              <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Sky Background */}
            <rect width="800" height="450" rx="12" fill="url(#skyGrad)" />

            {/* Greenhouse Ground / Soil Bed */}
            <rect x="50" y="340" width="700" height="80" rx="8" fill="url(#soilGrad)" stroke="rgba(255,255,255,0.05)" />

            {/* Greenhouse Glass Shell (Translucent) */}
            <path d="M 80 340 L 80 180 L 400 60 L 720 180 L 720 340 Z" fill="rgba(255, 255, 255, 0.02)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />
            <line x1="240" y1="130" x2="240" y2="340" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
            <line x1="400" y1="60" x2="400" y2="340" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
            <line x1="560" y1="130" x2="560" y2="340" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />

            {/* --- ACTUATORS --- */}

            {/* 1. Heater (Orange coils on the left) */}
            <g transform="translate(100, 270)">
              <rect x="0" y="0" width="40" height="60" rx="4" fill="#1e293b" stroke="rgba(255,255,255,0.1)" />
              {/* Heater coils */}
              <path d="M 10 15 Q 20 10 30 15 Q 20 20 10 25 Q 20 30 30 35 Q 20 40 10 45 Q 20 50 30 55" 
                fill="none" 
                stroke={actuators.heater ? '#f97316' : '#475569'} 
                strokeWidth="3" 
                className={actuators.heater ? 'animate-pulse-glow' : ''} 
              />
              {/* Heat glow */}
              {actuators.heater && (
                <rect x="-10" y="-80" width="60" height="80" fill="url(#heaterGlow)" pointerEvents="none" />
              )}
              <text x="20" y="-5" fill="var(--text-muted)" fontSize="8" textAnchor="middle">HEATER</text>
            </g>

            {/* 2. Humidifier (Mist maker on the right) */}
            <g transform="translate(640, 290)">
              <rect x="0" y="0" width="45" height="40" rx="4" fill="#1e293b" />
              <rect x="15" y="-10" width="15" height="10" fill="#334155" />
              {/* Steam waves */}
              {actuators.humidifier && (
                <g>
                  <path d="M 22 -15 Q 12 -25 22 -35 T 22 -55" fill="none" stroke="var(--color-humidity)" strokeWidth="2.5" className="animate-steam" />
                  <path d="M 18 -12 Q 28 -22 18 -32 T 18 -52" fill="none" stroke="var(--color-humidity)" strokeWidth="1.5" className="animate-steam" style={{ animationDelay: '0.8s' }} />
                </g>
              )}
              <text x="22.5" y="24" fill="var(--text-muted)" fontSize="8" textAnchor="middle">HUMIDIFIER</text>
            </g>

            {/* 3. Grow Lights (At the top truss) */}
            <g transform="translate(250, 100)">
              <rect x="0" y="0" width="100" height="12" rx="3" fill="#1e293b" />
              <rect x="20" y="12" width="10" height="6" fill={actuators.growLights ? '#facc15' : '#475569'} />
              <rect x="50" y="12" width="10" height="6" fill={actuators.growLights ? '#facc15' : '#475569'} />
              <rect x="80" y="12" width="10" height="6" fill={actuators.growLights ? '#facc15' : '#475569'} />
              {/* Beams */}
              {actuators.growLights && (
                <polygon points="0,18 100,18 130,230 -30,230" fill="url(#lightBeam)" pointerEvents="none" />
              )}
            </g>
            <g transform="translate(450, 100)">
              <rect x="0" y="0" width="100" height="12" rx="3" fill="#1e293b" />
              <rect x="20" y="12" width="10" height="6" fill={actuators.growLights ? '#facc15' : '#475569'} />
              <rect x="50" y="12" width="10" height="6" fill={actuators.growLights ? '#facc15' : '#475569'} />
              <rect x="80" y="12" width="10" height="6" fill={actuators.growLights ? '#facc15' : '#475569'} />
              {/* Beams */}
              {actuators.growLights && (
                <polygon points="0,18 100,18 130,230 -30,230" fill="url(#lightBeam)" pointerEvents="none" />
              )}
            </g>

            {/* 4. Ventilation Fan (Top apex) */}
            <g transform="translate(400, 100)">
              {/* Fan housing */}
              <circle cx="0" cy="0" r="28" fill="#1e293b" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
              {/* Fan blades */}
              <g className={actuators.ventilator ? 'animate-spin-fast' : ''}>
                <path d="M 0 0 L -8 -22 L 8 -22 Z" fill="#64748b" />
                <path d="M 0 0 L -8 22 L 8 22 Z" fill="#64748b" />
                <path d="M 0 0 L -22 -8 L -22 8 Z" fill="#475569" />
                <path d="M 0 0 L 22 -8 L 22 8 Z" fill="#475569" />
                <circle cx="0" cy="0" r="6" fill="#f1f5f9" />
              </g>
              <text x="0" y="42" fill="var(--text-muted)" fontSize="8" textAnchor="middle">VENTILATION</text>
            </g>

            {/* 5. Irrigation Line (Pipes overhead raining on soil) */}
            <path d="M 120,335 L 680,335" fill="none" stroke="#1e293b" strokeWidth="6" />
            <path d="M 120,335 L 680,335" fill="none" stroke="#0284c7" strokeWidth="2" className={actuators.irrigation ? 'animate-flow' : ''} />
            
            {actuators.irrigation && (
              <g>
                {/* Raining droplets onto plant beds */}
                {[160, 220, 280, 340, 400, 460, 520, 580, 640].map((x, i) => (
                  <g key={i} transform={`translate(${x}, 337)`}>
                    <line x1="0" y1="0" x2="0" y2="3" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="3 3" className="animate-flow" />
                    {/* Water drop ripple animations at soil level */}
                    <circle cx="0" cy="5" r="4" fill="none" stroke="#0ea5e9" strokeWidth="1" className="animate-ripple" style={{ animationDelay: `${i * 0.15}s` }} />
                  </g>
                ))}
              </g>
            )}

            {/* --- DIGITAL TWIN PLANTS --- */}
            {[180, 290, 400, 510, 620].map((x, i) => {
              return (
                <g key={i} transform={`translate(${x}, 340)`}>
                  {/* Sprout & Leaves dynamically switching based on growth stage */}
                  {growthStage === 'Seedling' && (
                    <g>
                      <path d="M 0 0 C 0 -10 -5 -15 -10 -15" fill="none" stroke="#22c55e" strokeWidth="2" />
                      <path d="M 0 0 C 0 -10 5 -15 10 -15" fill="none" stroke="#22c55e" strokeWidth="2" />
                      <ellipse cx="-10" cy="-15" rx="4" ry="2" fill="#22c55e" transform="rotate(-15 -10 -15)" />
                      <ellipse cx="10" cy="-15" rx="4" ry="2" fill="#22c55e" transform="rotate(15 10 -15)" />
                    </g>
                  )}
                  {growthStage === 'Vegetative' && (
                    <g>
                      {/* Stem */}
                      <path d="M 0 0 Q -5 -20 0 -40" fill="none" stroke="#15803d" strokeWidth="3" />
                      {/* Left Leaf */}
                      <path d="M -3 -15 C -20 -25 -25 -10 -3 -15" fill="#166534" />
                      <path d="M -3 -15 Q -12 -18 -20 -16" fill="none" stroke="#22c55e" strokeWidth="1" />
                      {/* Right Leaf */}
                      <path d="M 2 -25 C 20 -35 25 -20 2 -25" fill="#166534" />
                      {/* Top Sprout */}
                      <ellipse cx="0" cy="-40" rx="6" ry="12" fill="#22c55e" />
                    </g>
                  )}
                  {growthStage === 'Flowering' && (
                    <g>
                      {/* Stem */}
                      <path d="M 0 0 Q -5 -25 0 -50" fill="none" stroke="#15803d" strokeWidth="4" />
                      <path d="M -15 -20 Q 5 -35 20 -40" fill="none" stroke="#15803d" strokeWidth="3" />
                      {/* Leaves */}
                      <ellipse cx="-15" cy="-20" rx="12" ry="6" fill="#166534" transform="rotate(-20 -15 -20)" />
                      <ellipse cx="15" cy="-28" rx="14" ry="7" fill="#166534" transform="rotate(15 15 -28)" />
                      {/* Flower buds */}
                      <circle cx="0" cy="-50" r="5" fill="#ef4444" className="animate-pulse-glow" />
                      <circle cx="20" cy="-40" r="4" fill="#ef4444" />
                    </g>
                  )}
                  {growthStage === 'Mature' && (
                    <g>
                      {/* Stem & Bushy branches */}
                      <path d="M 0 0 Q -8 -30 0 -60" fill="none" stroke="#14532d" strokeWidth="5" />
                      <path d="M -5 -20 C -25 -30 -30 -15 -5 -20" fill="none" stroke="#15803d" strokeWidth="4" />
                      <path d="M 5 -35 C 30 -45 35 -25 5 -35" fill="none" stroke="#15803d" strokeWidth="4" />
                      {/* Dense Leaves */}
                      <circle cx="-15" cy="-28" r="14" fill="#166534" opacity="0.9" />
                      <circle cx="18" cy="-40" r="16" fill="#166534" opacity="0.9" />
                      <circle cx="-5" cy="-50" r="18" fill="#15803d" opacity="0.95" />
                      {/* Ripe Fruits (Tomatoes / Strawberries) */}
                      {crop === 'Tomato' && (
                        <g>
                          <circle cx="-12" cy="-20" r="7" fill="#ef4444" />
                          <circle cx="-10" cy="-18" r="2" fill="#fff" opacity="0.6" />
                          <circle cx="22" cy="-30" r="7" fill="#ef4444" />
                          <circle cx="5" cy="-45" r="8" fill="#ef4444" />
                        </g>
                      )}
                      {crop === 'Strawberry' && (
                        <g>
                          {/* Heart/berry shaped */}
                          <path d="M -12,-20 A 4,4 0 0,0 -16,-16 Q -16,-10 -12,-6 Q -8,-10 -8,-16 A 4,4 0 0,0 -12,-20 Z" fill="#e11d48" />
                          <path d="M 12,-32 A 4,4 0 0,0 8,-28 Q 8,-22 12,-18 Q 16,-22 16,-28 A 4,4 0 0,0 12,-32 Z" fill="#e11d48" />
                        </g>
                      )}
                      {crop === 'Lettuce' && (
                        <g>
                          {/* No fruit, just massive green curly leaves */}
                          <circle cx="10" cy="-48" r="12" fill="#22c55e" opacity="0.9" />
                          <circle cx="-18" cy="-44" r="10" fill="#4ade80" opacity="0.95" />
                        </g>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* --- PHYSICAL SENSOR INTERACTIVE NODES --- */}
            {/* 1. Temp / Hum Node (Wall mount) */}
            <g transform="translate(110, 160)" style={styles.sensorNode}>
              <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="var(--color-temp)" strokeWidth="2" filter="url(#neonBlur)" className={sensorStatus.temperature !== 'online' ? 'animate-pulse-glow' : ''} />
              <Thermometer size={12} color="var(--color-temp)" x="-6" y="-6" />
              <title>Wall Temperature Sensor: {formatVal(sensors.temperature, 'temperature')}°C</title>
            </g>

            {/* 2. Light Node (Ceiling mount) */}
            <g transform="translate(400, 75)" style={styles.sensorNode}>
              <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="var(--color-light)" strokeWidth="2" filter="url(#neonBlur)" />
              <Sun size={12} color="var(--color-light)" x="-6" y="-6" />
              <title>Roof Light Intensity Sensor: {formatVal(sensors.light, 'light')} lux</title>
            </g>

            {/* 3. Soil Moisture Node (Sub-soil probe) */}
            <g transform="translate(300, 360)" style={styles.sensorNode}>
              <line x1="0" y1="-20" x2="0" y2="10" stroke="var(--color-soil)" strokeWidth="2" />
              <circle cx="0" cy="-20" r="12" fill="#0f172a" stroke="var(--color-soil)" strokeWidth="2" filter="url(#neonBlur)" />
              <Database size={10} color="var(--color-soil)" x="-5" y="-5" />
              <title>Ground Soil Moisture Probe: {formatVal(sensors.soilMoisture, 'soilMoisture')}%</title>
            </g>

            {/* 4. CO2 Node (Center suspended node) */}
            <g transform="translate(560, 200)" style={styles.sensorNode}>
              <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="var(--color-co2)" strokeWidth="2" filter="url(#neonBlur)" />
              <Gauge size={12} color="var(--color-co2)" x="-6" y="-6" />
              <title>CO2 Air Analyzer: {formatVal(sensors.co2, 'co2')} ppm</title>
            </g>

            {/* Simulated Live Alert Banner overlays if active */}
            {greenhouse.alerts.some(a => a.active) && (
              <g transform="translate(240, 20)">
                <rect x="0" y="0" width="320" height="30" rx="6" fill="rgba(239, 68, 68, 0.95)" />
                <AlertTriangle size={14} color="#fff" x="10" y="8" />
                <text x="32" y="19" fill="#fff" fontSize="10" fontWeight="600" fontFamily="var(--font-sans)">
                  WARNING: Active sensor/hardware anomalies detected!
                </text>
              </g>
            )}
          </svg>
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
  },
  card: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  cardTitle: {
    marginRight: 'auto',
    marginLeft: '8px',
  },
  cardValue: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '-0.02em',
  },
  unit: {
    fontSize: '1rem',
    color: 'var(--text-muted)',
    fontWeight: '400',
  },
  cardRange: {
    fontSize: '0.7rem',
    color: 'var(--text-dim)',
    fontWeight: '500',
  },
  twinPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flexGrow: 1,
  },
  twinHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  twinStats: {
    display: 'flex',
    gap: '16px',
    fontSize: '0.85rem',
  },
  twinStatItem: {
    background: 'rgba(255, 255, 255, 0.04)',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid var(--glass-border)',
  },
  twinVisualizer: {
    position: 'relative',
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid var(--glass-border)',
  },
  svg: {
    display: 'block',
    width: '100%',
    height: 'auto',
  },
  sensorNode: {
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
