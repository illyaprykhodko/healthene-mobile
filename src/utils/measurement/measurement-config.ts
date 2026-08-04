/**
 * Centralized measurement configuration
 * Maps measurement types to their metadata (fields, units, validation rules)
 */
// local dependencies
import type {
    MeasurementType,
    MeasurementConfig,
    MeasurementFieldConfig,
} from 'types/health';

/**
 * Measurement unit IDs from backend
 * These IDs match the database records for measurementUnit.id
 */
export const MEASUREMENT_UNIT_IDS = {
    // Blood Pressure
    SYSTOLIC_MMHG: 1,
    DIASTOLIC_MMHG: 2,

    // Weight
    POUNDS: 3,
    KILOGRAMS: 4,

    // Blood Glucose
    MMOL_L: 9,
    MG_DL: 10,

    // Temperature
    FAHRENHEIT: 21,
    CELSIUS: 22,

    // Heart Rate
    BPM: 23,

    // BMI
    BMI_UNIT: 24,

    // Oxygen
    PERCENT: 25,

    // Creatine & Potassium
    MEQL: 26, // mEq/L
    MICROMOL_L: 27, // μmol/L

    // Respiratory Rate
    BREATHS_PER_MIN: 28,

    // Hemoglobin A1C
    PERCENT_A1C: 29,
} as const;

/**
 * Complete configuration for each measurement type
 */
export const MEASUREMENT_CONFIG: Record<MeasurementType, MeasurementConfig> = {
    WEIGHT: {
        type: 'WEIGHT',
        fields: [
            {
                min: 50,
                max: 500,
                name: 'value',
                label: 'Weight',
                type: 'decimal',
                placeholder: '0.0',
            },
        ],
        units: [
            { id: MEASUREMENT_UNIT_IDS.POUNDS, name: 'lbs', symbol: 'lb' },
            { id: MEASUREMENT_UNIT_IDS.KILOGRAMS, name: 'kg', symbol: 'kg' },
        ],
        defaultUnit: 'lbs',
        maxDecimalPlaces: 1,
        supportsHealthApp: true,
    },

    BLOOD_PRESSURE: {
        type: 'BLOOD_PRESSURE',
        fields: [
            {
                min: 50,
                max: 250,
                type: 'number',
                name: 'systolic',
                label: 'Systolic',
                placeholder: '120',
            },
            {
                min: 30,
                max: 200,
                type: 'number',
                name: 'diastolic',
                label: 'Diastolic',
                placeholder: '80',
            },
        ],
        units: [
            { id: MEASUREMENT_UNIT_IDS.SYSTOLIC_MMHG, name: 'mmHg', symbol: 'mmHg' },
        ],
        defaultUnit: 'mmHg',
        maxDecimalPlaces: 0,
        supportsHealthApp: true,
    },

    BLOOD_GLUCOSE: {
        type: 'BLOOD_GLUCOSE',
        fields: [
            {
                min: 0,
                max: 30,
                name: 'value',
                type: 'decimal',
                placeholder: '5.5',
                label: 'Blood Glucose',
            },
        ],
        units: [
            { id: MEASUREMENT_UNIT_IDS.MMOL_L, name: 'mmol/L', symbol: 'mmol/L' },
            { id: MEASUREMENT_UNIT_IDS.MG_DL, name: 'mg/dL', symbol: 'mg/dL' },
        ],
        maxDecimalPlaces: 1,
        defaultUnit: 'mmol/L',
        supportsHealthApp: true,
        unitFieldOverrides: {
            'mmol/L': {
                value: { min: 0, max: 30, placeholder: '5.5' },
            },
            'mg/dL': {
                value: { min: 20, max: 600, placeholder: '100' },
            },
        },
    },

    TEMPERATURE: {
        type: 'TEMPERATURE',
        fields: [
            {
                min: 90,
                max: 110,
                name: 'value',
                type: 'decimal',
                placeholder: '98.6',
                label: 'Temperature',
            },
        ],
        units: [
            { id: MEASUREMENT_UNIT_IDS.FAHRENHEIT, name: '°F', symbol: '°F' },
            { id: MEASUREMENT_UNIT_IDS.CELSIUS, name: '°C', symbol: '°C' },
        ],
        defaultUnit: '°F',
        maxDecimalPlaces: 1,
        supportsHealthApp: false,
        unitFieldOverrides: {
            '°F': {
                value: { min: 90, max: 110, placeholder: '98.6' },
            },
            '°C': {
                value: { min: 30, max: 45, placeholder: '36.6' },
            },
        },
    },

    HEART_RATE: {
        type: 'HEART_RATE',
        fields: [
            {
                min: 30,
                max: 220,
                name: 'value',
                type: 'number',
                placeholder: '72',
                label: 'Heart Rate',
            },
        ],
        units: [
            { id: MEASUREMENT_UNIT_IDS.BPM, name: 'BPM', symbol: 'bpm' },
        ],
        defaultUnit: 'BPM',
        maxDecimalPlaces: 0,
        // NOTE no health-app path exists: neither service has a heart-rate fetcher, and
        // the read permission is not requested. Flip back only together with both.
        supportsHealthApp: false,
    },

    BMI: {
        type: 'BMI',
        fields: [
            {
                min: 10,
                max: 60,
                label: 'BMI',
                name: 'value',
                type: 'decimal',
                placeholder: '25.0',
            },
        ],
        units: [
            { id: MEASUREMENT_UNIT_IDS.BMI_UNIT, name: 'BMI', symbol: 'BMI' },
        ],
        defaultUnit: 'BMI',
        maxDecimalPlaces: 1,
        supportsHealthApp: false,
    },

    OXYGEN: {
        type: 'OXYGEN',
        fields: [
            {
                min: 70,
                max: 100,
                name: 'value',
                type: 'number',
                placeholder: '98',
                label: 'Oxygen Saturation',
            },
        ],
        units: [
            { id: MEASUREMENT_UNIT_IDS.PERCENT, name: '%', symbol: '%' },
        ],
        defaultUnit: '%',
        maxDecimalPlaces: 0,
        supportsHealthApp: false,
    },

    CREATINE: {
        type: 'CREATINE',
        fields: [
            {
                min: 20,
                max: 500,
                name: 'value',
                type: 'decimal',
                placeholder: '80',
                label: 'Creatinine',
            },
        ],
        units: [
            { id: MEASUREMENT_UNIT_IDS.MICROMOL_L, name: 'μmol/L', symbol: 'μmol/L' },
        ],
        maxDecimalPlaces: 0,
        defaultUnit: 'μmol/L',
        supportsHealthApp: false,
    },

    POTASSIUM: {
        type: 'POTASSIUM',
        fields: [
            {
                min: 2,
                max: 8,
                name: 'value',
                type: 'decimal',
                placeholder: '4.0',
                label: 'Potassium',
            },
        ],
        units: [
            { id: MEASUREMENT_UNIT_IDS.MEQL, name: 'mEq/L', symbol: 'mEq/L' },
        ],
        maxDecimalPlaces: 1,
        defaultUnit: 'mEq/L',
        supportsHealthApp: false,
    },

    STEPS: {
        type: 'STEPS',
        fields: [
            {
                min: 0,
                max: 100000,
                name: 'value',
                label: 'Steps',
                type: 'number',
                placeholder: '10000',
            },
        ],
        units: [
            { id: 1, name: 'steps', symbol: 'steps' },
        ],
        maxDecimalPlaces: 0,
        defaultUnit: 'steps',
        // NOTE steps reach the backend as activities (`useWalkingSession` → CMPedometer),
        // not as measurements. Importing them from the health app too would file the same
        // walk twice under different sources.
        supportsHealthApp: false,
    },

    RESPIRATORY_RATE: {
        type: 'RESPIRATORY_RATE',
        fields: [
            {
                min: 8,
                max: 60,
                name: 'value',
                type: 'number',
                placeholder: '16',
                label: 'Respiratory Rate',
            },
        ],
        units: [
            { id: MEASUREMENT_UNIT_IDS.BREATHS_PER_MIN, name: 'breaths/min', symbol: 'br/min' },
        ],
        defaultUnit: 'breaths/min',
        supportsHealthApp: false,
        maxDecimalPlaces: 0,
    },

    HEMOGLOBIN: {
        type: 'HEMOGLOBIN',
        fields: [
            {
                min: 3,
                max: 15,
                name: 'value',
                type: 'decimal',
                placeholder: '5.5',
                label: 'Hemoglobin A1C',
            },
        ],
        units: [
            { id: MEASUREMENT_UNIT_IDS.PERCENT_A1C, name: '%', symbol: '%' },
        ],
        defaultUnit: '%',
        maxDecimalPlaces: 1,
        supportsHealthApp: false,
    },

    HEIGHT: {
        type: 'HEIGHT',
        fields: [
            {
                min: 60,
                max: 240,
                name: 'value',
                label: 'Height',
                type: 'decimal',
                placeholder: '170',
            },
        ],
        units: [
            // TODO: confirm CENTIMETERS unit ID with backend (no entry in measurementUnit table yet)
            { id: 2, name: 'centimeters', symbol: 'cm' },
        ],
        maxDecimalPlaces: 1,
        supportsHealthApp: false,
        defaultUnit: 'centimeters',
    },
};

/**
 * Get configuration for a specific measurement type
 */
export const getMeasurementConfig = (type: MeasurementType): MeasurementConfig => {
    const config = MEASUREMENT_CONFIG[type];
    if (!config) {
        throw new Error(`Unknown measurement type: ${type}`);
    }
    return config;
};

/**
 * Resolve field config with unit-specific overrides (min/max/placeholder).
 */
export const getResolvedMeasurementField = (
    type: MeasurementType,
    field: MeasurementFieldConfig,
    unitName?: string,
): MeasurementFieldConfig => {
    const config = getMeasurementConfig(type);
    const effectiveUnit = unitName || config.defaultUnit;
    const override = config.unitFieldOverrides?.[effectiveUnit]?.[field.name];
    if (!override) {
        return field;
    }
    return {
        ...field,
        ...override,
    };
};

/**
 * Get unit ID for a given measurement type and unit name
 */
export const getUnitId = (type: MeasurementType, unitName: string): number => {
    const config = getMeasurementConfig(type);
    const unit = config.units.find(u => u.name === unitName);
    if (!unit) {
        throw new Error(`Unknown unit "${unitName}" for measurement type "${type}"`);
    }
    return unit.id;
};

/**
 * Check if a measurement type supports health app integration
 */
export const supportsHealthApp = (type: MeasurementType): boolean => {
    return getMeasurementConfig(type).supportsHealthApp;
};

