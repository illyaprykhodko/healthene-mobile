/**
 * Tests for measurement payload builder
 */

import moment from 'moment';
import { buildManualPayload, buildHealthAppPayload, buildMeasurementPayload } from '../../src/utils/measurement/payload-builder';
import { MEASUREMENT_UNIT_IDS } from '../../src/utils/measurement/measurement-config';

describe('buildManualPayload', () => {
  test('builds WEIGHT payload correctly', () => {
    const values = { value: '150.5' };
    const payload = buildManualPayload('WEIGHT', values, 'lbs');

    expect(payload.type).toBe('WEIGHT');
    expect(payload.source).toBe('HEALTHENE_MANUAL_INPUT');
    expect(payload.measurements).toHaveLength(1);
    expect(payload.measurements[0].values).toHaveLength(1);
    expect(payload.measurements[0].values[0].value).toBe(150.5);
    expect(payload.measurements[0].values[0].measurementUnit.id).toBe(MEASUREMENT_UNIT_IDS.POUNDS);
  });

  test('handles comma as decimal separator', () => {
    const values = { value: '72,5' };
    const payload = buildManualPayload('WEIGHT', values, 'kg');

    expect(payload.measurements[0].values[0].value).toBe(72.5);
    expect(payload.measurements[0].values[0].measurementUnit.id).toBe(MEASUREMENT_UNIT_IDS.KILOGRAMS);
  });

  test('builds BLOOD_PRESSURE payload correctly', () => {
    const values = { systolic: '120', diastolic: '80' };
    const payload = buildManualPayload('BLOOD_PRESSURE', values);

    expect(payload.type).toBe('BLOOD_PRESSURE');
    expect(payload.source).toBe('HEALTHENE_MANUAL_INPUT');
    expect(payload.measurements[0].values).toHaveLength(2);
    
    const systolicValue = payload.measurements[0].values.find(
      v => v.measurementUnit.id === MEASUREMENT_UNIT_IDS.SYSTOLIC_MMHG
    );
    expect(systolicValue?.value).toBe(120);

    const diastolicValue = payload.measurements[0].values.find(
      v => v.measurementUnit.id === MEASUREMENT_UNIT_IDS.DIASTOLIC_MMHG
    );
    expect(diastolicValue?.value).toBe(80);
  });

  test('uses default unit if not specified', () => {
    const values = { value: '100' };
    const payload = buildManualPayload('BLOOD_GLUCOSE', values);

    expect(payload.measurements[0].values[0].measurementUnit.id).toBe(MEASUREMENT_UNIT_IDS.MMOL_L);
  });
});

describe('buildHealthAppPayload', () => {
  test('builds payload from Apple Health samples', () => {
    const samples = [
      {
        value: 150,
        startDate: '2024-01-01T10:00:00Z',
        endDate: '2024-01-01T10:00:00Z',
        source: 'APPLE_HEALTH' as const,
      },
    ];

    const payload = buildHealthAppPayload('WEIGHT', samples, 'APPLE_HEALTH', 'lbs');

    expect(payload.type).toBe('WEIGHT');
    expect(payload.source).toBe('APPLE_HEALTH');
    expect(payload.measurements).toHaveLength(1);
    expect(payload.measurements[0].values[0].value).toBe(150);
    expect(payload.measurements[0].startDate).toBe('2024-01-01T10:00:00Z');
  });

  test('handles BLOOD_PRESSURE samples correctly', () => {
    const samples = [
      {
        value: { systolic: 120, diastolic: 80 },
        startDate: '2024-01-01T10:00:00Z',
        endDate: '2024-01-01T10:00:00Z',
        source: 'GOOGLE_FIT' as const,
      },
    ];

    const payload = buildHealthAppPayload('BLOOD_PRESSURE', samples, 'GOOGLE_FIT');

    expect(payload.source).toBe('GOOGLE_FIT');
    expect(payload.measurements[0].values).toHaveLength(2);
  });

  test('handles multiple samples', () => {
    const samples = [
      { value: 150, startDate: '2024-01-01T10:00:00Z', endDate: '2024-01-01T10:00:00Z', source: 'APPLE_HEALTH' as const },
      { value: 149.5, startDate: '2024-01-01T11:00:00Z', endDate: '2024-01-01T11:00:00Z', source: 'APPLE_HEALTH' as const },
    ];

    const payload = buildHealthAppPayload('WEIGHT', samples, 'APPLE_HEALTH', 'lbs');

    expect(payload.measurements).toHaveLength(2);
    expect(payload.measurements[0].values[0].value).toBe(150);
    expect(payload.measurements[1].values[0].value).toBe(149.5);
  });
});

describe('buildMeasurementPayload (unified)', () => {
  test('routes to manual builder when source is MANUAL', () => {
    const values = { value: '100' };
    const payload = buildMeasurementPayload('WEIGHT', values, 'HEALTHENE_MANUAL_INPUT', 'lbs');

    expect(payload.source).toBe('HEALTHENE_MANUAL_INPUT');
  });

  test('routes to health app builder when source is APPLE_HEALTH', () => {
    const samples = [
      { value: 150, startDate: '2024-01-01T10:00:00Z', endDate: '2024-01-01T10:00:00Z', source: 'APPLE_HEALTH' as const },
    ];
    const payload = buildMeasurementPayload('WEIGHT', samples, 'APPLE_HEALTH', 'lbs');

    expect(payload.source).toBe('APPLE_HEALTH');
  });
});
