/**
 * Health Integration Types
 * Unified types for Apple Health, Google Fit, and manual measurements
 */

export type MeasurementSource = 'APPLE_HEALTH' | 'GOOGLE_FIT' | 'HEALTHENE_MANUAL_INPUT';

export type MeasurementType =
  | 'BMI'
  | 'STEPS'
  | 'WEIGHT'
  | 'OXYGEN'
  | 'CREATINE'
  | 'POTASSIUM'
  | 'HEART_RATE'
  | 'HEMOGLOBIN'
  | 'TEMPERATURE'
  | 'BLOOD_GLUCOSE'
  | 'BLOOD_PRESSURE'
  | 'RESPIRATORY_RATE'
  ;

export interface DateRange {
  startDate: string; // ISO string
  endDate: string;   // ISO string
}

/**
 * Normalized health sample format (platform-agnostic)
 */
export interface HealthSample {
  value: number | BloodPressureValue;
  startDate: string;
  endDate: string;
  source?: MeasurementSource;
}

export interface BloodPressureValue {
  systolic: number;
  diastolic: number;
}

/**
 * Health service interface (implemented by AppleHealth and GoogleFit)
 */
export interface IHealthService {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  fetchSamples(type: MeasurementType, dateRange: DateRange): Promise<HealthSample[]>;
}

/**
 * Measurement unit configuration
 */
export interface MeasurementUnit {
  id: number;
  name: string;
  symbol?: string;
  unitType?: string;
}

/**
 * Field configuration for dynamic form rendering
 */
export interface MeasurementFieldConfig {
  name: string;
  label: string;
  min?: number;
  max?: number;
  placeholder?: string;
  type: 'number' | 'decimal';
}

/**
 * Complete measurement configuration
 */
export interface MeasurementConfig {
  defaultUnit: string;
  type: MeasurementType;
  units: MeasurementUnit[];
  maxDecimalPlaces?: number;
  supportsHealthApp: boolean; // Can fetch from HealthKit/GoogleFit
  fields: MeasurementFieldConfig[];
}

/**
 * Payload structure for backend API
 * Based on legacy prepareData/prepareOtherData format
 */
export interface MeasurementPayload {
  type: MeasurementType;
  source: MeasurementSource;
  measurements: Array<{
    values: Array<{
      value: number;
      measurementUnit: { id: number };
    }>;
    startDate: string;
    endDate: string;
  }>;
}

/**
 * BLE Smart Scale specific types
 */
export interface SmartScaleReading {
  weight: number; // in lbs
  complete: boolean; // measurement stabilized
  timestamp: string;
}

export interface BLEDevice {
  id: string;
  rssi: number;
  name: string | null;
  manufacturerData?: string; // base64 encoded
}

/**
 * BLE Permission/Power Status
 * Note: Use State from react-native-ble-plx directly
 * This enum is kept for backward compatibility
 */
export enum BLEPermissionStatus {
  UNKNOWN = 'Unknown',
  GRANTED = 'PoweredOn',
  DENIED = 'Unauthorized',
  DISABLED = 'PoweredOff',
  RESETTING = 'Resetting',
  UNSUPPORTED = 'Unsupported',
}
