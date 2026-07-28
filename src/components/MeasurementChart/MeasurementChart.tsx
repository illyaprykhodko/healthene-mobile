// outsource dependencies
import { View, StyleSheet } from 'react-native';
import React, { useCallback, useMemo } from 'react';
// local dependencies
import DateTabs from './DateTabs';
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';
import { filters } from 'services/filter';
import ChartCarousel from './ChartCarousel';
import { prepareChartData } from './chart-helpers';
import ShowAllDataButton from './ShowAllDataButton';
import MeasurementSummary from './MeasurementSummary';
import BloodPressureSummary from './BloodPressureSummary';
import { type MeasurementTab, type DatePeriod } from 'constants/measurement-chart';

// One loaded period page in the virtualized window (raw, pre-coordinate-mapping).
interface RawPage {
    k: number;
    date: string;
    restData: any[];
    chartData: any[];
    tab: MeasurementTab;
    isLoading?: boolean;
}

interface MeasurementChartProps {
    maxK: number;
    anchorK: number;
    pages: RawPage[];
    period: DatePeriod;
    currentDate: string;
    totalChange?: number;
    showSummary?: boolean;
    startingValue?: number;
    measurementType: string;
    activeTab: MeasurementTab;
    isBloodPressure?: boolean;
    onShowAllData: () => void;
    onAnchorChange: (k: number) => void;
    onTabChange: (tab: MeasurementTab) => void;
    currentValue?: {
        unit: string;
        value: number;
        systolic?: number;
        diastolic?: number;
        isBloodPressure?: boolean;
    };
    // BP-specific
    startingSystolic?: number;
    startingDiastolic?: number;
    totalChangeSystolic?: number;
    totalChangeDiastolic?: number;
}

const MeasurementChart: React.FC<MeasurementChartProps> = ({
    maxK,
    pages,
    period,
    anchorK,
    activeTab,
    onTabChange,
    currentDate,
    currentValue,
    onAnchorChange,
    onShowAllData,
    totalChange = 0,
    measurementType,
    startingValue = 0,
    isBloodPressure = false,
    startingSystolic,
    startingDiastolic,
    totalChangeSystolic,
    totalChangeDiastolic,
}) => {
    const theme = useTheme();

    const handleTabChange = useCallback((tab: MeasurementTab) => onTabChange(tab), [onTabChange]);

    // Map each raw page to chart coordinates using its own tab + date.
    const chartPages = useMemo(
        () =>
            pages.map(p => ({
                k: p.k,
                tab: p.tab,
                isLoading: p.isLoading,
                chartData: prepareChartData(p.chartData, p.tab.name, p.date, p.tab.count, isBloodPressure, p.restData),
                restData:
                    isBloodPressure && p.restData.length > 0
                        ? prepareChartData(p.restData, p.tab.name, p.date, p.tab.count, false)
                        : [],
            })),
        [pages, isBloodPressure]
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.title, { color: theme.colors.textSecondary }]}>{filters.humanize(measurementType)}</Text>
            <DateTabs date={currentDate} activeTab={activeTab} onTabChange={handleTabChange} />
            {isBloodPressure && startingSystolic !== undefined && startingDiastolic !== undefined ? (
                <BloodPressureSummary
                    unit={currentValue?.unit || 'mmHg'}
                    startingSystolic={startingSystolic}
                    startingDiastolic={startingDiastolic}
                    totalChangeSystolic={totalChangeSystolic || 0}
                    totalChangeDiastolic={totalChangeDiastolic || 0}
                />
            ) : (
                <MeasurementSummary totalChange={totalChange} startingValue={startingValue} unit={currentValue?.unit || ''} />
            )}
            <ChartCarousel
                maxK={maxK}
                period={period}
                anchorK={anchorK}
                pages={chartPages}
                currentValue={currentValue}
                onAnchorChange={onAnchorChange}
                isBloodPressure={isBloodPressure}
            />
            <ShowAllDataButton onPress={onShowAllData} />
        </View>
    );
};

export default MeasurementChart;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        marginVertical: 5,
        fontWeight: '400',
        alignSelf: 'center',
    },
});
