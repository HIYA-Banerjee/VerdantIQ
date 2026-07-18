import React from 'react';
import { 
  Flame, 
  Wind, 
  Droplets, 
  Lightbulb, 
  AlertTriangle,
  Square
} from 'lucide-react';
import type { Greenhouse, ActuatorState } from '../types';

interface ControlCenterProps {
  greenhouse: Greenhouse;
  onToggleActuator: (actuator: keyof ActuatorState, state: boolean) => void;
  onEmergencyStop: () => void;
}

export const ControlCenter: React.FC<ControlCenterProps> = ({
  greenhouse,
  onToggleActuator,
  onEmergencyStop,
}) => {
  const { name, actuators } = greenhouse;

  const actuatorList = [
    {
      id: 'heater' as keyof ActuatorState,
      name: 'Climate Heater',
      description: 'Raises temperature under cold stress.',
      icon: Flame,
      color: 'var(--color-temp)',
    },
    {
      id: 'cooler' as keyof ActuatorState,
      name: 'Chilling Cooler',
      description: 'Drops temperature under heat waves.',
      icon: Wind,
      color: 'var(--color-humidity)',
    },
    {
      id: 'humidifier' as keyof ActuatorState,
      name: 'Ultrasonic Humidifier',
      description: 'Increases ambient relative humidity.',
      icon: Droplets,
      color: 'var(--color-water)',
    },
    {
      id: 'ventilator' as keyof ActuatorState,
      name: 'Exhaust Ventilator Fans',
      description: 'Cycles fresh air, vents CO2/excess humidity.',
      icon: Wind,
      color: 'var(--color-emerald)',
    },
    {
      id: 'irrigation' as keyof ActuatorState,
      name: 'Drip Irrigation Valve',
      description: 'Pumps water into growing soil beds.',
      icon: Droplets,
      color: 'var(--color-soil)',
    },
    {
      id: 'growLights' as keyof ActuatorState,
      name: 'PAR Spectrum Grow Lights',
      description: 'Enables artificial sunlight synthesis.',
      icon: Lightbulb,
      color: 'var(--color-light)',
    },
  ];

  return (
    <div style={styles.container}>
      {/* Title */}
      <div style={styles.header}>
        <h2>⚙️ Actuator Control Center - {name}</h2>
        <p style={styles.subtitle}>
          Manually command the IoT physical layers. Interventions send topics over simulated MQTT.
        </p>
      </div>

      {/* Grid of controllers */}
      <div className="dashboard-grid">
        {actuatorList.map((act) => {
          const Icon = act.icon;
          const isActive = actuators[act.id];
          
          return (
            <div 
              key={act.id} 
              className="glass-panel" 
              style={{
                ...styles.actuatorCard,
                ...(isActive ? { borderColor: act.color, boxShadow: `0 0 16px ${act.color}20` } : {})
              }}
            >
              <div style={styles.actuatorHeader}>
                <div 
                  style={{
                    ...styles.iconWrapper,
                    background: isActive ? `${act.color}20` : 'rgba(255,255,255,0.03)',
                    color: isActive ? act.color : 'var(--text-muted)'
                  }}
                >
                  <Icon size={20} className={isActive && act.id === 'ventilator' ? 'animate-spin-fast' : ''} />
                </div>
                <div>
                  <h4 style={styles.actName}>{act.name}</h4>
                  <span style={styles.topicLabel}>topic: <code style={styles.code}>verdantiq/{greenhouse.id}/actuators/{act.id}</code></span>
                </div>
              </div>

              <p style={styles.actDesc}>{act.description}</p>

              <div style={styles.controlFooter}>
                <span 
                  style={{
                    ...styles.statusLabel,
                    color: isActive ? act.color : 'var(--text-dim)',
                    fontWeight: '700'
                  }}
                >
                  {isActive ? 'STATE: ACTIVE (ON)' : 'STATE: IDLE (OFF)'}
                </span>

                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={isActive} 
                    onChange={(e) => onToggleActuator(act.id, e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Interlocks */}
      <div className="glass-panel" style={styles.safetyPanel}>
        <div style={styles.safetyHeader}>
          <AlertTriangle color="var(--color-red)" size={24} />
          <div>
            <h4 style={{ color: 'var(--color-red)' }}>Emergency Interlock Subsystem</h4>
            <p style={styles.safetyDesc}>
              Override all logic, rules, and manual commands immediately. Forces all actuators into a zero-power safety state.
            </p>
          </div>
        </div>
        <button className="btn-danger" style={styles.emergencyBtn} onClick={onEmergencyStop}>
          <Square size={14} style={{ marginRight: '6px' }} />
          EMERGENCY SHUTDOWN (ALL OFF)
        </button>
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
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
  },
  actuatorCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    gap: '14px',
  },
  actuatorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    flexShrink: 0,
  },
  actName: {
    fontSize: '0.95rem',
    fontWeight: '600',
  },
  topicLabel: {
    fontSize: '0.65rem',
    color: 'var(--text-dim)',
    display: 'block',
    marginTop: '2px',
  },
  code: {
    fontSize: '0.65rem',
    padding: '2px 4px',
  },
  actDesc: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
    flexGrow: 1,
  },
  controlFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    paddingTop: '12px',
    marginTop: '4px',
  },
  statusLabel: {
    fontSize: '0.75rem',
    letterSpacing: '0.02em',
  },
  safetyPanel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    background: 'rgba(239, 68, 68, 0.03)',
    flexWrap: 'wrap',
    gap: '16px',
  },
  safetyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  safetyDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  emergencyBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.8rem',
    padding: '12px 20px',
  },
};
