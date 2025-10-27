/**
 * MeasurementChart Component
 * Main chart component with SVG visualization, gestures and animations
 */

import moment from 'moment';
import { View, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import React, { useState, useCallback, useEffect, useMemo } from 'react';

import DateTabs from './DateTabs';
import ChartRenderer from './ChartRenderer';
import { prepareChartData } from './chart-helpers';
import ShowAllDataButton from './ShowAllDataButton';
import MeasurementSummary from './MeasurementSummary';
import { DATE_PERIOD, type MeasurementTab } from 'constants/measurement-chart';

interface MeasurementChartProps {
    data: any[];
    restData?: any[]; // For blood pressure diastolic
    totalChange?: number;
    initialDate?: string; // Date from parent component
    showSummary?: boolean;
    startingValue?: number;
    measurementType: string;
    isBloodPressure?: boolean;
    activeTab: MeasurementTab;
    onShowAllData: () => void;
    onTabChange: (tab: MeasurementTab) => void;
    currentValue?: { value: number; unit: string };
    onDateChange: (date: string, tab: MeasurementTab) => void;
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
    initialDate = moment().format('YYYY-MM-DD'),
}) => {
    const [tooltip, setTooltip] = useState<any | null>(null);
    const [date, setDate] = useState(initialDate);

    // Sync internal date state with prop
    useEffect(() => {
        setDate(initialDate);
    }, [initialDate]);

    // Handle swipe gesture
    const onPanGesture = useCallback(
        (event: any) => {
            if (!event?.nativeEvent) { return; }
            const { translationX, state } = event.nativeEvent;

            if (Math.abs(translationX) > 50 && Math.abs(translationX) < 300 && state === State.END) {
                setTooltip(null);
                let newDate: string | undefined;

                if (translationX > 0) {
                    // Swipe right - go back in time
                    switch (activeTab.name) {
                        case DATE_PERIOD.DAY:
                            newDate = moment(date).subtract(1, 'day').format('YYYY-MM-DD');
                            break;
                        case DATE_PERIOD.WEEK:
                            newDate = moment(date).subtract(1, 'week').format('YYYY-MM-DD');
                            break;
                        case DATE_PERIOD.MONTH:
                            newDate = moment(date).subtract(1, 'month').format('YYYY-MM-DD');
                            break;
                        case DATE_PERIOD.SIX_MONTH:
                            newDate = moment(date).subtract(6, 'months').format('YYYY-MM-DD');
                            break;
                        case DATE_PERIOD.YEAR:
                            newDate = moment(date).subtract(1, 'year').format('YYYY-MM-DD');
                            break;
                        default:
                            console.error(`Unknown tab: ${activeTab.name}`);
                            break;
                    }
                } else if (translationX < 0) {
                    // Swipe left - go forward in time
                    switch (activeTab.name) {
                        case DATE_PERIOD.DAY:
                            newDate = moment(date).add(1, 'day').format('YYYY-MM-DD');
                            break;
                        case DATE_PERIOD.WEEK:
                            newDate = moment(date).add(1, 'week').format('YYYY-MM-DD');
                            break;
                        case DATE_PERIOD.MONTH:
                            newDate = moment(date).add(1, 'month').format('YYYY-MM-DD');
                            break;
                        case DATE_PERIOD.SIX_MONTH:
                            newDate = moment(date).add(6, 'months').format('YYYY-MM-DD');
                            break;
                        case DATE_PERIOD.YEAR:
                            newDate = moment(date).add(1, 'year').format('YYYY-MM-DD');
                            break;
                        default:
                            console.error(`Unknown tab: ${activeTab.name}`);
                            break;
                    }
                }

                if (newDate && newDate !== date) {
                    setDate(newDate);
                    onDateChange(newDate, activeTab);
                }
            }
        },
        [activeTab, date, onDateChange]
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
                date,
                activeTab.count,
                isBloodPressure,
                restData
            );
            return points;
        },
        [data, activeTab, date, isBloodPressure, restData]
    );

    const chartRestPoints = useMemo(
        () =>
            (isBloodPressure && restData.length > 0
                ? prepareChartData(
                    restData,
                    activeTab.name,
                    date,
                    activeTab.count,
                    false
                )
                : []),
        [restData, activeTab, date, isBloodPressure]
    );

    return (
        <PanGestureHandler onHandlerStateChange={onPanGesture}>
            <View style={styles.container}>
                <DateTabs
                    date={date}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                />
                <MeasurementSummary
                    totalChange={totalChange}
                    startingValue={startingValue}
                    unit={currentValue?.unit || ''}
                />
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
        backgroundColor: '#FFFFFF',
    },
});

