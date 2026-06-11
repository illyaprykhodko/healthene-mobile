// outsource dependencies
import moment from 'moment';
import { View, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
// local dependencies
import DateTabs from './DateTabs';
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';
import { filters } from 'services/filter';
import ChartRenderer from './ChartRenderer';
import { prepareChartData } from './chart-helpers';
import ShowAllDataButton from './ShowAllDataButton';
import MeasurementSummary from './MeasurementSummary';
import BloodPressureSummary from './BloodPressureSummary';
import { DATE_PERIOD, type MeasurementTab } from 'constants/measurement-chart';

interface MeasurementChartProps {
    data: any[];
    restData?: any[]; // For blood pressure diastolic
    totalChange?: number;
    currentDate?: string; // Date from parent component
    showSummary?: boolean;
    startingValue?: number;
    measurementType: string;
    isBloodPressure?: boolean;
    activeTab: MeasurementTab;
    onShowAllData: () => void;
    onTabChange: (tab: MeasurementTab) => void;
    currentValue?: {
        unit: string;
        value: number;
        systolic?: number;
        diastolic?: number;
        isBloodPressure?: boolean;
    };
    onDateChange: (date: string, period: MeasurementTab['name']) => void;
    // BP-specific props
    startingSystolic?: number;
    startingDiastolic?: number;
    totalChangeSystolic?: number;
    totalChangeDiastolic?: number;
}

const MeasurementChart: React.FC<MeasurementChartProps> = ({
    data,
    activeTab,
    onTabChange,
    currentValue,
    onDateChange,
    restData = [],
    onShowAllData,
    totalChange = 0,
    measurementType,
    startingValue = 0,
    showSummary = true,
    isBloodPressure = false,
    currentDate = moment().format('YYYY-MM-DD'),
    // BP-specific
    startingSystolic,
    startingDiastolic,
    totalChangeSystolic,
    totalChangeDiastolic,
}) => {
    const theme = useTheme();
    const [tooltip, setTooltip] = useState<any | null>(null);
    const currentStart = activeTab.options.startDate;
    const currentEnd = activeTab.options.endDate;
    // Sync internal date state with prop
    // useEffect(() => {
    //     setDate(initialDate);
    // }, [initialDate]);

    // Handle swipe gesture
    const onPanGesture = useCallback(
        (event: any) => {
            if (!event?.nativeEvent) { return; }
            const { translationX, state } = event.nativeEvent;

            if (Math.abs(translationX) > 50 && Math.abs(translationX) < 300 && state === State.END) {
                setTooltip(null);
                // let newDate: string | undefined;
                let newStart = currentStart;
                let newEnd = currentEnd;
                let newDate = currentDate;
                if (translationX > 0) {
                    // Swipe right - go back in time
                    switch (activeTab.name) {
                        case DATE_PERIOD.DAY:
                            newDate = moment(currentDate).subtract(1, 'day').format('YYYY-MM-DD');
                            newStart = moment(currentStart).subtract(1, 'day').format('YYYY-MM-DD');
                            newEnd = moment(currentEnd).subtract(1, 'day').format('YYYY-MM-DD');
                            break;
                        case DATE_PERIOD.WEEK:
                            newDate = moment(currentDate).subtract(1, 'week').format('YYYY-MM-DD');
                            newStart = moment(currentStart).subtract(1, 'week').format('YYYY-MM-DD');
                            newEnd = moment(currentEnd).subtract(1, 'week').format('YYYY-MM-DD');
                            break;
                        case DATE_PERIOD.MONTH:
                            newDate = moment(currentDate).subtract(1, 'month').format('YYYY-MM-DD');
                            newStart = moment(currentStart).subtract(1, 'month').format('YYYY-MM-DD');
                            newEnd = moment(currentEnd).subtract(1, 'month').format('YYYY-MM-DD');
                            break;
                        case DATE_PERIOD.SIX_MONTH:
                            newDate = moment(currentDate).subtract(6, 'months').format('YYYY-MM-DD');
                            newStart = moment(currentStart).subtract(6, 'months').format('YYYY-MM-DD');
                            newEnd = moment(currentEnd).subtract(6, 'months').format('YYYY-MM-DD');
                            break;
                        case DATE_PERIOD.YEAR:
                            newDate = moment(currentDate).subtract(1, 'year').format('YYYY-MM-DD');
                            newStart = moment(currentStart).subtract(1, 'year').format('YYYY-MM-DD');
                            newEnd = moment(currentEnd).subtract(1, 'year').format('YYYY-MM-DD');
                            break;
                        default:
                            console.error(`Unknown tab: ${activeTab.name}`);
                            break;
                    }
                } else if (translationX < 0) {
                    // Swipe left - go forward in time
                    switch (activeTab.name) {
                        case DATE_PERIOD.DAY:
                            newDate = moment(currentDate).add(1, 'day').format('YYYY-MM-DD');
                            newStart = moment(currentStart).add(1, 'day').format('YYYY-MM-DD');
                            newEnd = moment(currentEnd).add(1, 'day').format('YYYY-MM-DD');
                            break;
                        case DATE_PERIOD.WEEK:
                            newDate = moment(currentDate).add(1, 'week').format('YYYY-MM-DD');
                            newStart = moment(currentStart).add(1, 'week').format('YYYY-MM-DD');
                            newEnd = moment(currentEnd).add(1, 'week').format('YYYY-MM-DD');
                            break;
                        case DATE_PERIOD.MONTH:
                            newDate = moment(currentDate).add(1, 'month').format('YYYY-MM-DD');
                            newStart = moment(currentStart).add(1, 'month').format('YYYY-MM-DD');
                            newEnd = moment(currentEnd).add(1, 'month').format('YYYY-MM-DD');
                            break;
                        case DATE_PERIOD.SIX_MONTH:
                            newDate = moment(currentDate).add(6, 'months').format('YYYY-MM-DD');
                            newStart = moment(currentStart).add(6, 'months').format('YYYY-MM-DD');
                            newEnd = moment(currentEnd).add(6, 'months').format('YYYY-MM-DD');
                            break;
                        case DATE_PERIOD.YEAR:
                            newDate = moment(currentDate).add(1, 'year').format('YYYY-MM-DD');
                            newStart = moment(currentStart).add(1, 'year').format('YYYY-MM-DD');
                            newEnd = moment(currentEnd).add(1, 'year').format('YYYY-MM-DD');
                            break;
                        default:
                            console.error(`Unknown tab: ${activeTab.name}`);
                            break;
                    }
                }

                if (newStart && newStart !== currentStart) {
                    onDateChange(newDate, activeTab.name);
                }
            }
        },
        [activeTab, currentStart, currentEnd, onDateChange, currentDate]
    );

    const handleTabChange = useCallback(
        (tab: MeasurementTab) => {
            setTooltip(null);
            onTabChange(tab);
        },
        [onTabChange]
    );

    // Prepare chart points with coordinates
    const chartPoints = useMemo(
        () => {
            const points = prepareChartData(
                data,
                activeTab.name,
                currentDate,
                activeTab.count,
                isBloodPressure,
                restData
            );
            return points;
        },
        [data, activeTab, isBloodPressure, restData, currentDate]
    );

    const chartRestPoints = useMemo(
        () =>
            (isBloodPressure && restData.length > 0
                ? prepareChartData(
                    restData,
                    activeTab.name,
                    currentDate,
                    activeTab.count,
                    false
                )
                : []),
        [restData, activeTab, isBloodPressure, currentDate]
    );
    return (
        <PanGestureHandler onHandlerStateChange={onPanGesture}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.title, { color: theme.colors.textSecondary }]}>{filters.humanize(measurementType)}</Text>
                <DateTabs
                    date={currentDate}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                />
                {isBloodPressure && startingSystolic !== undefined && startingDiastolic !== undefined ? (
                    <BloodPressureSummary
                        startingSystolic={startingSystolic}
                        unit={currentValue?.unit || 'mmHg'}
                        startingDiastolic={startingDiastolic}
                        totalChangeSystolic={totalChangeSystolic || 0}
                        totalChangeDiastolic={totalChangeDiastolic || 0}
                    />
                ) : (
                    <MeasurementSummary
                        totalChange={totalChange}
                        startingValue={startingValue}
                        unit={currentValue?.unit || ''}
                    />
                )}
                <ChartRenderer
                    tooltip={tooltip}
                    points={chartPoints}
                    activeTab={activeTab}
                    currentValue={currentValue}
                    restPoints={chartRestPoints}
                    isBloodPressure={isBloodPressure}
                    onPointPress={point => setTooltip(point)}
                />
                <ShowAllDataButton onPress={onShowAllData} />
            </View>
        </PanGestureHandler>
    );
};

export default MeasurementChart;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: '400',
        marginVertical: 5,
        alignSelf: 'center',
    },
});
