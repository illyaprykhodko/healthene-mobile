/**
 * Tests for measurement configuration utilities
 */

import { getMeasurementConfig, getUnitId, supportsHealthApp, MEASUREMENT_UNIT_IDS } from '../../src/utils/measurement/measurement-config';

describe('getMeasurementConfig', () => {
  test('returns config for WEIGHT', () => {
    const config = getMeasurementConfig('WEIGHT');
    
    expect(config.type).toBe('WEIGHT');
    expect(config.fields).toHaveLength(1);
    expect(config.fields[0].name).toBe('value');
    expect(config.units.length).toBeGreaterThan(0);
    expect(config.supportsHealthApp).toBe(true);
  });

  test('returns config for BLOOD_PRESSURE', () => {
    const config = getMeasurementConfig('BLOOD_PRESSURE');
    
    expect(config.fields).toHaveLength(2);
    expect(config.fields[0].name).toBe('systolic');
    expect(config.fields[1].name).toBe('diastolic');
  });

  test('throws error for unknown type', () => {
    expect(() => getMeasurementConfig('UNKNOWN' as any)).toThrow('Unknown measurement type');
  });
});

describe('getUnitId', () => {
  test('returns correct unit ID for WEIGHT/lbs', () => {
    const id = getUnitId('WEIGHT', 'lbs');
    expect(id).toBe(MEASUREMENT_UNIT_IDS.POUNDS);
  });

  test('returns correct unit ID for BLOOD_GLUCOSE/mmol/L', () => {
    const id = getUnitId('BLOOD_GLUCOSE', 'mmol/L');
    expect(id).toBe(MEASUREMENT_UNIT_IDS.MMOL_L);
  });

  test('throws error for unknown unit', () => {
    expect(() => getUnitId('WEIGHT', 'unknown')).toThrow('Unknown unit');
  });
});

describe('supportsHealthApp', () => {
  test('returns true for WEIGHT', () => {
    expect(supportsHealthApp('WEIGHT')).toBe(true);
  });

  test('returns true for BLOOD_PRESSURE', () => {
    expect(supportsHealthApp('BLOOD_PRESSURE')).toBe(true);
  });

  test('returns false for TEMPERATURE', () => {
    expect(supportsHealthApp('TEMPERATURE')).toBe(false);
  });
});
