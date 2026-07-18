import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, ShieldCheck } from 'lucide-react';
import type { MQTTMessage } from '../types';

interface MqttConsoleProps {
  messages: MQTTMessage[];
  onPublishMessage: (topic: string, payload: string) => void;
  onClearConsole: () => void;
}

export const MqttConsole: React.FC<MqttConsoleProps> = ({
  messages,
  onPublishMessage,
  onClearConsole,
}) => {
  const [topic, setTopic] = useState('');
  const [payload, setPayload] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal log
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !payload.trim()) return;

    onPublishMessage(topic.trim(), payload.trim());
    setPayload(''); // reset payload
  };

  const getTopicColor = (t: string) => {
    if (t.includes('telemetry')) return '#10b981'; // green
    if (t.includes('actuators')) return '#3b82f6'; // blue
    if (t.includes('alerts')) return '#ef4444'; // red
    if (t.includes('rules')) return '#a855f7'; // purple
    return '#9ca3af'; // gray
  };

  const filteredMessages = messages.filter(msg => {
    if (!filterTopic) return true;
    return msg.topic.toLowerCase().includes(filterTopic.toLowerCase()) || 
           msg.payload.toLowerCase().includes(filterTopic.toLowerCase());
  });

  return (
    <div style={styles.container}>
      {/* Overview Intro */}
      <div style={styles.intro}>
        <h2>📡 MQTT Communication Console (Simulated Broker)</h2>
        <p style={styles.subtitle}>
          Observe real-time telemetry updates and pub/sub events. The broker processes JSON string payloads under local topics.
        </p>
      </div>

      <div style={styles.mainGrid}>
        {/* Left Side: Terminal Log */}
        <div style={styles.terminalPanel}>
          <div className="terminal-window">
            <div className="terminal-header">
              <span className="terminal-dot dot-red"></span>
              <span className="terminal-dot dot-yellow"></span>
              <span className="terminal-dot dot-green"></span>
              <span className="terminal-title">broker@verdantiq-mqtt-node: ~</span>
              <span style={styles.brokerStatus}>
                <ShieldCheck size={12} color="var(--color-emerald)" />
                Simulated Broker Connected (127.0.0.1:1883)
              </span>
              <button onClick={onClearConsole} style={styles.clearBtn} title="Clear Terminal Log">
                <Trash2 size={12} />
              </button>
            </div>

            {/* Filter */}
            <div style={styles.terminalFilterBar}>
              <input 
                type="text" 
                placeholder="grep/filter logs (e.g. telemetry, actuators)..." 
                value={filterTopic} 
                onChange={(e) => setFilterTopic(e.target.value)}
                style={styles.filterInput}
              />
            </div>

            {/* Log Stream */}
            <div className="terminal-body">
              {filteredMessages.length === 0 ? (
                <div style={styles.emptyTerminal}>
                  Waiting for telemetry frames... Ticks emit every 5s.
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const dateStr = new Date(msg.timestamp).toLocaleTimeString([], { hour12: false });
                  return (
                    <div key={msg.id} style={styles.terminalLine}>
                      <span style={styles.termTime}>[{dateStr}]</span>
                      <span 
                        style={{
                          ...styles.termDirection,
                          color: msg.type === 'pub' ? 'var(--color-temp)' : 'var(--color-humidity)'
                        }}
                      >
                        {msg.type === 'pub' ? ' [PUB] ' : ' [SUB] '}
                      </span>
                      <span style={{ color: getTopicColor(msg.topic) }}>{msg.topic}</span>
                      <span style={styles.termSep}>→</span>
                      <span style={styles.termPayload}>{msg.payload}</span>
                    </div>
                  );
                })
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

        {/* Right Side: Manual Client Publisher Form */}
        <div className="glass-panel" style={styles.publisherPanel}>
          <h3>🚀 Command Center Publisher Client</h3>
          <p style={styles.publisherSubtitle}>
            Impersonate an external IoT device or mobile app. Inject topics directly into the system broker.
          </p>

          <form onSubmit={handlePublishSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Publish Topic</label>
              <input 
                type="text"
                placeholder="e.g. verdantiq/alpha/actuators/heater"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                style={styles.formInput}
              />
              <span style={styles.help}>Common topics: <code style={styles.code}>verdantiq/[gh_id]/actuators/[heater|cooler|irrigation]</code></span>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Payload Value</label>
              <input 
                type="text"
                placeholder="e.g. ON, OFF or custom JSON string"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                required
                style={styles.formInput}
              />
              <span style={styles.help}>Actuator controls accept: <code style={styles.code}>ON</code> or <code style={styles.code}>OFF</code></span>
            </div>

            <button type="submit" className="btn-primary" style={styles.pubBtn}>
              <Send size={14} style={{ marginRight: '6px' }} />
              Publish Message Frame
            </button>
          </form>

          {/* Quick Command Templates */}
          <div style={styles.quickCommands}>
            <div style={styles.quickTitle}>Quick Command Templates:</div>
            <div style={styles.templateList}>
              <button 
                type="button" 
                onClick={() => { setTopic('verdantiq/alpha/actuators/irrigation'); setPayload('ON'); }}
                style={styles.templateBtn}
              >
                💧 Turn Irrigation ON
              </button>
              <button 
                type="button" 
                onClick={() => { setTopic('verdantiq/alpha/actuators/ventilator'); setPayload('ON'); }}
                style={styles.templateBtn}
              >
                🌀 Turn Ventilator ON
              </button>
              <button 
                type="button" 
                onClick={() => { setTopic('verdantiq/alpha/actuators/heater'); setPayload('OFF'); }}
                style={styles.templateBtn}
              >
                🔥 Turn Heater OFF
              </button>
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
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)',
    gap: '24px',
    alignItems: 'start',
  },
  terminalPanel: {
    height: '460px',
  },
  brokerStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    marginLeft: 'auto',
    marginRight: '12px',
  },
  clearBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-dim)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
  },
  terminalFilterBar: {
    background: '#090e19',
    padding: '8px 16px',
    borderBottom: '1px solid var(--glass-border)',
  },
  filterInput: {
    width: '100%',
    background: '#04070e',
    border: '1px solid var(--glass-border)',
    fontSize: '0.75rem',
    padding: '6px 12px',
    borderRadius: '6px',
  },
  emptyTerminal: {
    color: 'var(--text-dim)',
    textAlign: 'center',
    paddingTop: '60px',
  },
  terminalLine: {
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  termTime: {
    color: '#6b7280',
  },
  termDirection: {
    fontWeight: 'bold',
  },
  termSep: {
    margin: '0 8px',
    color: '#6b7280',
  },
  termPayload: {
    color: '#e2e8f0',
    fontStyle: 'italic',
  },
  publisherPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  publisherSubtitle: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  formInput: {
    width: '100%',
  },
  help: {
    fontSize: '0.65rem',
    color: 'var(--text-dim)',
  },
  code: {
    fontSize: '0.65rem',
    padding: '1px 3px',
  },
  pubBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  quickCommands: {
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '16px',
    marginTop: '8px',
  },
  quickTitle: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    marginBottom: '8px',
  },
  templateList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  templateBtn: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
    padding: '8px 12px',
    borderRadius: '8px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'block',
    width: '100%',
  },
};
