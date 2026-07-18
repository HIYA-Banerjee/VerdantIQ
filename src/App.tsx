import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { DigitalTwin } from './components/DigitalTwin';
import { ControlCenter } from './components/ControlCenter';
import { MqttConsole } from './components/MqttConsole';
import { RuleBuilder } from './components/RuleBuilder';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { AiAdvisor } from './components/AiAdvisor';
import { ScenarioManager } from './components/ScenarioManager';
import { SimulationEngine } from './core/simulationEngine';
import { mqttBroker } from './core/mqttBroker';
import { RuleEngine } from './core/ruleEngine';
import type { 
  Greenhouse, 
  Weather, 
  AutomationRule, 
  MQTTMessage, 
  ActuatorState, 
  SensorTelemetry, 
  SensorStatus
} from './types';
import { Sun, Moon } from 'lucide-react';

// Extend AutomationRule to support targeting specific greenhouses
interface AppAutomationRule extends AutomationRule {
  greenhouseId: string;
}

export const App: React.FC = () => {
  // 1. Core States
  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>(() => [
    SimulationEngine.initializeGreenhouse('alpha', 'Greenhouse Alpha', 'Tomato'),
    SimulationEngine.initializeGreenhouse('beta', 'Greenhouse Beta', 'Lettuce'),
    SimulationEngine.initializeGreenhouse('gamma', 'Greenhouse Gamma', 'Strawberry'),
  ]);
  const [selectedId, setSelectedId] = useState('alpha');
  const [activeTab, setActiveTab] = useState('overview');
  const [weather, setWeather] = useState<Weather>({
    condition: 'sunny',
    tempShift: 0,
    humidityShift: 0,
    lightShift: 0,
  });

  const [daytime, setDaytime] = useState(true);
  const [dayCycleProgress, setDayCycleProgress] = useState(0); // 0 to 60 (day/night loop)
  const [mqttMessages, setMqttMessages] = useState<MQTTMessage[]>([]);
  const [rules, setRules] = useState<AppAutomationRule[]>([]);
  const [triggeredRuleNames, setTriggeredRuleNames] = useState<string[]>([]);
  const [tickCounter, setTickCounter] = useState(0);

  // 2. Load default automation rules on mount
  useEffect(() => {
    const defaultRules: AppAutomationRule[] = [
      // Greenhouse Alpha (Tomato)
      { id: 't1', name: 'Alpha Auto-Heating', greenhouseId: 'alpha', sensor: 'temperature', operator: 'less', value: 19, actuator: 'heater', action: 'ON', active: true },
      { id: 't2', name: 'Alpha Auto-Cooling', greenhouseId: 'alpha', sensor: 'temperature', operator: 'greater', value: 26, actuator: 'cooler', action: 'ON', active: true },
      { id: 't3', name: 'Alpha Dry Irrigation', greenhouseId: 'alpha', sensor: 'soilMoisture', operator: 'less', value: 45, actuator: 'irrigation', action: 'ON', active: true },
      { id: 't4', name: 'Alpha Stop Watering', greenhouseId: 'alpha', sensor: 'soilMoisture', operator: 'greater', value: 70, actuator: 'irrigation', action: 'OFF', active: true },
      { id: 't5', name: 'Alpha High Humidity Fan', greenhouseId: 'alpha', sensor: 'humidity', operator: 'greater', value: 75, actuator: 'ventilator', action: 'ON', active: true },

      // Greenhouse Beta (Lettuce)
      { id: 'l1', name: 'Beta Dry Irrigation', greenhouseId: 'beta', sensor: 'soilMoisture', operator: 'less', value: 55, actuator: 'irrigation', action: 'ON', active: true },
      { id: 'l2', name: 'Beta High Temp Vent', greenhouseId: 'beta', sensor: 'temperature', operator: 'greater', value: 23, actuator: 'ventilator', action: 'ON', active: true },

      // Greenhouse Gamma (Strawberry)
      { id: 's1', name: 'Gamma Frost Heater', greenhouseId: 'gamma', sensor: 'temperature', operator: 'less', value: 17, actuator: 'heater', action: 'ON', active: true },
      { id: 's2', name: 'Gamma Dry Irrigation', greenhouseId: 'gamma', sensor: 'soilMoisture', operator: 'less', value: 48, actuator: 'irrigation', action: 'ON', active: true },
    ];
    setRules(defaultRules);
  }, []);

  // 3. Connect local state to simulated MQTT broker
  useEffect(() => {
    // Read historical logs from broker
    setMqttMessages(mqttBroker.getMessageLog());

    // Listen to broker logs
    const unsubscribeLog = mqttBroker.onLogMessage((msg) => {
      setMqttMessages(prev => [...prev, msg]);
    });

    // Subscribe to actuator command topics: "verdantiq/+/actuators/+"
    // Payload can be: "ON" or "OFF"
    const subId = 'app-controller';
    mqttBroker.subscribe('verdantiq/+/actuators/+', subId, (_payload) => {
      // Find out topic variables from a live pub
      // Normally we parse the topic being handled by this wildcard:
      // Topic structure: verdantiq/[ghId]/actuators/[actuator]
    });

    // In a real subscriber, we parse the topic structure.
    // Let's hook a direct callback that intercepts published topics.
    // We override mqttBroker's publish logic internally to apply commands directly to state:
    const handleCommand = (topic: string, payload: string) => {
      const parts = topic.split('/');
      if (parts[0] === 'verdantiq' && parts[2] === 'actuators') {
        const ghId = parts[1];
        const actuator = parts[3] as keyof ActuatorState;
        const state = payload === 'ON';

        setGreenhouses(prev => prev.map(gh => {
          if (gh.id === ghId && gh.actuators[actuator] !== state) {
            return {
              ...gh,
              actuators: {
                ...gh.actuators,
                [actuator]: state
              }
            };
          }
          return gh;
        }));
      }
    };

    const unsubscribeWildcard = mqttBroker.onLogMessage((msg) => {
      if (msg.topic.startsWith('verdantiq/') && msg.topic.includes('/actuators/')) {
        handleCommand(msg.topic, msg.payload);
      }
    });

    return () => {
      unsubscribeLog();
      unsubscribeWildcard();
      mqttBroker.unsubscribe('verdantiq/+/actuators/+', subId);
    };
  }, []);

  // 4. Global Simulation Interval Tick (1 second)
  useEffect(() => {
    const interval = setInterval(() => {
      setTickCounter(prev => prev + 1);

      // (a) Progress Day/Night cycle
      setDayCycleProgress(prev => {
        const next = (prev + 1) % 60;
        if (next === 0) setDaytime(true);
        if (next === 40) setDaytime(false); // night after 40 seconds
        return next;
      });

      // (b) Run simulation tick on each greenhouse
      setGreenhouses(prev => prev.map(gh => {
        // Run physics and return updated greenhouse object
        const updatedGh = SimulationEngine.tick(gh, weather, daytime);

        // (c) MQTT Telemetry Publish
        // We publish to MQTT once every 5 ticks to mimic normal sampling rates
        if (tickCounter % 5 === 0) {
          const telemetryTopic = `verdantiq/${gh.id}/sensors/telemetry`;
          const payloadStr = JSON.stringify({
            temp: parseFloat(updatedGh.sensors.temperature.toFixed(1)),
            humid: parseFloat(updatedGh.sensors.humidity.toFixed(0)),
            soil: parseFloat(updatedGh.sensors.soilMoisture.toFixed(0)),
            co2: parseFloat(updatedGh.sensors.co2.toFixed(0)),
            light: parseFloat(updatedGh.sensors.light.toFixed(0)),
            water: parseFloat(updatedGh.sensors.waterLevel.toFixed(1)),
            health: updatedGh.healthScore,
          });
          mqttBroker.publish(telemetryTopic, payloadStr, 'pub');
        }

        return updatedGh;
      }));

    }, 1000);

    return () => clearInterval(interval);
  }, [weather, daytime, tickCounter]);

  // 5. Evaluate Rules Engine on Tick
  useEffect(() => {
    const allTriggeredRules: string[] = [];

    setGreenhouses(prev => {
      let stateChanged = false;
      const nextGreenhouses = prev.map(gh => {
        const ghRules = rules.filter(r => r.greenhouseId === gh.id && r.active);
        
        const triggered = RuleEngine.evaluateRules(gh, ghRules, (rule, desiredState) => {
          allTriggeredRules.push(rule.name);
          
          // Publish command over MQTT broker
          const commandTopic = `verdantiq/${gh.id}/actuators/${rule.actuator}`;
          const payload = desiredState ? 'ON' : 'OFF';
          mqttBroker.publish(commandTopic, payload, 'sub');
        });

        if (triggered.length > 0) {
          stateChanged = true;
        }

        return gh;
      });

      return stateChanged ? nextGreenhouses : prev;
    });

    setTriggeredRuleNames(allTriggeredRules);
  }, [greenhouses, rules]);

  // 6. Action Handlers
  const handleToggleActuator = useCallback((actuator: keyof ActuatorState, state: boolean) => {
    // Manually toggle actuator by publishing on MQTT topic
    const topic = `verdantiq/${selectedId}/actuators/${actuator}`;
    const payload = state ? 'ON' : 'OFF';
    mqttBroker.publish(topic, payload, 'pub');
  }, [selectedId]);

  const handleEmergencyStop = useCallback(() => {
    // Publish OFF to all actuators for current greenhouse
    const actuatorsList: Array<keyof ActuatorState> = ['heater', 'cooler', 'humidifier', 'ventilator', 'irrigation', 'growLights'];
    actuatorsList.forEach(actuator => {
      const topic = `verdantiq/${selectedId}/actuators/${actuator}`;
      mqttBroker.publish(topic, 'OFF', 'pub');
    });

    // Alert system log
    mqttBroker.publish(`verdantiq/${selectedId}/alerts/emergency`, 'CRITICAL: EMERGENCY HARDWARE INTERLOCK PRESSED! ALL ACTUATORS FLUSHED TO IDLE.', 'pub');
  }, [selectedId]);

  const handleRefillWater = useCallback(() => {
    setGreenhouses(prev => prev.map(gh => {
      if (gh.id === selectedId) {
        return {
          ...gh,
          sensors: {
            ...gh.sensors,
            waterLevel: 100.0,
          },
          // Clear any out-of-water warnings
          alerts: gh.alerts.map(a => a.message.includes('Water tank empty') ? { ...a, active: false } : a)
        };
      }
      return gh;
    }));
    mqttBroker.publish(`verdantiq/${selectedId}/actuators/reservoir`, 'REFILL_COMPLETED: 100%', 'pub');
  }, [selectedId]);

  const handleAddRule = useCallback((newRule: Omit<AutomationRule, 'id'>) => {
    const rule: AppAutomationRule = {
      ...newRule,
      id: Math.random().toString(36).substr(2, 9),
      greenhouseId: selectedId,
    };
    setRules(prev => [...prev, rule]);
    mqttBroker.publish(`verdantiq/${selectedId}/rules/registered`, `Registered new automation rule: "${rule.name}"`, 'pub');
  }, [selectedId]);

  const handleToggleRule = useCallback((id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  }, []);

  const handleDeleteRule = useCallback((id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const handlePublishManualMessage = useCallback((topic: string, payload: string) => {
    mqttBroker.publish(topic, payload, 'pub');
  }, []);

  const handleClearConsole = useCallback(() => {
    mqttBroker.clearLog();
    setMqttMessages([]);
  }, []);

  const handleChangeWeather = useCallback((condition: Weather['condition']) => {
    let tempShift = 0;
    let humidityShift = 0;
    let lightShift = 0;

    switch (condition) {
      case 'sunny':
        tempShift = 3.5;
        humidityShift = -10;
        lightShift = 1000;
        break;
      case 'rainy':
        tempShift = -2.0;
        humidityShift = 25;
        lightShift = -1500;
        break;
      case 'stormy':
        tempShift = -4.5;
        humidityShift = 35;
        lightShift = -3000;
        break;
      case 'heatwave':
        tempShift = 8.0;
        humidityShift = -20;
        lightShift = 2500;
        break;
    }

    setWeather({ condition, tempShift, humidityShift, lightShift });
    mqttBroker.publish(`SYSTEM/WEATHER`, `External environment conditions set to: ${condition.toUpperCase()}`, 'pub');
  }, []);

  const handleChangeSensorStatus = useCallback((sensorName: keyof SensorTelemetry, status: SensorStatus) => {
    setGreenhouses(prev => prev.map(gh => {
      if (gh.id === selectedId) {
        return {
          ...gh,
          sensorStatus: {
            ...gh.sensorStatus,
            [sensorName]: status
          }
        };
      }
      return gh;
    }));
  }, [selectedId]);

  const handleInjectCrisis = useCallback((crisisType: 'drought' | 'freeze' | 'lockup') => {
    setGreenhouses(prev => prev.map(gh => {
      if (gh.id === selectedId) {
        if (crisisType === 'drought') {
          // Drain reservoir, inject heatwave, empty tank
          handleChangeWeather('heatwave');
          return {
            ...gh,
            sensors: {
              ...gh.sensors,
              soilMoisture: 25.0,
              waterLevel: 0.0,
            }
          };
        } else if (crisisType === 'freeze') {
          // Freezes temperature probe at 10 degrees, forces frost, drops weather to storm
          handleChangeWeather('stormy');
          return {
            ...gh,
            sensorStatus: {
              ...gh.sensorStatus,
              temperature: 'frozen',
            },
            sensors: {
              ...gh.sensors,
              temperature: 8.5,
            }
          };
        } else if (crisisType === 'lockup') {
          // Lock soil moisture probe at 55% wetness, hide dehydration
          return {
            ...gh,
            sensorStatus: {
              ...gh.sensorStatus,
              soilMoisture: 'frozen',
            },
            sensors: {
              ...gh.sensors,
              soilMoisture: 55.0,
            }
          };
        }
      }
      return gh;
    }));
    mqttBroker.publish(`verdantiq/${selectedId}/anomalies/crisis`, `WARNING: Scenario simulation [${crisisType.toUpperCase()}] injected!`, 'pub');
  }, [selectedId, handleChangeWeather]);

  const handleResetAnomalies = useCallback(() => {
    setGreenhouses(prev => prev.map(gh => {
      if (gh.id === selectedId) {
        return {
          ...gh,
          sensorStatus: {
            temperature: 'online',
            humidity: 'online',
            soilMoisture: 'online',
            co2: 'online',
            light: 'online',
            waterLevel: 'online',
          },
          alerts: []
        };
      }
      return gh;
    }));
    mqttBroker.publish(`verdantiq/${selectedId}/anomalies/clear`, `Reset all hardware elements to nominal. Status: ONLINE.`, 'pub');
  }, [selectedId]);

  // 7. Active Greenhouse Data
  const currentGreenhouse = greenhouses.find(g => g.id === selectedId) || greenhouses[0];

  return (
    <div style={styles.appContainer}>
      {/* Sidebar Navigation */}
      <Sidebar 
        greenhouses={greenhouses}
        selectedId={selectedId}
        onSelectGreenhouse={setSelectedId}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        weather={weather}
        onTriggerWeatherChange={() => {
          const nexts: Weather['condition'][] = ['sunny', 'rainy', 'stormy', 'heatwave'];
          const idx = nexts.indexOf(weather.condition);
          const nextCond = nexts[(idx + 1) % nexts.length];
          handleChangeWeather(nextCond);
        }}
        onRefillWater={handleRefillWater}
      />

      {/* Main Panel Content Area */}
      <main style={styles.mainContent}>
        {/* Top Control Bar */}
        <header style={styles.header}>
          <div style={styles.headerTitleGroup}>
            <span style={styles.headerBadge}>AGRITECH PLATFORM</span>
            <h2 style={styles.headerTitle}>{currentGreenhouse.name} Dashboard</h2>
          </div>

          <div style={styles.headerStatusRow}>
            {/* Day / Night Indicator */}
            <div style={styles.cycleIndicator} title="Simulated Solar Cycle. Cycles every 60s.">
              {daytime ? (
                <>
                  <Sun size={16} color="var(--color-light)" />
                  <span style={{ color: 'var(--color-light)' }}>DAYTIME</span>
                </>
              ) : (
                <>
                  <Moon size={16} color="#93c5fd" />
                  <span style={{ color: '#93c5fd' }}>NIGHTTIME</span>
                </>
              )}
              {/* Dial percentage */}
              <span style={styles.cycleProgressText}>{Math.floor((dayCycleProgress / 60) * 100)}%</span>
            </div>

            {/* Quality badge summary */}
            <div style={styles.qualitySummaryBadge}>
              <span>System Health:</span>
              <strong style={{ color: currentGreenhouse.healthScore > 80 ? 'var(--color-emerald)' : 'var(--color-temp)' }}>
                {currentGreenhouse.healthScore}%
              </strong>
            </div>
          </div>
        </header>

        {/* Dynamic Panels */}
        <section style={styles.tabContent}>
          {activeTab === 'overview' && (
            <DigitalTwin greenhouse={currentGreenhouse} />
          )}

          {activeTab === 'controls' && (
            <ControlCenter 
              greenhouse={currentGreenhouse}
              onToggleActuator={handleToggleActuator}
              onEmergencyStop={handleEmergencyStop}
            />
          )}

          {activeTab === 'rules' && (
            <RuleBuilder 
              greenhouse={currentGreenhouse}
              rules={rules.filter(r => r.greenhouseId === selectedId)}
              onAddRule={handleAddRule}
              onToggleRule={handleToggleRule}
              onDeleteRule={handleDeleteRule}
              triggeredAlerts={triggeredRuleNames}
            />
          )}

          {activeTab === 'mqtt' && (
            <MqttConsole 
              messages={mqttMessages}
              onPublishMessage={handlePublishManualMessage}
              onClearConsole={handleClearConsole}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPanel greenhouse={currentGreenhouse} />
          )}

          {activeTab === 'ai' && (
            <AiAdvisor greenhouse={currentGreenhouse} />
          )}

          {activeTab === 'scenarios' && (
            <ScenarioManager 
              greenhouse={currentGreenhouse}
              weather={weather}
              onChangeWeather={handleChangeWeather}
              onChangeSensorStatus={handleChangeSensorStatus}
              onInjectCrisis={handleInjectCrisis}
              onResetAnomalies={handleResetAnomalies}
            />
          )}
        </section>
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: 'flex',
    width: '100%',
    minHeight: '100vh',
    background: 'var(--bg-dark)',
  },
  mainContent: {
    flexGrow: 1,
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    height: '100vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '20px',
  },
  headerTitleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  headerBadge: {
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    color: 'var(--color-emerald)',
    fontWeight: '700',
    letterSpacing: '0.1em',
  },
  headerTitle: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.03em',
  },
  headerStatusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  cycleIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--glass-border)',
    padding: '8px 14px',
    borderRadius: '30px',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  cycleProgressText: {
    fontSize: '0.65rem',
    color: 'var(--text-dim)',
    marginLeft: '4px',
    borderLeft: '1px solid var(--glass-border)',
    paddingLeft: '6px',
  },
  qualitySummaryBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--glass-border)',
    padding: '8px 14px',
    borderRadius: '30px',
    fontSize: '0.75rem',
  },
  tabContent: {
    flexGrow: 1,
    display: 'flex',
  },
};
