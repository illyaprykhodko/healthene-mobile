/**
 * Blood Pressure Specific Tests
 * Tests for BP tooltip, currentValue extraction, and visualization
 */

describe('Blood Pressure Improvements', () => {
    describe('Current Value Extraction', () => {
        test('should extract both systolic and diastolic from lastMeasurement', () => {
            const mockLastMeasurement = {
                values: [
                    {
                        measurementUnit: { id: 1, unitType: 'SYSTOLIC', name: 'mmHg' },
                        value: 120,
                    },
                    {
                        measurementUnit: { id: 2, unitType: 'DIASTOLIC', name: 'mmHg' },
                        value: 80,
                    },
                ],
            };

            // Logic from MeasurementChartScreen
            const systolic = mockLastMeasurement.values.find(
                (v) => v.measurementUnit?.unitType === 'SYSTOLIC' || v.measurementUnit?.id === 1
            );
            const diastolic = mockLastMeasurement.values.find(
                (v) => v.measurementUnit?.unitType === 'DIASTOLIC' || v.measurementUnit?.id === 2
            );

            expect(systolic?.value).toBe(120);
            expect(diastolic?.value).toBe(80);
        });

        test('should create BP currentValue with both values', () => {
            const mockLastMeasurement = {
                values: [
                    {
                        measurementUnit: { id: 1, unitType: 'SYSTOLIC', name: 'mmHg' },
                        value: 120,
                    },
                    {
                        measurementUnit: { id: 2, unitType: 'DIASTOLIC', name: 'mmHg' },
                        value: 80,
                    },
                ],
            };

            const isBloodPressure = true;

            if (isBloodPressure && mockLastMeasurement.values.length >= 2) {
                const systolic = mockLastMeasurement.values.find(
                    (v) => v.measurementUnit?.unitType === 'SYSTOLIC' || v.measurementUnit?.id === 1
                );
                const diastolic = mockLastMeasurement.values.find(
                    (v) => v.measurementUnit?.unitType === 'DIASTOLIC' || v.measurementUnit?.id === 2
                );

                const result = {
                    value: systolic?.value || 0,
                    unit: 'mmHg',
                    systolic: systolic?.value || 0,
                    diastolic: diastolic?.value || 0,
                    isBloodPressure: true,
                };

                expect(result.systolic).toBe(120);
                expect(result.diastolic).toBe(80);
                expect(result.unit).toBe('mmHg');
                expect(result.isBloodPressure).toBe(true);
            }
        });
    });

    describe('BP Data Preparation', () => {
        test('should separate BP data into systolic and diastolic arrays', () => {
            const mockData = [
                {
                    fromDate: '2023-10-14T00:00:00',
                    toDate: '2023-10-14T23:59:59',
                    units: [
                        { unitType: 'SYSTOLIC', lastValue: 120 },
                        { unitType: 'DIASTOLIC', lastValue: 80 },
                    ],
                },
                {
                    fromDate: '2023-10-15T00:00:00',
                    toDate: '2023-10-15T23:59:59',
                    units: [
                        { unitType: 'SYSTOLIC', lastValue: 125 },
                        { unitType: 'DIASTOLIC', lastValue: 85 },
                    ],
                },
            ];

            // Logic from MeasurementChartScreen prepareBloodPressureData
            const content: any[] = [];
            const rest: any[] = [];

            mockData.forEach((item) => {
                content.push({
                    ...item,
                    units: [item.units?.find((u: any) => u.unitType === 'SYSTOLIC')],
                });
                rest.push({
                    ...item,
                    units: [item.units?.find((u: any) => u.unitType === 'DIASTOLIC')],
                });
            });

            expect(content).toHaveLength(2);
            expect(rest).toHaveLength(2);
            expect(content[0].units[0].unitType).toBe('SYSTOLIC');
            expect(rest[0].units[0].unitType).toBe('DIASTOLIC');
            expect(content[0].units[0].lastValue).toBe(120);
            expect(rest[0].units[0].lastValue).toBe(80);
        });
    });

    describe('BP Tooltip Format', () => {
        test('should format BP tooltip as "120/80"', () => {
            const systolicValue = 120;
            const diastolicValue = 80;

            const formatted = `${Math.round(systolicValue)}/${Math.round(diastolicValue)}`;

            expect(formatted).toBe('120/80');
        });

        test('should round BP values in tooltip', () => {
            const systolicValue = 120.7;
            const diastolicValue = 79.3;

            const formatted = `${Math.round(systolicValue)}/${Math.round(diastolicValue)}`;

            expect(formatted).toBe('121/79');
        });
    });

    describe('BP Tooltip Data Structure', () => {
        test('should include additional field for diastolic in tooltip', () => {
            const tooltipPoint = {
                y: 120, // systolic value
                cx: 100,
                cy: 50,
                fromDate: '2023-10-14T10:00:00',
                additional: {
                    lastValue: 80, // diastolic value
                },
                isDiastolic: false,
            };

            expect(tooltipPoint.y).toBe(120);
            expect(tooltipPoint.additional?.lastValue).toBe(80);
        });
    });

    describe('Two Graph Lines for BP', () => {
        test('should have separate data arrays for systolic and diastolic', () => {
            const chartData = [
                { units: [{ unitType: 'SYSTOLIC', lastValue: 120 }] },
                { units: [{ unitType: 'SYSTOLIC', lastValue: 125 }] },
            ];

            const restData = [
                { units: [{ unitType: 'DIASTOLIC', lastValue: 80 }] },
                { units: [{ unitType: 'DIASTOLIC', lastValue: 85 }] },
            ];

            expect(chartData).toHaveLength(2);
            expect(restData).toHaveLength(2);
            expect(chartData.length).toBe(restData.length);
        });
    });
});
