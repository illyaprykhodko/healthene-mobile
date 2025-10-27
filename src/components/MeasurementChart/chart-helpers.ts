/**
 * Chart Helpers
 * Helper functions for chart calculations and rendering
 */

import moment from 'moment';
import { DATE_PERIOD, type DatePeriod } from '../../constants/measurement-chart';

/**
 * Generate horizontal labels based on period
 */
export const getHorizontalLabels = (
    period: DatePeriod,
    date: string,
    count: number
): string[] => {
    const labels: string[] = [];

    switch (period) {
        case DATE_PERIOD.DAY:
            return ['12AM', '6', '12PM', '6'];

        case DATE_PERIOD.WEEK:
            for (let i = count - 1; i >= 0; i--) {
                labels.push(moment(date).subtract(i, 'days').format('ddd'));
            }
            break;

        case DATE_PERIOD.MONTH:
            return [
                moment(date).subtract(30, 'days').format('D'),
                moment(date).subtract(22, 'days').format('D'),
                moment(date).subtract(15, 'days').format('D'),
                moment(date).subtract(8, 'days').format('D'),
                moment(date).format('D'),
            ];

        case DATE_PERIOD.SIX_MONTH:
            for (let i = count; i > 0; i--) {
                labels.push(moment().month(moment(date).month() - i + 1).format('MMM'));
            }
            break;

        case DATE_PERIOD.YEAR:
            for (let i = count; i > 0; i--) {
                labels.push(moment().month(moment(date).month() - i + 1).format('MMM')[0]);
            }
            break;
    }

    return labels;
};

/**
 * Calculate X coordinate for data point based on date
 */
export const calculateXCoordinate = (
    item: any,
    period: DatePeriod,
    date: string,
    count: number
): number => {
    if (!item) {
        // console.warn('[calculateXCoordinate] No item provided');
        return 0;
    }

    switch (period) {
        case DATE_PERIOD.DAY:
            return (
                Number(moment.utc(item?.fromDate).local().format('H'))
                + Number(moment.utc(item?.fromDate).local().format('m')) / 60
            );

        case DATE_PERIOD.WEEK: {
            const labels = [];
            for (let i = count - 1; i >= 0; i--) {
                labels.push(moment(date).subtract(i, 'days').format('MMMM-D'));
            }
            const itemDay = item?.averageDate?.format('MMMM-D');
            const labelIndex = labels.findIndex(label => label === itemDay);
            
            // if (labelIndex === -1) {
            //     console.warn('[calculateXCoordinate] WEEK: Item not found in labels:', {
            //         itemDay,
            //         labels,
            //         averageDate: item?.averageDate?.format(),
            //     });
            // }
            
            return labelIndex !== -1 ? labelIndex + 0.5 : 0;
        }

        case DATE_PERIOD.MONTH: {
            const labels = [];
            for (let i = count - 1; i >= 0; i--) {
                labels.push(moment(date).subtract(i, 'days').format('MMMM-D'));
            }
            const itemDay = item?.averageDate?.format('MMMM-D');
            const labelIndex = labels.findIndex(label => label === itemDay);
            
            // if (labelIndex === -1) {
            //     console.warn('[calculateXCoordinate] MONTH: Item not found in labels:', {
            //         itemDay,
            //         labels,
            //     });
            // }
            
            return labelIndex !== -1 ? labelIndex - 1 : 0;
        }

        case DATE_PERIOD.SIX_MONTH:
        case DATE_PERIOD.YEAR: {
            const labels = [];
            for (let i = count; i > 0; i--) {
                labels.push(moment().month(moment(date).month() - i + 1).format('MMMM'));
            }
            const itemMonth = item?.averageDate?.format('MMMM');
            const labelIndex = labels.findIndex(label => label === itemMonth);
            
            // if (labelIndex === -1) {
            //     console.warn('[calculateXCoordinate] SIX_MONTH/YEAR: Item not found in labels:', {
            //         itemMonth,
            //         labels,
            //         averageDate: item?.averageDate?.format(),
            //     });
            // }
            
            return labelIndex !== -1 ? labelIndex + 0.5 : 0;
        }

        default:
            console.error('[calculateXCoordinate] Unknown period:', period);
            return 0;
    }
};

/**
 * Calculate interval values for vertical labels
 */
export const calculateInterval = (list: number[]): number[] => {
    const sortedList = [...new Set(list)].sort((a, b) => a - b);

    if (sortedList.length === 1) {
        return sortedList;
    }

    const itemsList: number[] = [];
    const first = sortedList[0];
    const last = sortedList[sortedList.length - 1];

    // Add padding before first value
    for (let i = first; i > first - 4; i--) {
        itemsList.unshift(i - 1);
    }

    // Add all values
    for (let i = first; i <= last; i++) {
        itemsList.push(i);
    }

    // Ensure divisible by 4
    let currentLast = itemsList[itemsList.length - 1];
    while ((currentLast - itemsList[0]) % 4 !== 0) {
        currentLast += 1;
        itemsList.push(currentLast);
    }

    // Select 5 evenly spaced values
    const step = (itemsList[itemsList.length - 1] - itemsList[0]) / 4;
    const intervalList = [];
    for (let i = 0; i < 5; i++) {
        intervalList.push(itemsList[Math.floor(i * step)]);
    }

    return intervalList;
};

/**
 * Prepare chart data with coordinates
 */
export const prepareChartData = (
    data: any[],
    period: DatePeriod,
    date: string,
    count: number,
    isBloodPressure: boolean,
    restData?: any[]
): any[] => {
    const points = data.map((item, index) => ({
        ...item,
        ...(item.units?.[0] || {}),
        y: item.units?.[0]?.lastValue || 0,
        x: calculateXCoordinate(item, period, date, count),
        additional: isBloodPressure && restData ? restData[index]?.units?.[0] : undefined,
    }));
    return points;
};

/**
 * Format tooltip time based on period
 */
export const formatTooltipTime = (
    period: DatePeriod,
    fromDate: string,
    toDate: string,
    averageDate?: moment.Moment
): string => {
    switch (period) {
        case DATE_PERIOD.DAY:
            return `${moment(fromDate).format('H A')} - ${moment(toDate).format('H A')}`;
        case DATE_PERIOD.WEEK:
            return moment(fromDate).format('MMM DD, h:mm A');
        case DATE_PERIOD.MONTH:
            return averageDate ? moment(averageDate).format('MMM DD') : '';
        case DATE_PERIOD.SIX_MONTH:
            return averageDate ? moment(averageDate).format('MMM') : '';
        case DATE_PERIOD.YEAR:
            return averageDate ? moment(averageDate).format('MMM') : '';
        default:
            return '';
    }
};

/**
 * Get date range display text
 */
export const getDateRangeText = (period: DatePeriod, startDate: string, endDate: string): string => {
    switch (period) {
        case DATE_PERIOD.DAY:
            return moment(startDate).format('ll');
        case DATE_PERIOD.WEEK:
            return `${moment(startDate).format('ddd M/D')} to ${moment(endDate).format('M/D')}`;
        case DATE_PERIOD.MONTH:
            return `${moment(startDate).format('MMM')} - ${moment(endDate).format('MMM')}`;
        case DATE_PERIOD.SIX_MONTH:
            return `${moment(startDate).format('MMM')}-${moment(endDate).format('MMM')}`;
        case DATE_PERIOD.YEAR:
            return `${moment(startDate).format('YYYY')}-${moment(endDate).format('YYYY')}`;
        default:
            return moment(startDate).format('dddd, MMM DD, YYYY');
    }
};
