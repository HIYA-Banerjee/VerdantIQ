import React from 'react';
import { 
  Sprout, 
  Cpu, 
  Terminal, 
  Sliders, 
  BarChart3, 
  MessageSquareCode, 
  CloudSun, 
  RefreshCw,
  LayoutDashboard,
  ShieldAlert
} from 'lucide-react';
import type { Greenhouse, Weather } from '../types';

interface SidebarProps {
  greenhouses: Greenhouse[];
  selectedId: string;
  onSelectGreenhouse: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  weather: Weather;
  onTriggerWeatherChange: () => void;
  onRefillWater: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  greenhouses,
  selectedId,
  onSelectGreenhouse,
  activeTab,
  setActiveTab,
  weather,
  onTriggerWeatherChange,
  onRefillWater,
}) => {
  const currentGh = greenhouses.find(g => g.id === selectedId);

  const menuItems = [
    { id: 'overview', name: 'Digital Twin', icon: LayoutDashboard },
    { id: 'controls', name: 'Control Center', icon: Sliders },
    { id: 'rules', name: 'Automation Rules', icon: Cpu },
    { id: 'mqtt', name: 'MQTT Terminal', icon: Terminal },
    { id: 'analytics', name: 'Analytics Trends', icon: BarChart3 },
    { id: 'ai', name: 'AI Advisor', icon: MessageSquareCode },
    { id: 'scenarios', name: 'Fault Injector', icon: ShieldAlert },
  ];

  const getWeatherIcon = (cond: Weather['condition']) => {
    switch (cond) {
      case 'sunny': return '☀️';
      case 'rainy': return '🌧️';
      case 'stormy': return '⛈️';
      case 'heatwave': return '🔥';
    }
  };

  const getHealthColor = (score: number) => {
    if (score > 80) return '#10b981'; // Green
    if (score > 50) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brand}>
        <span style={styles.brandIcon}>🌿</span>
        <div>
          <h1 style={styles.brandName}>VerdantIQ</h1>
          <span style={styles.tagline}>IoT digital twin platform</span>
        </div>
      </div>

      {/* Greenhouse Switcher */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Greenhouse Nodes</div>
        <div style={styles.nodesList}>
          {greenhouses.map((gh) => {
            const isSelected = gh.id === selectedId;
            const healthColor = getHealthColor(gh.healthScore);
            return (
              <button
                key={gh.id}
                onClick={() => onSelectGreenhouse(gh.id)}
                style={{
                  ...styles.nodeButton,
                  ...(isSelected ? styles.nodeActive : {}),
                }}
              >
                <div style={styles.nodeMeta}>
                  <Sprout size={16} color={isSelected ? '#10b981' : '#9ca3af'} />
                  <div style={styles.nodeDetails}>
                    <div style={styles.nodeName}>{gh.name}</div>
                    <div style={styles.nodeCrop}>{gh.crop} • {gh.growthStage}</div>
                  </div>
                </div>
                <div style={styles.nodeHealthWrapper}>
                  <div 
                    style={{
                      ...styles.nodeHealthDot,
                      backgroundColor: healthColor,
                      boxShadow: `0 0 8px ${healthColor}`
                    }} 
                  />
                  <span style={styles.nodeHealthVal}>{gh.healthScore}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Navigation */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Dashboard Tabs</div>
        <nav style={styles.nav}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  ...styles.navButton,
                  ...(isActive ? styles.navActive : {}),
                }}
              >
                <Icon size={18} style={isActive ? styles.navIconActive : styles.navIcon} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Environment / Weather Widget */}
      <div style={{ ...styles.section, marginTop: 'auto' }}>
        <div style={styles.weatherCard}>
          <div style={styles.weatherHeader}>
            <CloudSun size={18} color="#0ea5e9" />
            <span>Outdoor Ambient</span>
          </div>
          <div style={styles.weatherContent}>
            <div style={styles.weatherTemp}>
              <span style={styles.weatherEmoji}>{getWeatherIcon(weather.condition)}</span>
              <div>
                <div style={styles.weatherCondition}>{weather.condition.toUpperCase()}</div>
                <div style={styles.weatherDegree}>
                  {(20 + weather.tempShift).toFixed(1)}°C
                </div>
              </div>
            </div>
            <button 
              onClick={onTriggerWeatherChange}
              title="Trigger Weather Event"
              style={styles.weatherCycleBtn}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Refill Water Quick Action */}
      {currentGh && (
        <div style={styles.quickActions}>
          <button 
            onClick={onRefillWater} 
            disabled={currentGh.sensors.waterLevel >= 100}
            style={styles.refillBtn}
          >
            <RefreshCw size={14} style={{ marginRight: '6px' }} />
            Refill Water Reservoir
          </button>
        </div>
      )}
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 'var(--sidebar-width)',
    flexShrink: 0,
    background: '#04070d',
    borderRight: '1px solid var(--glass-border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    height: '100vh',
    overflowY: 'auto',
    position: 'sticky',
    top: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
    paddingLeft: '8px',
  },
  brandIcon: {
    fontSize: '2rem',
  },
  brandName: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#fff',
    lineHeight: '1.2',
    background: 'linear-gradient(to right, #10b981, #3b82f6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  tagline: {
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    color: 'var(--text-dim)',
    letterSpacing: '0.05em',
    fontWeight: '600',
  },
  section: {
    marginBottom: '24px',
  },
  sectionHeader: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: '0.05em',
    paddingLeft: '8px',
    marginBottom: '10px',
  },
  nodesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  nodeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    background: 'transparent',
    border: '1px solid transparent',
    color: 'var(--text-muted)',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  nodeActive: {
    background: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    color: '#fff',
  },
  nodeMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  nodeDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  nodeName: {
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  nodeCrop: {
    fontSize: '0.7rem',
    color: 'var(--text-dim)',
  },
  nodeHealthWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  nodeHealthDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  nodeHealthVal: {
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    textAlign: 'left',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
  },
  navActive: {
    background: 'rgba(255, 255, 255, 0.04)',
    color: 'var(--color-emerald)',
    fontWeight: '600',
  },
  navIcon: {
    color: 'var(--text-muted)',
  },
  navIconActive: {
    color: 'var(--color-emerald)',
  },
  weatherCard: {
    background: 'rgba(15, 23, 42, 0.45)',
    border: '1px solid var(--glass-border)',
    borderRadius: '12px',
    padding: '14px',
  },
  weatherHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
    marginBottom: '8px',
  },
  weatherContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weatherTemp: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  weatherEmoji: {
    fontSize: '1.4rem',
  },
  weatherCondition: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'var(--text-dim)',
  },
  weatherDegree: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#fff',
  },
  weatherCycleBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
  },
  quickActions: {
    marginTop: '16px',
  },
  refillBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(14, 165, 233, 0.1)',
    border: '1px solid rgba(14, 165, 233, 0.3)',
    color: '#0ea5e9',
    fontSize: '0.75rem',
    padding: '10px',
    borderRadius: '8px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
};
