// outsource dependencies
import dayjs from 'services/date';
// local dependencies
import type {
    HealthSample,
    MeasurementType,
    MeasurementSource,
    MeasurementPayload,
} from 'types/health';
import { MEASUREMENT_UNIT_IDS } from './measurement-config';

interface UnitIds {
    defaultUnitId?: number;
    systolicUnitId?: number;
    diastolicUnitId?: number;
}

export const buildManualPayload = (
    type: MeasurementType,
    values: Record<string, any>,
    unitIds?: UnitIds,
): MeasurementPayload => {
    const now = dayjs().format();
    if (type === 'BLOOD_PRESSURE') {
        const systolicUnitId = unitIds?.systolicUnitId || MEASUREMENT_UNIT_IDS.SYSTOLIC_MMHG;
        const diastolicUnitId = unitIds?.diastolicUnitId || MEASUREMENT_UNIT_IDS.DIASTOLIC_MMHG;
        return {
            type,
            source: 'HEALTHENE_MANUAL_INPUT',
            measurements: [
                {
                    values: [
                        {
                            measurementUnit: { id: systolicUnitId },
                            value: parseFloat(String(values.systolic).replace(',', '.')),
                        },
                        {
                            measurementUnit: { id: diastolicUnitId },
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
                        measurementUnit: { id: unitIds?.defaultUnitId || 0 },
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
    unitIds?: UnitIds,
): MeasurementPayload => {
    if (type === 'BLOOD_PRESSURE') {
        const systolicUnitId = unitIds?.systolicUnitId || MEASUREMENT_UNIT_IDS.SYSTOLIC_MMHG;
        const diastolicUnitId = unitIds?.diastolicUnitId || MEASUREMENT_UNIT_IDS.DIASTOLIC_MMHG;
        return {
            type,
            source,
            measurements: samples.map(sample => {
                const value = sample.value as { systolic: number; diastolic: number };
                return {
                    values: [
                        {
                            measurementUnit: { id: systolicUnitId },
                            value: value.systolic,
                        },
                        {
                            measurementUnit: { id: diastolicUnitId },
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
                    measurementUnit: { id: unitIds?.defaultUnitId || 0 },
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
    unitIds?: UnitIds,
): MeasurementPayload => {
    if (source === 'HEALTHENE_MANUAL_INPUT') {
        return buildManualPayload(type, data as Record<string, any>, unitIds);
    }
    return buildHealthAppPayload(
        type,
      data as HealthSample[],
      source as 'APPLE_HEALTH' | 'GOOGLE_FIT',
      unitIds,
    );
  
};
