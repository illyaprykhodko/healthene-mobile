// outsource dependencies
import moment from 'moment';
// local dependencies
import type {
    HealthSample,
    MeasurementType,
    MeasurementSource,
    MeasurementPayload,
} from 'types/health';
import { MEASUREMENT_UNIT_IDS } from './measurement-config';

export const buildManualPayload = (
    type: MeasurementType,
    values: Record<string, any>,
    unitId?: number,
): MeasurementPayload => {
    const now = moment().format();
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

    const value = parseFloat(String(values.value).replace(',', '.'));

    return {
        type,
        source: 'HEALTHENE_MANUAL_INPUT',
        measurements: [
            {
                values: [
                    {
                        value,
                        measurementUnit: { id: unitId || 0 },
                    },
                ],
                endDate: now,
                startDate: now,
            },
        ],
    };
};

export const buildHealthAppPayload = (
    type: MeasurementType,
    samples: HealthSample[],
    source: 'APPLE_HEALTH' | 'GOOGLE_FIT',
    unitId?: number,
): MeasurementPayload => {
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

    return {
        type,
        source,
        measurements: samples.map(sample => ({
            values: [
                {
                    value: sample.value as number,
                    measurementUnit: { id: unitId || 0 },
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
    unitId?: number,
): MeasurementPayload => {
    if (source === 'HEALTHENE_MANUAL_INPUT') {
        return buildManualPayload(type, data as Record<string, any>, unitId);
    }
    return buildHealthAppPayload(
        type,
      data as HealthSample[],
      source as 'APPLE_HEALTH' | 'GOOGLE_FIT',
      unitId,
    );
  
};
