import React, { useState } from 'react';
import { Plus, Trash2, Activity } from 'lucide-react';
import type { AutomationRule, Greenhouse, SensorTelemetry, ActuatorState } from '../types';

interface RuleBuilderProps {
  greenhouse: Greenhouse;
  rules: AutomationRule[];
  onAddRule: (rule: Omit<AutomationRule, 'id'>) => void;
  onToggleRule: (id: string) => void;
  onDeleteRule: (id: string) => void;
  triggeredAlerts: string[];
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  rules,
  onAddRule,
  onToggleRule,
  onDeleteRule,
  triggeredAlerts,
}) => {
  const [name, setName] = useState('');
  const [sensor, setSensor] = useState<keyof SensorTelemetry>('temperature');
  const [operator, setOperator] = useState<'less' | 'greater'>('less');
  const [value, setValue] = useState<number>(20);
  const [actuator, setActuator] = useState<keyof ActuatorState>('heater');
  const [action, setAction] = useState<'ON' | 'OFF'>('ON');

  const sensorNames: Record<keyof SensorTelemetry, string> = {
    temperature: 'Temperature (°C)',
    humidity: 'Air Humidity (%)',
    soilMoisture: 'Soil Moisture (%)',
    co2: 'CO₂ Level (ppm)',
    light: 'Light Intensity (lux)',
    waterLevel: 'Water Reservoir Level (%)',
  };

  const actuatorNames: Record<keyof ActuatorState, string> = {
    heater: 'Climate Heater',
    cooler: 'Chilling Cooler',
    humidifier: 'Ultrasonic Humidifier',
    ventilator: 'Exhaust Ventilator Fans',
    irrigation: 'Drip Irrigation Valve',
    growLights: 'PAR Grow Lights',
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddRule({
      name: name.trim(),
      sensor,
      operator,
      value: Number(value),
      actuator,
      action,
      active: true,
    });

    // Reset fields
    setName('');
  };

  return (
    <div style={styles.container}>
      {/* Title */}
      <div style={styles.intro}>
        <h2>⚙️ Event-Driven IoT Rule & Automation Engine</h2>
        <p style={styles.subtitle}>
          Formulate closed-loop controls. The engine evaluates rules on every simulation tick.
        </p>
      </div>

      {/* Main Grid */}
      <div style={styles.grid}>
        {/* Left Side: Rule Builder Form */}
        <div className="glass-panel" style={styles.formPanel}>
          <h3>➕ Construct New Rule</h3>
          <p style={styles.formSubtitle}>Create a logical trigger rule matching telemetry inputs.</p>

          <form onSubmit={handleAddSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Rule Identifier / Name</label>
              <input 
                type="text" 
                placeholder="e.g. Auto-Ventilate High Humidity" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.inlineRow}>
              <div style={{ ...styles.formGroup, flex: 2 }}>
                <label style={styles.label}>If Sensor Input</label>
                <select 
                  value={sensor} 
                  onChange={(e) => setSensor(e.target.value as keyof SensorTelemetry)}
                  style={styles.select}
                >
                  {Object.entries(sensorNames).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.label}>Operator</label>
                <select 
                  value={operator} 
                  onChange={(e) => setOperator(e.target.value as 'less' | 'greater')}
                  style={styles.select}
                >
                  <option value="less">&lt; Less Than</option>
                  <option value="greater">&gt; Greater Than</option>
                </select>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Threshold Value</label>
              <input 
                type="number" 
                value={value} 
                onChange={(e) => setValue(Number(e.target.value))}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.inlineRow}>
              <div style={{ ...styles.formGroup, flex: 2 }}>
                <label style={styles.label}>Then Set Actuator</label>
                <select 
                  value={actuator} 
                  onChange={(e) => setActuator(e.target.value as keyof ActuatorState)}
                  style={styles.select}
                >
                  {Object.entries(actuatorNames).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.label}>Action</label>
                <select 
                  value={action} 
                  onChange={(e) => setAction(e.target.value as 'ON' | 'OFF')}
                  style={styles.select}
                >
                  <option value="ON">ON</option>
                  <option value="OFF">OFF</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={styles.addBtn}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              Register Automation Rule
            </button>
          </form>
        </div>

        {/* Right Side: Active Rules List */}
        <div style={styles.rulesColumn}>
          {/* Active alerts banner if any rules triggered */}
          {triggeredAlerts.length > 0 && (
            <div style={styles.liveTriggerBanner}>
              <Activity size={16} className="animate-pulse-glow" style={{ color: 'var(--color-emerald)' }} />
              <div>
                <span style={styles.liveTriggerTitle}>Rule Engine Live Fire:</span>
                <div style={styles.triggeredItems}>
                  {triggeredAlerts.map((name, i) => (
                    <span key={i} className="badge badge-success" style={styles.triggeredBadge}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="glass-panel" style={styles.listPanel}>
            <h3>📋 Registered Automation Rules</h3>
            <p style={styles.formSubtitle}>List of active edge rules running in this greenhouse.</p>

            <div style={styles.rulesList}>
              {rules.length === 0 ? (
                <div style={styles.emptyList}>
                  No active automation rules. Use the compiler on the left to create rules.
                </div>
              ) : (
                rules.map((rule) => {
                  const isTriggered = triggeredAlerts.includes(rule.name);
                  return (
                    <div 
                      key={rule.id} 
                      style={{
                        ...styles.ruleCard,
                        ...(isTriggered ? styles.ruleCardTriggered : {}),
                        ...(!rule.active ? styles.ruleCardInactive : {})
                      }}
                    >
                      <div style={styles.ruleInfo}>
                        <div style={styles.ruleHeader}>
                          <span style={styles.ruleTitle}>{rule.name}</span>
                          {isTriggered && (
                            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                              TRIGGERED
                            </span>
                          )}
                        </div>
                        <div style={styles.ruleLogic}>
                          IF <strong style={styles.code}>{rule.sensor}</strong> {rule.operator === 'less' ? '<' : '>'} <strong>{rule.value}</strong>
                          {' '}→ SET <strong style={styles.code}>{rule.actuator}</strong> to <strong>{rule.action}</strong>
                        </div>
                      </div>

                      <div style={styles.ruleActions}>
                        <label className="toggle-switch" style={{ transform: 'scale(0.8)' }}>
                          <input 
                            type="checkbox" 
                            checked={rule.active} 
                            onChange={() => onToggleRule(rule.id)}
                          />
                          <span className="slider"></span>
                        </label>

                        <button 
                          onClick={() => onDeleteRule(rule.id)} 
                          style={styles.deleteBtn}
                          title="Delete Rule"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 1fr) 1.2fr',
    gap: '24px',
    alignItems: 'start',
  },
  formPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  formSubtitle: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '8px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-main)',
  },
  input: {
    width: '100%',
  },
  select: {
    width: '100%',
  },
  inlineRow: {
    display: 'flex',
    gap: '12px',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: '8px',
  },
  rulesColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  liveTriggerBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '12px',
    padding: '12px 16px',
  },
  liveTriggerTitle: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--color-emerald)',
  },
  triggeredItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '6px',
  },
  triggeredBadge: {
    fontSize: '0.65rem',
  },
  listPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  rulesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  emptyList: {
    color: 'var(--text-dim)',
    textAlign: 'center',
    padding: '30px',
    border: '1.5px dashed var(--glass-border)',
    borderRadius: '10px',
    fontSize: '0.85rem',
  },
  ruleCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--glass-border)',
    transition: 'all 0.2s',
  },
  ruleCardTriggered: {
    borderColor: 'rgba(16, 185, 129, 0.35)',
    background: 'rgba(16, 185, 129, 0.04)',
  },
  ruleCardInactive: {
    opacity: 0.55,
  },
  ruleInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flexGrow: 1,
  },
  ruleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  ruleTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#fff',
  },
  ruleLogic: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
  },
  code: {
    fontSize: '0.72rem',
    padding: '2px 4px',
  },
  ruleActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginLeft: '12px',
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-dim)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
};
