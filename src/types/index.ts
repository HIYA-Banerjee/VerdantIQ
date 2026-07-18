export type GrowthStage = 'Seedling' | 'Vegetative' | 'Flowering' | 'Mature';
export type SensorStatus = 'online' | 'offline' | 'erratic' | 'frozen';
export type WeatherCondition = 'sunny' | 'rainy' | 'stormy' | 'heatwave';

export interface SensorTelemetry {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  co2: number;
  light: number;
  waterLevel: number;
}

export interface ActuatorState {
  heater: boolean;
  cooler: boolean;
  humidifier: boolean;
  ventilator: boolean;
  irrigation: boolean;
  growLights: boolean;
}

export interface HistoricalTelemetry extends SensorTelemetry {
  timestamp: string;
}

export interface SystemAlert {
  id: string;
  timestamp: string;
  severity: 'warning' | 'danger';
  message: string;
  active: boolean;
}

export interface Greenhouse {
  id: string;
  name: string;
  crop: 'Tomato' | 'Lettuce' | 'Strawberry';
  growthStage: GrowthStage;
  growthProgress: number; // 0 - 100
  healthScore: number; // 0 - 100
  sensors: SensorTelemetry;
  actuators: ActuatorState;
  sensorStatus: Record<keyof SensorTelemetry, SensorStatus>;
  historicalData: HistoricalTelemetry[];
  yesterdayData: HistoricalTelemetry[];
  alerts: SystemAlert[];
}

export interface MQTTMessage {
  id: string;
  timestamp: string;
  topic: string;
  payload: string;
  type: 'pub' | 'sub';
}

export interface AutomationRule {
  id: string;
  name: string;
  sensor: keyof SensorTelemetry;
  operator: 'less' | 'greater';
  value: number;
  actuator: keyof ActuatorState;
  action: 'ON' | 'OFF';
  active: boolean;
}

export interface Weather {
  condition: WeatherCondition;
  tempShift: number;
  humidityShift: number;
  lightShift: number;
}

export interface CropThresholds {
  tempMin: number;
  tempMax: number;
  humidMin: number;
  humidMax: number;
  soilMin: number;
  soilMax: number;
  co2Min: number;
  lightMin: number;
}

export const CROP_PROFILES: Record<Greenhouse['crop'], CropThresholds> = {
  Tomato: {
    tempMin: 18,
    tempMax: 26,
    humidMin: 50,
    humidMax: 70,
    soilMin: 40,
    soilMax: 70,
    co2Min: 600,
    lightMin: 3000,
  },
  Lettuce: {
    tempMin: 15,
    tempMax: 22,
    humidMin: 60,
    humidMax: 80,
    soilMin: 50,
    soilMax: 80,
    co2Min: 500,
    lightMin: 1500,
  },
  Strawberry: {
    tempMin: 16,
    tempMax: 24,
    humidMin: 55,
    humidMax: 75,
    soilMin: 45,
    soilMax: 75,
    co2Min: 700,
    lightMin: 2500,
  },
};
