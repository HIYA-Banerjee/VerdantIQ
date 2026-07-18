import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import type { Greenhouse } from '../types';
import { CROP_PROFILES } from '../types';

interface AiAdvisorProps {
  greenhouse: Greenhouse;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

export const AiAdvisor: React.FC<AiAdvisorProps> = ({ greenhouse }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { crop, sensors, sensorStatus, healthScore } = greenhouse;
  const thresholds = CROP_PROFILES[crop];

  // Helper to generate the real-time AI diagnosis based on greenhouse state
  const generateDiagnosis = () => {
    let diagnosis = `🌿 **VerdantIQ Crop Diagnosis for ${greenhouse.name} (${crop}):**\n\n`;
    
    // Check sensor failures
    const offlineSensors = Object.entries(sensorStatus).filter(([_, status]) => status !== 'online');
    if (offlineSensors.length > 0) {
      diagnosis += `⚠️ **CRITICAL anomaly:** The following sensors are experiencing faults: **${offlineSensors.map(([name]) => name.toUpperCase()).join(', ')}**. Closed-loop rules bound to these parameters are currently suspended for safety interlocks.\n\n`;
    }

    // Health stress evaluation
    if (healthScore < 50) {
      diagnosis += `🚨 **URGENT HEALTH HAZARD:** Crop health is severely degraded at **${healthScore}%**. Plants are experiencing extreme physiological stress.\n\n`;
    } else if (healthScore < 85) {
      diagnosis += `⚠️ **MODERATE STRESS:** Crop health is at **${healthScore}%**. Let's optimize parameters to restore peak growth rate.\n\n`;
    } else {
      diagnosis += `✅ **HEALTH EXCELLENT:** Crop health is at **${healthScore}%**. Photosynthesis rate is normal, and growth progress is moving cleanly.\n\n`;
    }

    // Telemetry recommendations
    let recommendations: string[] = [];

    if (sensorStatus.temperature === 'online') {
      if (sensors.temperature < thresholds.tempMin) {
        recommendations.push(`- **Temperature (${sensors.temperature.toFixed(1)}°C) is low** (Min optimal is ${thresholds.tempMin}°C). *Action: Activate the Climate Heater.*`);
      } else if (sensors.temperature > thresholds.tempMax) {
        recommendations.push(`- **Temperature (${sensors.temperature.toFixed(1)}°C) is high** (Max optimal is ${thresholds.tempMax}°C). *Action: Activate Ventilation Fans or Chilling Coolers.*`);
      }
    }

    if (sensorStatus.soilMoisture === 'online') {
      if (sensors.soilMoisture < thresholds.soilMin) {
        recommendations.push(`- **Soil Moisture (${sensors.soilMoisture.toFixed(1)}%) is dry** (Min optimal is ${thresholds.soilMin}%). *Action: Turn on Drip Irrigation immediately.*`);
      }
    }

    if (sensorStatus.humidity === 'online') {
      if (sensors.humidity < thresholds.humidMin) {
        recommendations.push(`- **Relative Humidity (${sensors.humidity.toFixed(1)}%) is dry** (Min optimal is ${thresholds.humidMin}%). *Action: Turn on the Ultrasonic Humidifier.*`);
      } else if (sensors.humidity > thresholds.humidMax) {
        recommendations.push(`- **Relative Humidity (${sensors.humidity.toFixed(1)}%) is high** (Max optimal is ${thresholds.humidMax}%). *Action: Activate Ventilation Fans to exhaust water vapor.*`);
      }
    }

    if (sensorStatus.co2 === 'online' && sensors.co2 < thresholds.co2Min) {
      recommendations.push(`- **CO₂ levels (${sensors.co2.toFixed(0)} ppm) are depleted** (Optimal is >${thresholds.co2Min} ppm). *Action: Open ventilators or cycle fresh air to recharge carbon levels.*`);
    }

    if (recommendations.length > 0) {
      diagnosis += `📋 **Recommended Adjustments:**\n` + recommendations.join('\n') + `\n\n💡 *Tip: You can automate these actions by writing rules in the **Automation Rules** tab.*`;
    } else if (offlineSensors.length === 0) {
      diagnosis += `✨ **All environmental metrics are perfectly aligned inside the optimal biological envelope! No adjustments necessary.**`;
    }

    return diagnosis;
  };

  // Initial welcome message
  useEffect(() => {
    const welcomeMsg: Message = {
      id: 'welcome',
      sender: 'bot',
      text: `Hello! I am your **VerdantIQ Agronomy Agent**. 🤖🌿\n\nI monitor the digital twin state of your greenhouse continuously. How can I help you optimize your crop environments today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([welcomeMsg]);
  }, [crop]); // trigger reset on crop change to sync

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      let botResponse = '';
      const normText = textToSend.toLowerCase();

      if (normText.includes('diagnose') || normText.includes('health') || normText.includes('status')) {
        botResponse = generateDiagnosis();
      } else if (normText.includes('rule') || normText.includes('automate')) {
        botResponse = `🤖 **VerdantIQ Rule Recommendation:**\n\nTo establish closed-loop homeostatic controls for **${crop}**, I recommend registering the following edge rules:\n\n1. **Auto-Watering:**\n   - Condition: \`IF soilMoisture < ${thresholds.soilMin}%\`\n   - Action: \`SET irrigation to ON\`\n\n2. **Auto-Ventilation:**\n   - Condition: \`IF humidity > ${thresholds.humidMax}%\`\n   - Action: \`SET ventilator to ON\`\n\n3. **Frost Protection:**\n   - Condition: \`IF temperature < ${thresholds.tempMin}°C\`\n   - Action: \`SET heater to ON\``;
      } else if (normText.includes('threshold') || normText.includes('optimal') || normText.includes('limit')) {
        botResponse = `📊 **Optimal Biological Envelope for ${crop}:**\n\n` +
          `- 🌡️ **Temperature:** ${thresholds.tempMin}°C to ${thresholds.tempMax}°C\n` +
          `- 💧 **Air Humidity:** ${thresholds.humidMin}% to ${thresholds.humidMax}%\n` +
          `- 🌱 **Soil Moisture:** ${thresholds.soilMin}% to ${thresholds.soilMax}%\n` +
          `- 💨 **CO₂ Target:** >${thresholds.co2Min} ppm\n` +
          `- ☀️ **Light Threshold:** >${thresholds.lightMin} lux\n\n` +
          `Growth progress is currently at **${greenhouse.growthProgress.toFixed(1)}%** under the current environment.`;
      } else {
        botResponse = `I've analyzed your greenhouse query. I recommend running a full diagnosis by asking **"Diagnose greenhouse health"** to see what factors are impacting your current **${crop}** crops, or asking **"Suggest automation rules"** to configure automated stabilizers.`;
      }

      const botMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'bot',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const quickPrompts = [
    { label: 'Diagnose Greenhouse Health 🔍', query: 'Diagnose greenhouse health' },
    { label: 'Suggest Automation Rules ⚙️', query: 'Suggest automation rules' },
    { label: 'Show Crop Biology Envelopes 📊', query: 'Show crop biology envelopes' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>🤖 AI-Powered Crop Recommendation Engine</h2>
        <p style={styles.subtitle}>
          Talk to the digital twin agronomy expert. Get insights on crop stress, climate stability, and automated rules.
        </p>
      </div>

      <div style={styles.chatArea}>
        {/* Chat log */}
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`chat-bubble ${msg.sender === 'bot' ? 'bubble-bot' : 'bubble-user'}`}
                style={{
                  ...styles.bubble,
                  alignSelf: msg.sender === 'bot' ? 'flex-start' : 'flex-end',
                }}
              >
                {/* Parse basic markdown asterisks to HTML */}
                <div style={styles.msgText} dangerouslySetInnerHTML={{ 
                  __html: msg.text
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/`(.*?)`/g, '<code style="font-size:0.75rem; background:rgba(255,255,255,0.08); padding:2px 4px; border-radius:4px;">$1</code>')
                    .replace(/\n/g, '<br />')
                }} />
                <span style={styles.timestamp}>{msg.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="chat-bubble bubble-bot" style={{ alignSelf: 'flex-start' }}>
                <div style={styles.typingIndicator}>
                  <span style={styles.typingDot}></span>
                  <span style={styles.typingDot}></span>
                  <span style={styles.typingDot}></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick recommendations */}
          <div style={styles.quickBar}>
            {quickPrompts.map((p, idx) => (
              <button 
                key={idx} 
                onClick={() => handleSendMessage(p.query)}
                style={styles.quickBtn}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input field */}
          <div className="chat-input-area">
            <input 
              type="text" 
              placeholder="Ask the Agronomy Agent (e.g. 'how is my crop health?')..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
              style={styles.chatInput}
            />
            <button 
              className="btn-primary" 
              onClick={() => handleSendMessage(input)}
              disabled={!input.trim()}
              style={styles.sendBtn}
            >
              <Send size={16} />
            </button>
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
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
  },
  chatArea: {
    flexGrow: 1,
  },
  bubble: {
    position: 'relative',
  },
  msgText: {
    wordBreak: 'break-word',
    fontSize: '0.85rem',
  },
  timestamp: {
    fontSize: '0.62rem',
    color: 'var(--text-dim)',
    display: 'block',
    marginTop: '4px',
    textAlign: 'right',
  },
  typingIndicator: {
    display: 'flex',
    gap: '4px',
    padding: '4px 6px',
    alignItems: 'center',
  },
  typingDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--text-muted)',
    display: 'inline-block',
    animation: 'pulse-glow 1.2s infinite ease-in-out',
  },
  quickBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '12px 20px',
    background: 'rgba(0, 0, 0, 0.15)',
    borderTop: '1px solid var(--glass-border)',
  },
  quickBtn: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-muted)',
    fontSize: '0.72rem',
    padding: '6px 12px',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  chatInput: {
    background: '#04070e',
  },
  sendBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '42px',
    padding: '0',
    flexShrink: 0,
  },
};
