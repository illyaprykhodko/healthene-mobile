/**
 * Measurement Chart Constants
 * Constants for measurement chart periods, dates and data visualization
 */

import { Platform } from 'react-native';

import dayjs from 'services/date';

// Date period types
export const DATE_PERIOD = {
    DAY: 'DAY',
    WEEK: 'WEEK',
    YEAR: 'YEAR',
    MONTH: 'MONTH',
    SIX_MONTH: 'SIX_MONTH',
} as const;

export type DatePeriod = typeof DATE_PERIOD[keyof typeof DATE_PERIOD];

// Centered value periods (for chart visualization)
export const CENTERED_VALUE_PERIODS: DatePeriod[] = [
    DATE_PERIOD.WEEK,
    DATE_PERIOD.SIX_MONTH,
    DATE_PERIOD.YEAR,
];

// Tab configuration interface
export interface MeasurementTab {
    count: number;
    short: string;
    request: string;
    name: DatePeriod;
    options: {
        endDate: string;
        startDate: string;
    };
}

/**
 * Generate measurement chart tabs based on date
 */
export const getMeasurementTabs = (date: string = dayjs().format('YYYY-MM-DD')): MeasurementTab[] => [
    {
        count: 24,
        short: 'D',
        name: DATE_PERIOD.DAY,
        request: '1-day',
        options: {
            endDate: dayjs(date).toISOString(),
            startDate: dayjs(date).startOf('day').toISOString(),
        },
    },
    {
        count: 7,
        short: 'W',
        name: DATE_PERIOD.WEEK,
        request: '1-week',
        options: {
            endDate: dayjs(date).toISOString(),
            startDate: dayjs(date).subtract(6, 'days').toISOString(),
        },
    },
    {
        // Number of day-slots covering the actual [date - 1 month … date] window (NOT daysInMonth of
        // `date`), so the X-axis labels match the query range and no trailing-edge day is dropped.
        count: dayjs(date).diff(dayjs(date).subtract(1, 'month'), 'day') + 1,
        short: 'M',
        name: DATE_PERIOD.MONTH,
        request: '1-month',
        options: {
            endDate: dayjs(date).toISOString(),
            startDate: dayjs(date).subtract(1, 'month').toISOString(),
        },
    },
    {
        count: 6,
        short: '6M',
        name: DATE_PERIOD.SIX_MONTH,
        request: '6-month',
        options: {
            endDate: dayjs(date).toISOString(),
            startDate: dayjs(date).subtract(5, 'months').toISOString(),
        },
    },
    {
        count: 12,
        short: 'Y',
        name: DATE_PERIOD.YEAR,
        request: '1-year',
        options: {
            endDate: dayjs(date).toISOString(),
            startDate: dayjs(date).subtract(1, 'year').toISOString(),
        },
    },
];

// Per-period step used to move to the previous/next period (carousel navigation).
const PERIOD_STEP: Record<DatePeriod, { amount: number; unit: dayjs.ManipulateType }> = {
    [DATE_PERIOD.DAY]: { amount: 1, unit: 'day' },
    [DATE_PERIOD.WEEK]: { amount: 1, unit: 'week' },
    [DATE_PERIOD.MONTH]: { amount: 1, unit: 'month' },
    [DATE_PERIOD.SIX_MONTH]: { amount: 6, unit: 'month' },
    [DATE_PERIOD.YEAR]: { amount: 1, unit: 'year' },
};

/**
 * Shift a `YYYY-MM-DD` date by `n` periods (n may be negative = into the past, positive = future).
 * Used to build the virtualized window of carousel pages around an anchor.
 */
export const shiftPeriodN = (date: string, period: DatePeriod, n: number): string => {
    const { amount, unit } = PERIOD_STEP[period];
    return dayjs(date).add(amount * n, unit).format('YYYY-MM-DD');
};

/**
 * Shift a `YYYY-MM-DD` date by one period in the given direction (+1 = next / forward,
 * -1 = previous / back).
 */
export const shiftPeriod = (date: string, period: DatePeriod, dir: 1 | -1): string => shiftPeriodN(date, period, dir);

// Measurement source types
export const MEASUREMENT_SOURCE = {
    GOOGLE_FIT: 'GOOGLE_FIT',
    APPLE_HEALTH: 'APPLE_HEALTH',
    HEALTHENE_MANUAL_INPUT: 'HEALTHENE_MANUAL_INPUT',
} as const;

export type MeasurementSource = typeof MEASUREMENT_SOURCE[keyof typeof MEASUREMENT_SOURCE];

// User-facing name of the platform health app that a measurement can be imported from
export const HEALTH_APP_NAME = Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit';
