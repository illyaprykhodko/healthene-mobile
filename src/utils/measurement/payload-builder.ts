/**
 * Measurement Payload Builder
 * Converts form values to backend API format
 */
// outsource dependencies
import moment from 'moment';
// local dependencies
import type {
    HealthSample,
    MeasurementType,
    MeasurementSource,
    MeasurementPayload,
} from 'types/health';
import { getMeasurementConfig, getUnitId, MEASUREMENT_UNIT_IDS } from './measurement-config';

/**
 * Build payload for manual measurement input
 */
export const buildManualPayload = (
    type: MeasurementType,
    values: Record<string, any>,
    unitName?: string
): MeasurementPayload => {
    const config = getMeasurementConfig(type);
    const now = moment().format();

    // Special handling for Blood Pressure (multiple values)
    if (type === 'BLOOD_PRESSURE') {
        return {
            type,
            source: 'HEALTHENE_MANUAL_INPUT',
            measurements: [
                {
                    values: [
                        {
                            measurementUnit: { id: MEASUREMENT_UNIT_IDS.SYSTOLIC_MMHG },
                            value: parseFloat(String(values.systolic).replace(',', '.')),
                        },
                        {
                            measurementUnit: { id: MEASUREMENT_UNIT_IDS.DIASTOLIC_MMHG },
                            value: parseFloat(String(values.diastolic).replace(',', '.')),
                        },
                    ],
                    endDate: now,
                    startDate: now,
                },
            ],
        };
    }

    // Single value measurements (Weight, Blood Glucose, etc.)
    const selectedUnitName = unitName || config.defaultUnit;
    const unitId = getUnitId(type, selectedUnitName);
    const value = parseFloat(String(values.value).replace(',', '.'));

    return {
        type,
        source: 'HEALTHENE_MANUAL_INPUT',
        measurements: [
            {
                values: [
                    {
                        value,
                        measurementUnit: { id: unitId },
                    },
                ],
                endDate: now,
                startDate: now,
            },
        ],
    };
};

/**
 * Build payload from health app samples (Apple Health / Google Fit)
 */
export const buildHealthAppPayload = (
    type: MeasurementType,
    samples: HealthSample[],
    source: 'APPLE_HEALTH' | 'GOOGLE_FIT',
    unitName?: string
): MeasurementPayload => {
    const config = getMeasurementConfig(type);

    // Special handling for Blood Pressure
    if (type === 'BLOOD_PRESSURE') {
        return {
            type,
            source,
            measurements: samples.map(sample => {
                const value = sample.value as { systolic: number; diastolic: number };
                return {
                    values: [
                        {
                            measurementUnit: { id: MEASUREMENT_UNIT_IDS.SYSTOLIC_MMHG },
                            value: value.systolic,
                        },
                        {
                            measurementUnit: { id: MEASUREMENT_UNIT_IDS.DIASTOLIC_MMHG },
                            value: value.diastolic,
                        },
                    ],
                    endDate: sample.endDate,
                    startDate: sample.startDate,
                };
            }),
        };
    }

    // Single value measurements
    const selectedUnitName = unitName || config.defaultUnit;
    const unitId = getUnitId(type, selectedUnitName);

    return {
        type,
        source,
        measurements: samples.map(sample => ({
            values: [
                {
                    value: sample.value as number,
                    measurementUnit: { id: unitId },
                },
            ],
            endDate: sample.endDate,
            startDate: sample.startDate,
        })),
    };
};

/**
 * Unified payload builder
 * Chooses appropriate builder based on source
 */
export const buildMeasurementPayload = (
    type: MeasurementType,
    data: Record<string, any> | HealthSample[],
    source: MeasurementSource,
    unitName?: string
): MeasurementPayload => {
    if (source === 'HEALTHENE_MANUAL_INPUT') {
        return buildManualPayload(type, data as Record<string, any>, unitName);
    }
    return buildHealthAppPayload(
        type,
      data as HealthSample[],
      source as 'APPLE_HEALTH' | 'GOOGLE_FIT',
      unitName
    );
  
};
