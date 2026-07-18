import React from 'react';
import { CloudSun, ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { Greenhouse, Weather, SensorTelemetry, SensorStatus } from '../types';

interface ScenarioManagerProps {
  greenhouse: Greenhouse;
  weather: Weather;
  onChangeWeather: (condition: Weather['condition']) => void;
  onChangeSensorStatus: (sensorName: keyof SensorTelemetry, status: SensorStatus) => void;
  onInjectCrisis: (crisisType: 'drought' | 'freeze' | 'lockup') => void;
  onResetAnomalies: () => void;
}

export const ScenarioManager: React.FC<ScenarioManagerProps> = ({
  greenhouse,
  weather,
  onChangeWeather,
  onChangeSensorStatus,
  onInjectCrisis,
  onResetAnomalies,
}) => {
  const { sensorStatus } = greenhouse;

  const weatherOptions: Array<{ id: Weather['condition']; label: string; icon: string; desc: string }> = [
    { id: 'sunny', label: 'Sunny Day', icon: '☀️', desc: 'Solar radiation warms greenhouse temp, high light index.' },
    { id: 'rainy', label: 'Rainy Shower', icon: '🌧️', desc: 'Increases ambient humidity, harvests water into reservoir.' },
    { id: 'stormy', label: 'Severe Storm', icon: '⛈️', desc: 'Drastically lowers temperature, fills water tanks rapidly.' },
    { id: 'heatwave', label: 'Solar Heatwave', icon: '🔥', desc: 'Extreme external temperatures, accelerates soil evaporation.' },
  ];

  const sensorNames: Record<keyof SensorTelemetry, string> = {
    temperature: 'Temperature Probe',
    humidity: 'Humidity Sensor',
    soilMoisture: 'Soil Moisture Probe',
    co2: 'CO₂ Gas Sensor',
    light: 'Luminosity Photodiode',
    waterLevel: 'Liquid Level Float',
  };

  const statusOptions: Array<{ id: SensorStatus; label: string; badge: string }> = [
    { id: 'online', label: 'Nominal (Online)', badge: 'badge-success' },
    { id: 'offline', label: 'Offline (Dead)', badge: 'badge-danger' },
    { id: 'erratic', label: 'Erratic Noise', badge: 'badge-warning' },
    { id: 'frozen', label: 'Frozen (Static)', badge: 'badge-info' },
  ];

  return (
    <div style={styles.container}>
      {/* Title */}
      <div style={styles.intro}>
        <h2>🚨 System Scenario Manager & Fault Injector</h2>
        <p style={styles.subtitle}>
          Inject ambient weather anomalies or simulate sensor component failures to validate rule engine and safety loop behaviors.
        </p>
      </div>

      <div style={styles.mainGrid}>
        {/* Left Side: Fault Injection Panel */}
        <div className="glass-panel" style={styles.panel}>
          <div style={styles.sectionTitleGroup}>
            <ShieldAlert size={20} color="var(--color-temp)" />
            <h3>Hardware Sensor Fault Injection</h3>
          </div>
          <p style={styles.panelSubtitle}>
            Force a sensor into a failed state to observe how VerdantIQ isolates anomalies.
          </p>

          <div style={styles.sensorGrid}>
            {Object.entries(sensorNames).map(([key, name]) => {
              const currentStatus = sensorStatus[key as keyof SensorTelemetry];
              return (
                <div key={key} style={styles.sensorStatusRow}>
                  <div style={styles.sensorLabelGroup}>
                    <strong style={styles.sensorName}>{name}</strong>
                    <code style={styles.sensorCode}>{key}</code>
                  </div>
                  <div style={styles.statusButtons}>
                    {statusOptions.map((opt) => {
                      const isActive = currentStatus === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => onChangeSensorStatus(key as keyof SensorTelemetry, opt.id)}
                          style={{
                            ...styles.statusBtn,
                            ...(isActive ? statusBtnActiveStyles[opt.id] : {})
                          }}
                        >
                          {opt.label.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Weather & Crisis Simulation */}
        <div style={styles.rightColumn}>
          {/* Weather Settings */}
          <div className="glass-panel" style={styles.panel}>
            <div style={styles.sectionTitleGroup}>
              <CloudSun size={20} color="var(--color-water)" />
              <h3>External Ambient Weather</h3>
            </div>
            <p style={styles.panelSubtitle}>
              Alter external weather states. Greenhouse heating, moisture loss, and tank levels respond dynamically.
            </p>

            <div style={styles.weatherOptionsGrid}>
              {weatherOptions.map((opt) => {
                const isActive = weather.condition === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onChangeWeather(opt.id)}
                    style={{
                      ...styles.weatherBtn,
                      ...(isActive ? styles.weatherBtnActive : {})
                    }}
                  >
                    <span style={styles.weatherIcon}>{opt.icon}</span>
                    <div style={styles.weatherBtnMeta}>
                      <span style={styles.weatherLabel}>{opt.label}</span>
                      <span style={styles.weatherDesc}>{opt.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset Stress Scenarios */}
          <div className="glass-panel" style={styles.panel}>
            <div style={styles.sectionTitleGroup}>
              <AlertTriangle size={20} color="var(--color-red)" />
              <h3>Pre-Configured Failure Mode Scenarios</h3>
            </div>
            <p style={styles.panelSubtitle}>
              Run predefined stress test scripts to simulate common automated farming issues.
            </p>

            <div style={styles.presetsGrid}>
              <button 
                onClick={() => onInjectCrisis('drought')} 
                style={styles.presetBtn}
              >
                🔥 Simulated Drought Crisis
                <span style={styles.presetDesc}>
                  Inject Heatwave, trigger soil water depletion, and empty the water reservoir.
                </span>
              </button>

              <button 
                onClick={() => onInjectCrisis('freeze')} 
                style={styles.presetBtn}
              >
                ❄️ Sudden Frost & Sensor Freeze
                <span style={styles.presetDesc}>
                  Drop ambient temp to -5°C, freeze temperature sensors, and disable rules heater triggers.
                </span>
              </button>

              <button 
                onClick={() => onInjectCrisis('lockup')} 
                style={styles.presetBtn}
              >
                🔒 Locked-Dry Soil moisture Probe
                <span style={styles.presetDesc}>
                  Lock soil probe at 55% wetness to mask soil dehydration. Crop health drops silently.
                </span>
              </button>
            </div>

            <button 
              onClick={onResetAnomalies} 
              style={styles.resetBtn}
            >
              <ShieldCheck size={16} style={{ marginRight: '6px' }} />
              Reset All Sensors to Nominal State
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const statusBtnActiveStyles: Record<SensorStatus, React.CSSProperties> = {
  online: { background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-emerald)', borderColor: 'rgba(16, 185, 129, 0.4)', fontWeight: 'bold' },
  offline: { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-red)', borderColor: 'rgba(239, 68, 68, 0.4)', fontWeight: 'bold' },
  erratic: { background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-temp)', borderColor: 'rgba(249, 115, 22, 0.4)', fontWeight: 'bold' },
  frozen: { background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-water)', borderColor: 'rgba(14, 165, 233, 0.4)', fontWeight: 'bold' },
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
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  panelSubtitle: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  sensorGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '8px',
  },
  sensorStatusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--glass-border)',
    flexWrap: 'wrap',
    gap: '8px',
  },
  sensorLabelGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  sensorName: {
    fontSize: '0.82rem',
    color: '#fff',
  },
  sensorCode: {
    fontSize: '0.65rem',
    color: 'var(--text-dim)',
  },
  statusButtons: {
    display: 'flex',
    gap: '4px',
  },
  statusBtn: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-dim)',
    fontSize: '0.7rem',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  weatherOptionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginTop: '8px',
  },
  weatherBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-muted)',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  weatherBtnActive: {
    background: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
    color: '#fff',
  },
  weatherIcon: {
    fontSize: '1.5rem',
  },
  weatherBtnMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  weatherLabel: {
    fontSize: '0.82rem',
    fontWeight: '600',
  },
  weatherDesc: {
    fontSize: '0.65rem',
    color: 'var(--text-dim)',
    marginTop: '2px',
    lineHeight: '1.25',
  },
  presetsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '8px',
  },
  presetBtn: {
    background: 'rgba(239, 68, 68, 0.02)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    color: '#fff',
    fontSize: '0.82rem',
    fontWeight: '600',
    padding: '12px 16px',
    borderRadius: '10px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  presetDesc: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    fontWeight: '400',
    lineHeight: '1.3',
  },
  resetBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: 'var(--color-emerald)',
    fontSize: '0.8rem',
    padding: '12px',
    borderRadius: '10px',
    fontWeight: '600',
    marginTop: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
