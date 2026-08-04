/**
 * Full Integration Test for Measurement Components
 * Tests complete flow without complex component rendering to avoid Jest ESM issues
 */

describe('Measurement Full Integration', () => {
    test('all measurement types should be supported (fixes POTASSIUM error)', () => {
        // @ts-ignore
        const { getMeasurementConfig } = require('../../src/utils/measurement/measurement-config');
        
        const measurementTypes = [
            'WEIGHT', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'TEMPERATURE', 'BMI',
            'OXYGEN', 'CREATINE', 'POTASSIUM', 'HEART_RATE', 'STEPS', 'HEIGHT'
        ];
        
        measurementTypes.forEach(type => {
            expect(() => getMeasurementConfig(type as any)).not.toThrow();
            const config = getMeasurementConfig(type as any);
            expect(config.type).toBe(type);
        });
    });

    test('should support health app integration where available (like original)', () => {
        // @ts-ignore
        const { supportsHealthApp } = require('../../src/utils/measurement/measurement-config');
        
        // Types the health app import actually covers — the same three v1 imported
        expect(supportsHealthApp('WEIGHT')).toBe(true);
        expect(supportsHealthApp('BLOOD_PRESSURE')).toBe(true);
        expect(supportsHealthApp('BLOOD_GLUCOSE')).toBe(true);

        // HEART_RATE has no fetcher in either health service and its read permission is
        // not requested; STEPS reach the backend as activities via CMPedometer, so
        // importing them here would file the same walk twice.
        expect(supportsHealthApp('HEART_RATE')).toBe(false);
        expect(supportsHealthApp('STEPS')).toBe(false);

        // Types that don't support health app
        expect(supportsHealthApp('BMI')).toBe(false);
        expect(supportsHealthApp('HEIGHT')).toBe(false);
        expect(supportsHealthApp('OXYGEN')).toBe(false);
        expect(supportsHealthApp('CREATINE')).toBe(false);
        expect(supportsHealthApp('POTASSIUM')).toBe(false);
        expect(supportsHealthApp('TEMPERATURE')).toBe(false);
    });

    test('POTASSIUM measurement config should be correct', () => {
        // @ts-ignore
        const { getMeasurementConfig } = require('../../src/utils/measurement/measurement-config');
        
        const config = getMeasurementConfig('POTASSIUM');
        expect(config.type).toBe('POTASSIUM');
        expect(config.defaultUnit).toBe('mEq/L');
        expect(config.fields[0].label).toBe('Potassium');
        expect(config.fields[0].placeholder).toBe('4.0');
        expect(config.maxDecimalPlaces).toBe(1);
    });

    test('chart helpers should work with all date periods', () => {
        // @ts-ignore
        const { getDateRangeText } = require('../../src/components/MeasurementChart/chart-helpers');
        
        const dateRanges = ['DAY', 'WEEK', 'MONTH', 'SIX_MONTH', 'YEAR'];
        const startDate = '2023-10-20T00:00:00.000Z';
        const endDate = '2023-10-20T23:59:59.999Z';
        
        dateRanges.forEach(period => {
            expect(() => getDateRangeText(period as any, startDate, endDate)).not.toThrow();
        });
    });

    test('should handle date range text generation correctly', () => {
        // @ts-ignore
        const { getDateRangeText } = require('../../src/components/MeasurementChart/chart-helpers');
        
        const result = getDateRangeText('WEEK', '2023-10-14T00:00:00.000Z', '2023-10-20T23:59:59.999Z');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });
});
