import type { Greenhouse, Weather, HistoricalTelemetry, SensorTelemetry } from '../types';
import { CROP_PROFILES } from '../types';

export class SimulationEngine {
  // Generate a mock 24-hour dataset for "Yesterday" chart comparisons
  public static generateYesterdayData(cropType: Greenhouse['crop']): HistoricalTelemetry[] {
    const data: HistoricalTelemetry[] = [];
    const thresholds = CROP_PROFILES[cropType];
    const avgTemp = (thresholds.tempMin + thresholds.tempMax) / 2;
    const avgHumid = (thresholds.humidMin + thresholds.humidMax) / 2;
    const avgSoil = (thresholds.soilMin + thresholds.soilMax) / 2;

    for (let hour = 0; hour < 24; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      
      // Sinusoidal day/night fluctuations
      const tempSin = Math.sin((hour - 8) * Math.PI / 12); // peak at 14:00 (hour 14)
      const lightSin = Math.max(0, Math.sin((hour - 6) * Math.PI / 12)); // day between 6:00 and 18:00
      
      data.push({
        timestamp: timeStr,
        temperature: parseFloat((avgTemp + tempSin * 4 + (Math.random() - 0.5)).toFixed(1)),
        humidity: parseFloat((avgHumid - tempSin * 10 + (Math.random() - 0.5) * 2).toFixed(1)),
        soilMoisture: parseFloat((avgSoil - (hour * 0.4) % 15 + (Math.random() - 0.5)).toFixed(1)),
        co2: parseFloat((550 - lightSin * 150 + (Math.random() - 0.5) * 10).toFixed(0)),
        light: parseFloat((lightSin * 5000 + (Math.random() - 0.5) * 100).toFixed(0)),
        waterLevel: parseFloat((90 - (hour * 0.8)).toFixed(1)),
      });
    }

    return data;
  }

  // Set up an initial default state for a greenhouse
  public static initializeGreenhouse(id: string, name: string, crop: Greenhouse['crop']): Greenhouse {
    const thresholds = CROP_PROFILES[crop];
    
    const initialSensors: SensorTelemetry = {
      temperature: (thresholds.tempMin + thresholds.tempMax) / 2,
      humidity: (thresholds.humidMin + thresholds.humidMax) / 2,
      soilMoisture: (thresholds.soilMin + thresholds.soilMax) / 2,
      co2: 500,
      light: 2000,
      waterLevel: 85.5,
    };

    const initialHistory: HistoricalTelemetry[] = [];
    const now = new Date();
    // Populate last 20 ticks of mock "Today" history so chart is pre-populated
    for (let i = 20; i >= 1; i--) {
      const pastTime = new Date(now.getTime() - i * 5000);
      const timeStr = pastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      initialHistory.push({
        timestamp: timeStr,
        ...initialSensors,
        temperature: initialSensors.temperature + (Math.random() - 0.5) * 2,
        humidity: initialSensors.humidity + (Math.random() - 0.5) * 4,
        soilMoisture: initialSensors.soilMoisture + (Math.random() - 0.5) * 1,
      });
    }

    return {
      id,
      name,
      crop,
      growthStage: 'Seedling',
      growthProgress: 5.0,
      healthScore: 100.0,
      sensors: initialSensors,
      actuators: {
        heater: false,
        cooler: false,
        humidifier: false,
        ventilator: false,
        irrigation: false,
        growLights: false,
      },
      sensorStatus: {
        temperature: 'online',
        humidity: 'online',
        soilMoisture: 'online',
        co2: 'online',
        light: 'online',
        waterLevel: 'online',
      },
      historicalData: initialHistory,
      yesterdayData: this.generateYesterdayData(crop),
      alerts: [],
    };
  }

  // Core physics tick calculation
  public static tick(
    greenhouse: Greenhouse,
    weather: Weather,
    daytime: boolean
  ): Greenhouse {
    const updated = JSON.parse(JSON.stringify(greenhouse)) as Greenhouse;
    const cropThresholds = CROP_PROFILES[updated.crop];

    // Determine ambient values based on daytime and weather shifts
    const ambientTemp = 20 + weather.tempShift + (daytime ? 4 : -4);
    const ambientHumid = 55 + weather.humidityShift;
    const ambientLight = daytime ? (weather.condition === 'sunny' ? 5000 : weather.condition === 'heatwave' ? 7000 : 1500) + weather.lightShift : 10;
    const ambientCo2 = 400; // standard atmospheric CO2

    // --- PHYSICS ENGINE ---

    // 1. Temperature Simulation
    let temp = updated.sensors.temperature;
    if (updated.sensorStatus.temperature === 'online') {
      // Natural thermal drift to outdoor ambient temperature
      temp += (ambientTemp - temp) * 0.05;
      // Solar radiation warming
      if (daytime) {
        temp += (ambientLight / 5000) * 0.1;
      }
      // Actuator reactions
      if (updated.actuators.heater) temp += 0.8;
      if (updated.actuators.cooler) temp -= 0.6;
      if (updated.actuators.ventilator) temp += (ambientTemp - temp) * 0.15; // faster exchange
      temp = parseFloat(temp.toFixed(1));
    }

    // 2. Humidity Simulation
    let humid = updated.sensors.humidity;
    if (updated.sensorStatus.humidity === 'online') {
      // Natural plant transpiration and moisture evaporation
      humid += 0.15;
      // Drift to outdoor ambient
      humid += (ambientHumid - humid) * 0.02;
      // Actuators
      if (updated.actuators.humidifier) humid += 1.2;
      if (updated.actuators.ventilator) humid += (ambientHumid - humid) * 0.12;
      // Cap at 100% and floor at 10%
      humid = Math.min(100, Math.max(10, parseFloat(humid.toFixed(1))));
    }

    // 3. Soil Moisture Simulation
    let soil = updated.sensors.soilMoisture;
    if (updated.sensorStatus.soilMoisture === 'online') {
      // Natural absorption/drinking by plants (faster if hot or mature)
      const stageFactor = updated.growthStage === 'Mature' ? 0.25 : updated.growthStage === 'Flowering' ? 0.2 : updated.growthStage === 'Vegetative' ? 0.15 : 0.08;
      const evapFactor = Math.max(0, (temp - 15) * 0.005);
      soil -= (stageFactor + evapFactor);
      
      // Actuators (Irrigation raises it only if tank is not empty)
      if (updated.actuators.irrigation && updated.sensors.waterLevel > 0) {
        soil += 4.5;
      }
      soil = Math.min(100, Math.max(0, parseFloat(soil.toFixed(1))));
    }

    // 4. CO₂ Level Simulation
    let co2 = updated.sensors.co2;
    if (updated.sensorStatus.co2 === 'online') {
      if (daytime && ambientLight > 500) {
        // Photosynthesis absorbs CO2
        const drawFactor = updated.growthStage === 'Mature' ? 3.0 : 1.5;
        co2 -= drawFactor;
      } else {
        // Plant respiration releases minor CO2
        co2 += 0.5;
      }
      // Drift to ambient atmosphere
      co2 += (ambientCo2 - co2) * 0.01;
      // Actuator (Ventilation brings it to outdoor ambient quickly)
      if (updated.actuators.ventilator) {
        co2 += (ambientCo2 - co2) * 0.18;
      }
      co2 = Math.max(200, parseFloat(co2.toFixed(0)));
    }

    // 5. Light Level Simulation
    let light = updated.sensors.light;
    if (updated.sensorStatus.light === 'online') {
      light = ambientLight;
      if (updated.actuators.growLights) {
        light += 2500; // Grow lamps add light
      }
      light = Math.max(0, parseFloat(light.toFixed(0)));
    }

    // 6. Water Tank Level Simulation
    let water = updated.sensors.waterLevel;
    if (updated.sensorStatus.waterLevel === 'online') {
      if (updated.actuators.irrigation) {
        water -= 2.0; // Irrigation consumes tank water
      }
      // Rain harvesting
      if (weather.condition === 'rainy') {
        water += 0.4;
      } else if (weather.condition === 'stormy') {
        water += 1.0;
      }
      water = Math.min(100, Math.max(0, parseFloat(water.toFixed(1))));
    }

    // Auto-shutoff irrigation if tank is dry
    if (water <= 0 && updated.actuators.irrigation) {
      updated.actuators.irrigation = false;
      this.addAlert(updated, 'danger', 'Water tank empty! Automatic irrigation suspended.');
    }

    // Apply Sensor Failure Modes (for testing system resilience)
    updated.sensors.temperature = this.applySensorFailure(temp, updated.sensorStatus.temperature, 22);
    updated.sensors.humidity = this.applySensorFailure(humid, updated.sensorStatus.humidity, 60);
    updated.sensors.soilMoisture = this.applySensorFailure(soil, updated.sensorStatus.soilMoisture, 55);
    updated.sensors.co2 = this.applySensorFailure(co2, updated.sensorStatus.co2, 450);
    updated.sensors.light = this.applySensorFailure(light, updated.sensorStatus.light, 2000);
    updated.sensors.waterLevel = this.applySensorFailure(water, updated.sensorStatus.waterLevel, 80);

    // --- CROP HEALTH & DIGITAL TWIN GROWTH SIMULATION ---
    
    // Evaluate anomalies & calculate stress levels
    let stressScore = 0;
    
    // Evaluate sensors only if they are reporting online
    if (updated.sensorStatus.temperature === 'online') {
      if (updated.sensors.temperature < cropThresholds.tempMin) {
        stressScore += (cropThresholds.tempMin - updated.sensors.temperature) * 1.5;
      } else if (updated.sensors.temperature > cropThresholds.tempMax) {
        stressScore += (updated.sensors.temperature - cropThresholds.tempMax) * 1.5;
      }
    }
    
    if (updated.sensorStatus.humidity === 'online') {
      if (updated.sensors.humidity < cropThresholds.humidMin) {
        stressScore += (cropThresholds.humidMin - updated.sensors.humidity) * 0.5;
      } else if (updated.sensors.humidity > cropThresholds.humidMax) {
        stressScore += (updated.sensors.humidity - cropThresholds.humidMax) * 0.5;
      }
    }

    if (updated.sensorStatus.soilMoisture === 'online') {
      if (updated.sensors.soilMoisture < cropThresholds.soilMin) {
        stressScore += (cropThresholds.soilMin - updated.sensors.soilMoisture) * 2.0; // highly critical
      } else if (updated.sensors.soilMoisture > cropThresholds.soilMax) {
        stressScore += (updated.sensors.soilMoisture - cropThresholds.soilMax) * 1.0;
      }
    }

    // Update Health Score based on Stress
    let health = updated.healthScore;
    if (stressScore > 0) {
      health -= (stressScore * 0.05); // degrade health
      if (stressScore > 10) {
        this.addAlert(updated, 'warning', `Plant environment stress is high! Check optimal settings.`);
      }
    } else {
      health += 0.3; // recover health
    }
    updated.healthScore = Math.min(100, Math.max(0, parseFloat(health.toFixed(1))));

    // Plant Growth Progress (only grows if health is good and light is sufficient)
    let progress = updated.growthProgress;
    const isHealthy = updated.healthScore > 60;
    const hasLight = updated.sensors.light > 800;
    
    if (isHealthy && hasLight) {
      const baseGrowth = 0.08;
      const healthMultiplier = updated.healthScore / 100;
      progress += baseGrowth * healthMultiplier;
    } else if (!isHealthy) {
      progress -= 0.02; // Stunted or decaying
    }

    updated.growthProgress = Math.min(100, Math.max(0, parseFloat(progress.toFixed(2))));

    // Determine Stage
    if (updated.growthProgress < 25) {
      updated.growthStage = 'Seedling';
    } else if (updated.growthProgress < 55) {
      updated.growthStage = 'Vegetative';
    } else if (updated.growthProgress < 80) {
      updated.growthStage = 'Flowering';
    } else {
      updated.growthStage = 'Mature';
    }

    // --- ALERT HANDLING ---
    this.checkForSensorFailuresAlerts(updated);

    // --- HISTORICAL TREND LOGGER ---
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updated.historicalData.push({
      timestamp: timestampStr,
      temperature: updated.sensors.temperature,
      humidity: updated.sensors.humidity,
      soilMoisture: updated.sensors.soilMoisture,
      co2: updated.sensors.co2,
      light: updated.sensors.light,
      waterLevel: updated.sensors.waterLevel,
    });

    if (updated.historicalData.length > 30) {
      updated.historicalData.shift(); // keep sliding window of last 30 data points
    }

    return updated;
  }

  private static applySensorFailure(val: number, status: string, backup: number): number {
    switch (status) {
      case 'offline':
        return 0; // sensor dead
      case 'frozen':
        return backup; // static locked value
      case 'erratic':
        // add large random noise
        const noise = (Math.random() - 0.5) * (val * 0.4);
        return parseFloat((val + noise).toFixed(1));
      case 'online':
      default:
        return val;
    }
  }

  private static addAlert(gh: Greenhouse, severity: 'warning' | 'danger', message: string): void {
    // Prevent duplicate active alerts
    const exists = gh.alerts.some(a => a.active && a.message === message);
    if (!exists) {
      gh.alerts.push({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity,
        message,
        active: true,
      });
    }
  }

  private static checkForSensorFailuresAlerts(gh: Greenhouse): void {
    Object.entries(gh.sensorStatus).forEach(([sensorName, status]) => {
      if (status !== 'online') {
        this.addAlert(
          gh,
          status === 'offline' ? 'danger' : 'warning',
          `Sensor [${sensorName.toUpperCase()}] is reporting status: ${status.toUpperCase()}!`
        );
      }
    });
  }
}
