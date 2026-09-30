// outsource dependencies
import dayjs from 'services/date';
import { DATE_PERIOD, type DatePeriod } from 'constants/measurement-chart';

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
            return [
                '12AM',
                '6',
                '12PM',
                '6'
            ];

        case DATE_PERIOD.WEEK:
            for (let i = count - 1; i >= 0; i--) {
                labels.push(dayjs(date).subtract(i, 'days').format('ddd'));
            }
            break;

        case DATE_PERIOD.MONTH: {
            const step = Math.floor(count / 4);
            const indices = [
                0,
                step,
                step * 2,
                step * 3,
                count - 1,
            ];
            return indices.map(i => dayjs(date).subtract(count - 1 - i, 'days').format('D'));
        }

        case DATE_PERIOD.SIX_MONTH:
            for (let i = count - 1; i >= 0; i--) {
                labels.push(dayjs(date).subtract(i, 'month').format('MMM'));
            }
            break;

        case DATE_PERIOD.YEAR:
            for (let i = count - 1; i >= 0; i--) {
                labels.push(dayjs(date).subtract(i, 'month').format('MMM'));
            }
            break;
    }

    return labels;
};

/**
 * Returns the data-space X position for each horizontal label.
 * These values should be passed to getCx() to get pixel positions,
 * ensuring labels align perfectly with data points.
 */
export const getHorizontalLabelPositions = (
    period: DatePeriod,
    count: number
): number[] => {
    switch (period) {
        case DATE_PERIOD.DAY:
            return [
                0,
                6,
                12,
                18,
            ];
        case DATE_PERIOD.WEEK:
            return Array.from({ length: count }, (_, i) => i + 0.5);
        case DATE_PERIOD.MONTH: {
            const step = Math.floor(count / 4);
            return [
                0,
                step,
                step * 2,
                step * 3,
                count - 1,
            ];
        }
        case DATE_PERIOD.SIX_MONTH:
        case DATE_PERIOD.YEAR:
            return Array.from({ length: count }, (_, i) => i + 0.5);
        default:
            return [];
    }
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
        case DATE_PERIOD.DAY: {
            const local = dayjs.utc(item?.fromDate).local();
            // Drop points that do not belong to this day (X is hour-only, so a foreign-day point would
            // otherwise be pinned to its hour in the wrong column). NaN is filtered by the renderer.
            if (local.format('YYYY-MM-DD') !== dayjs(date).format('YYYY-MM-DD')) {
                return NaN;
            }
            return Number(local.format('H')) + Number(local.format('m')) / 60;
        }

        case DATE_PERIOD.WEEK: {
            const labels = [];
            for (let i = count - 1; i >= 0; i--) {
                labels.push(dayjs(date).subtract(i, 'days').format('MMMM-D'));
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
            
            // NaN when the point's date is not in this period → dropped by the renderer's finite check
            // (prevents a foreign/boundary point from being pinned to slot 0 of the wrong period).
            return labelIndex !== -1 ? labelIndex + 0.5 : NaN;
        }

        case DATE_PERIOD.MONTH: {
            const labels = [];
            for (let i = count - 1; i >= 0; i--) {
                labels.push(dayjs(date).subtract(i, 'days').format('MMMM-D'));
            }
            const itemDay = item?.averageDate?.format('MMMM-D');
            const labelIndex = labels.findIndex(label => label === itemDay);
            
            // if (labelIndex === -1) {
            //     console.warn('[calculateXCoordinate] MONTH: Item not found in labels:', {
            //         itemDay,
            //         labels,
            //     });
            // }
            
            return labelIndex !== -1 ? labelIndex : NaN;
        }

        case DATE_PERIOD.SIX_MONTH:
        case DATE_PERIOD.YEAR: {
            // Match by YEAR+MONTH relative to THIS column's date (not month-name off `dayjs()`), so the
            // same month in two different years can't collapse onto one slot, and out-of-window months
            // are dropped (NaN). Window = the `count` months ending at `date`.
            const labels = [];
            for (let i = count - 1; i >= 0; i--) {
                labels.push(dayjs(date).subtract(i, 'month').format('YYYY-MM'));
            }
            const itemMonth = item?.averageDate?.format('YYYY-MM');
            const labelIndex = labels.findIndex(label => label === itemMonth);
            return labelIndex !== -1 ? labelIndex + 0.5 : NaN;
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
    averageDate?: dayjs.Dayjs
): string => {
    switch (period) {
        case DATE_PERIOD.DAY:
            return `${dayjs(fromDate).format('H A')} - ${dayjs(toDate).format('H A')}`;
        case DATE_PERIOD.WEEK:
            return dayjs(fromDate).format('MMM DD, h:mm A');
        case DATE_PERIOD.MONTH:
            return averageDate ? dayjs(averageDate).format('MMM DD') : '';
        case DATE_PERIOD.SIX_MONTH:
            return averageDate ? dayjs(averageDate).format('MMM') : '';
        case DATE_PERIOD.YEAR:
            return averageDate ? dayjs(averageDate).format('MMM') : '';
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
            return dayjs(startDate).format('ll');
        case DATE_PERIOD.WEEK:
            return `${dayjs(startDate).format('ddd M/D')} to ${dayjs(endDate).format('M/D')}`;
        case DATE_PERIOD.MONTH:
            return `${dayjs(startDate).format('MMM')} - ${dayjs(endDate).format('MMM')}`;
        case DATE_PERIOD.SIX_MONTH:
            return `${dayjs(startDate).format('MMM')}-${dayjs(endDate).format('MMM')}`;
        case DATE_PERIOD.YEAR:
            return `${dayjs(startDate).format('YYYY')}-${dayjs(endDate).format('YYYY')}`;
        default:
            return dayjs(startDate).format('dddd, MMM DD, YYYY');
    }
};
