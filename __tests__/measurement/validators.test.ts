/**
 * Tests for measurement validation schemas
 */

import { getMeasurementValidationSchema, VALIDATION_SCHEMAS } from '../../src/utils/measurement/validators';

describe('WEIGHT validation', () => {
  const schema = VALIDATION_SCHEMAS.WEIGHT;

  test('accepts valid weight', async () => {
    const valid = await schema.isValid({ value: '150.5' });
    expect(valid).toBe(true);
  });

  test('accepts comma as decimal separator', async () => {
    const valid = await schema.isValid({ value: '150,5' });
    expect(valid).toBe(true);
  });

  test('rejects value with too many decimals', async () => {
    const valid = await schema.isValid({ value: '150.55' });
    expect(valid).toBe(false);
  });

  test('rejects value below min', async () => {
    const valid = await schema.isValid({ value: '30' });
    expect(valid).toBe(false);
  });

  test('rejects value above max', async () => {
    const valid = await schema.isValid({ value: '600' });
    expect(valid).toBe(false);
  });

  test('rejects empty value', async () => {
    const valid = await schema.isValid({ value: '' });
    expect(valid).toBe(false);
  });
});

describe('BLOOD_PRESSURE validation', () => {
  const schema = VALIDATION_SCHEMAS.BLOOD_PRESSURE;

  test('accepts valid blood pressure', async () => {
    const valid = await schema.isValid({ systolic: '120', diastolic: '80' });
    expect(valid).toBe(true);
  });

  test('rejects when systolic is missing', async () => {
    const valid = await schema.isValid({ diastolic: '80' });
    expect(valid).toBe(false);
  });

  test('rejects when diastolic is missing', async () => {
    const valid = await schema.isValid({ systolic: '120' });
    expect(valid).toBe(false);
  });

  test('rejects systolic out of range', async () => {
    const tooLow = await schema.isValid({ systolic: '40', diastolic: '80' });
    expect(tooLow).toBe(false);

    const tooHigh = await schema.isValid({ systolic: '300', diastolic: '80' });
    expect(tooHigh).toBe(false);
  });

  test('rejects diastolic out of range', async () => {
    const tooLow = await schema.isValid({ systolic: '120', diastolic: '20' });
    expect(tooLow).toBe(false);

    const tooHigh = await schema.isValid({ systolic: '120', diastolic: '250' });
    expect(tooHigh).toBe(false);
  });
});

describe('BLOOD_GLUCOSE validation', () => {
  const schema = VALIDATION_SCHEMAS.BLOOD_GLUCOSE;

  test('accepts valid glucose value', async () => {
    const valid = await schema.isValid({ value: '5.5' });
    expect(valid).toBe(true);
  });

  test('accepts value at min boundary', async () => {
    const valid = await schema.isValid({ value: '0' });
    expect(valid).toBe(true);
  });

  test('rejects value above max', async () => {
    const valid = await schema.isValid({ value: '35' });
    expect(valid).toBe(false);
  });
});

describe('getMeasurementValidationSchema', () => {
  test('returns schema for any measurement type', () => {
    const weightSchema = getMeasurementValidationSchema('WEIGHT');
    expect(weightSchema).toBeDefined();

    const bpSchema = getMeasurementValidationSchema('BLOOD_PRESSURE');
    expect(bpSchema).toBeDefined();
  });
});
