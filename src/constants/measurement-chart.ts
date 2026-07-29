/**
 * Measurement Chart Constants
 * Constants for measurement chart periods, dates and data visualization
 */

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
        count: dayjs(date).daysInMonth(),
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

// Measurement source types
export const MEASUREMENT_SOURCE = {
    GOOGLE_FIT: 'GOOGLE_FIT',
    APPLE_HEALTH: 'APPLE_HEALTH',
    HEALTHENE_MANUAL_INPUT: 'HEALTHENE_MANUAL_INPUT',
} as const;

export type MeasurementSource = typeof MEASUREMENT_SOURCE[keyof typeof MEASUREMENT_SOURCE];
