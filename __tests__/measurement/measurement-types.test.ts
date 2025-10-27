/**
 * Test new measurement types support (BMI, OXYGEN, CREATINE, POTASSIUM)
 */

import { getMeasurementConfig } from '../../src/utils/measurement/measurement-config';
import type { MeasurementType } from '../../src/types/health';

describe('Additional Measurement Types', () => {
    const newMeasurementTypes: MeasurementType[] = ['BMI', 'OXYGEN', 'CREATINE', 'POTASSIUM'];

    test.each(newMeasurementTypes)('should have config for %s', (type) => {
        expect(() => getMeasurementConfig(type)).not.toThrow();
        
        const config = getMeasurementConfig(type);
        expect(config).toBeDefined();
        expect(config.type).toBe(type);
        expect(config.fields).toBeDefined();
        expect(config.units).toBeDefined();
        expect(config.defaultUnit).toBeDefined();
        expect(typeof config.supportsHealthApp).toBe('boolean');
    });

    test('BMI should have correct configuration', () => {
        const config = getMeasurementConfig('BMI');
        expect(config.defaultUnit).toBe('BMI');
        expect(config.fields[0].placeholder).toBe('25.0');
        expect(config.maxDecimalPlaces).toBe(1);
    });

    test('POTASSIUM should have correct configuration', () => {
        const config = getMeasurementConfig('POTASSIUM');
        expect(config.defaultUnit).toBe('mEq/L');
        expect(config.fields[0].placeholder).toBe('4.0');
        expect(config.maxDecimalPlaces).toBe(1);
    });

    test('OXYGEN should have correct configuration', () => {
        const config = getMeasurementConfig('OXYGEN');
        expect(config.defaultUnit).toBe('%');
        expect(config.fields[0].placeholder).toBe('98');
        expect(config.maxDecimalPlaces).toBe(0);
    });

    test('CREATINE should have correct configuration', () => {
        const config = getMeasurementConfig('CREATINE');
        expect(config.defaultUnit).toBe('μmol/L');
        expect(config.fields[0].placeholder).toBe('80');
        expect(config.maxDecimalPlaces).toBe(0);
    });

    test('should not throw error for POTASSIUM anymore', () => {
        // This was the issue in the screenshot - "Unknown measurement type: POTASSIUM"
        expect(() => getMeasurementConfig('POTASSIUM')).not.toThrow();
    });
});
