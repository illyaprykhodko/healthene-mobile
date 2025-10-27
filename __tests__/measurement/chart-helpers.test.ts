/**
 * Chart Helpers Tests
 */
// outsource dependencies
import moment from 'moment';
// local dependencies
import {
    getDateRangeText,
    calculateInterval,
    formatTooltipTime,
    getHorizontalLabels,
    calculateXCoordinate,
} from '../../src/components/MeasurementChart/chart-helpers';
import { DATE_PERIOD } from '../../src/constants/measurement-chart';

describe('Chart Helpers', () => {
    const testDate = '2025-10-14';

    describe('getHorizontalLabels', () => {
        it('returns correct labels for DAY period', () => {
            const labels = getHorizontalLabels(DATE_PERIOD.DAY, testDate, 24);
            expect(labels).toEqual(['12AM', '6', '12PM', '6']);
        });

        it('returns correct labels for WEEK period', () => {
            const labels = getHorizontalLabels(DATE_PERIOD.WEEK, testDate, 7);
            expect(labels).toHaveLength(7);
            expect(labels[labels.length - 1]).toBe(moment(testDate).format('ddd'));
        });

        it('returns correct labels for MONTH period', () => {
            const labels = getHorizontalLabels(DATE_PERIOD.MONTH, testDate, 30);
            expect(labels).toHaveLength(5);
            expect(labels[labels.length - 1]).toBe(moment(testDate).format('D'));
        });

        it('returns correct labels for SIX_MONTH period', () => {
            const labels = getHorizontalLabels(DATE_PERIOD.SIX_MONTH, testDate, 6);
            expect(labels).toHaveLength(6);
        });

        it('returns correct labels for YEAR period', () => {
            const labels = getHorizontalLabels(DATE_PERIOD.YEAR, testDate, 12);
            expect(labels).toHaveLength(12);
        });
    });

    describe('calculateXCoordinate', () => {
        it('calculates X coordinate for DAY period', () => {
            const item = {
                fromDate: '2025-10-14T12:30:00Z', // UTC time
            };

            const x = calculateXCoordinate(item, DATE_PERIOD.DAY, testDate, 24);
            // The result depends on timezone offset
            expect(typeof x).toBe('number');
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x).toBeLessThanOrEqual(24);
        });

        it('calculates X coordinate for WEEK period', () => {
            const item = {
                averageDate: moment(testDate).subtract(3, 'days'),
            };

            const x = calculateXCoordinate(item, DATE_PERIOD.WEEK, testDate, 7);
            expect(typeof x).toBe('number');
            expect(x).toBeGreaterThanOrEqual(0);
        });

        it('returns 0 for invalid data', () => {
            const item = {
                averageDate: moment('2000-01-01'), // Not in range
            };

            const x = calculateXCoordinate(item, DATE_PERIOD.WEEK, testDate, 7);
            expect(x).toBe(0);
        });
    });

    describe('calculateInterval', () => {
        it('returns single value for list with one item', () => {
            const result = calculateInterval([175]);
            expect(result).toEqual([175]);
        });

        it('calculates interval for range of values', () => {
            const result = calculateInterval([170, 180]);
            expect(result).toHaveLength(5); // Always 5 labels
            expect(result[0]).toBeLessThan(170); // Padding before
            expect(result[result.length - 1]).toBeGreaterThan(180); // Padding after
        });

        it('handles duplicate values', () => {
            const result = calculateInterval([175, 175, 175]);
            expect(Array.isArray(result)).toBe(true);
        });

        it('creates evenly spaced intervals', () => {
            const result = calculateInterval([100, 200]);
            expect(result).toHaveLength(5);
            
            // Check spacing
            const spacing = result[1] - result[0];
            for (let i = 1; i < result.length - 1; i++) {
                expect(Math.abs((result[i + 1] - result[i]) - spacing)).toBeLessThan(1);
            }
        });
    });

    describe('formatTooltipTime', () => {
        const fromDate = '2025-10-14T10:00:00';
        const toDate = '2025-10-14T11:00:00';
        const averageDate = moment('2025-10-14T10:30:00');

        it('formats DAY period correctly', () => {
            const result = formatTooltipTime(DATE_PERIOD.DAY, fromDate, toDate);
            expect(result).toContain('AM');
        });

        it('formats WEEK period correctly', () => {
            const result = formatTooltipTime(DATE_PERIOD.WEEK, fromDate, toDate, averageDate);
            expect(result).toContain('Oct');
            expect(result).toContain('14');
        });

        it('formats MONTH period correctly', () => {
            const result = formatTooltipTime(DATE_PERIOD.MONTH, fromDate, toDate, averageDate);
            expect(result).toContain('Oct');
        });

        it('formats SIX_MONTH period correctly', () => {
            const result = formatTooltipTime(DATE_PERIOD.SIX_MONTH, fromDate, toDate, averageDate);
            expect(result).toContain('Oct');
        });

        it('formats YEAR period correctly', () => {
            const result = formatTooltipTime(DATE_PERIOD.YEAR, fromDate, toDate, averageDate);
            expect(result).toContain('Oct');
        });
    });

    describe('getDateRangeText', () => {
        const startDate = '2025-10-08T00:00:00';
        const endDate = '2025-10-14T23:59:59';

        it('returns correct range for DAY period', () => {
            const result = getDateRangeText(DATE_PERIOD.DAY, startDate, endDate);
            expect(result).toContain('Oct');
        });

        it('returns correct range for WEEK period', () => {
            const result = getDateRangeText(DATE_PERIOD.WEEK, startDate, endDate);
            expect(result).toContain('to');
        });

        it('returns correct range for MONTH period', () => {
            const result = getDateRangeText(DATE_PERIOD.MONTH, startDate, endDate);
            expect(result).toContain('-');
        });

        it('returns correct range for SIX_MONTH period', () => {
            const result = getDateRangeText(DATE_PERIOD.SIX_MONTH, startDate, endDate);
            expect(result).toContain('-');
        });

        it('returns correct range for YEAR period', () => {
            const result = getDateRangeText(DATE_PERIOD.YEAR, startDate, endDate);
            expect(result).toContain('-');
        });
    });

});

