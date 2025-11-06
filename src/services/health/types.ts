// Health integration types for measurements

export type MeasurementType =
  | 'WEIGHT'
  | 'BLOOD_PRESSURE'
  | 'BLOOD_GLUCOSE'
  | 'TEMPERATURE'
  | 'HEART_RATE'
  | 'STEPS';

export type HealthDataSource =
  | 'APPLE_HEALTH'
  | 'GOOGLE_FIT'
  | 'HEALTHENE_MANUAL_INPUT';

export interface DateRange {
  startDate: string; // ISO string
  endDate: string;   // ISO string
}

export interface HealthSample {
  value: number | BloodPressureValue;
  startDate: string;
  endDate: string;
  source?: HealthDataSource;
}

export interface BloodPressureValue {
  systolic: number;
  diastolic: number;
}

export interface HealthPermissions {
  granted: boolean;
  canRequestAgain: boolean;
}

export interface HealthServiceAdapter {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<HealthPermissions>;
  fetchSamples(type: MeasurementType, dateRange: DateRange): Promise<HealthSample[]>;
}

// Measurement unit definition
export interface MeasurementUnit {
  id: number;
  name: string;
  symbol?: string;
}

// Payload for backend API
export interface MeasurementRecordPayload {
  type: MeasurementType;
  source: HealthDataSource;
  measurements: Array<{
    startDate: string;
    endDate: string;
    values: Array<{
      value: number;
      measurementUnit: { id: number };
    }>;
  }>;
}

// BLE Smart Scale specific
export interface BLEWeightUpdate {
  weight: number; // in lbs
  complete: boolean; // measurement finalized
}

export interface BLEDevice {
  id: string;
  name: string | null;
  manufacturerData?: string; // base64
}

