// outsource dependencies
import moment from 'moment';
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
// local dependencies
import { MeasurementChart } from 'components/MeasurementChart';
import { getMeasurementTabs, type MeasurementTab } from 'constants/measurement-chart';
// import type { MeasurementTab } from '../../constants/measurement-chart';
import {
    useGetLastMeasurementQuery,
    useGetMeasurementTypesQuery,
    useGetAggregateMeasurementDataQuery,
} from '../../store/api/dayOverviewApi';
import { useTheme } from 'hooks/useTheme';
import { ROUTES } from 'constants/routes';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from 'services/navigation/types';

type Navigation = StackNavigationProp<RootStackParamList>;

const MeasurementChartScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute();
    const theme = useTheme();
    // Get measurement type and name from route params
    const measurementType = (route.params as any)?.measurementType || 'WEIGHT';
    const measurementName = (route.params as any)?.measurementName || measurementType;
    
    const [activeTab, setActiveTab] = useState<MeasurementTab>(getMeasurementTabs()[1]); // Week by default
    const [date, setDate] = useState(moment().format('YYYY-MM-DD'));

    // Fetch aggregate data
    const { data: aggregateData, isLoading: isLoadingAggregate } = useGetAggregateMeasurementDataQuery({
        type: measurementType,
        period: activeTab.request,
        date,
        offset: moment().utcOffset() / 60,
    });

    // Fetch last measurement
    const { data: lastMeasurement, currentData: currentLastMeasurement } = useGetLastMeasurementQuery(measurementType);
    // Fetch measurement types for initial values
    // const response = useGetMeasurementTypesQuery({
    //     dateTime: moment().toISOString(),
    //     period: '1-year', // TODO: change to activeTab.request
    // });
    const queryArgs = React.useMemo(() => ({
        dateTime: moment().startOf('day').toISOString(),
        period: '1-year',
    }), []);
      
    const { data: measurementTypes } = useGetMeasurementTypesQuery(queryArgs);
    // Prepare data - process raw data from API
    const offset = moment().utcOffset() / 60;
    
    // Separate blood pressure data into systolic and diastolic
    const prepareBloodPressureData = (data: any[]) => {
        const content: any[] = [];
        const rest: any[] = [];
        
        data.forEach(item => {
            content.push({
                ...item,
                units: [item.units?.find((u: any) => u.unitType === 'SYSTOLIC')],
            });
            rest.push({
                ...item,
                units: [item.units?.find((u: any) => u.unitType === 'DIASTOLIC')],
            });
        });
        
        return { content, rest };
    };
    
    // Process data with averageDate (keep as Moment object!)
    const processData = (data: any[]) => {
        const processed = data.map(item => {
            const fromDate = moment(item?.fromDate);
            const toDate = moment(item?.toDate);
            const diff = toDate.diff(fromDate) / 2;
            
            return {
                ...item,
                toDate: moment(item?.toDate).utcOffset(offset).format('YYYY-MM-DD HH:mm:ss'),
                fromDate: moment(item?.fromDate).utcOffset(offset).format('YYYY-MM-DD HH:mm:ss'),
                // Keep averageDate as Moment object for calculateXCoordinate
                averageDate: moment(fromDate).add(diff, 'ms'),
            };
        });

        const filtered = processed.filter(item => item.units?.[0]);

        return filtered;
    };
    
    const isBloodPressure = measurementType === 'BLOOD_PRESSURE';
    const rawData = aggregateData?.data || [];
    
    let chartData: any[] = [];
    let restData: any[] = [];
    
    if (isBloodPressure) {
        const { content, rest } = prepareBloodPressureData(rawData);
        chartData = processData(content);
        restData = processData(rest);
    } else {
        chartData = processData(rawData);
    }

    // Current value - ALWAYS show last measurement (doesn't change on swipe)
    // Only the date below it changes on swipe to show current period
    const currentValue = useMemo(() => {
        if (lastMeasurement?.values?.[0]) {
            const result = {
                value: lastMeasurement.values[0].value,
                unit: isBloodPressure ? 'mmHg' : lastMeasurement.values[0].measurementUnit?.name || '',
            };
            return result;
        }
        return undefined;
    }, [lastMeasurement, measurementType]);

    // Calculate starting value and total change
    const currentMeasurement = (measurementTypes?.content || []).find(
        (m: any) => m?.measurement?.type === measurementType
    );
    const startingValue = currentMeasurement?.initialValues?.[0]?.value || 0;
    const totalChange = currentValue ? currentValue.value - startingValue : 0;

    // Handle tab change
    const handleTabChange = useCallback((tab: MeasurementTab) => {
        setActiveTab(tab);
    }, []);

    // Handle date change (from swipe)
    const handleDateChange = useCallback((newDate: string, tab: MeasurementTab) => {
        setDate(newDate);
        setActiveTab(tab);
    }, [date, activeTab]);

    // Navigate to All Recorded Data
    const handleShowAllData = useCallback(() => {
        navigation.navigate(ROUTES.ALL_RECORDED_DATA, {
            measurementType,
            title: measurementName,
        });
    }, [navigation, measurementType, measurementName]);

    // Handle DONE button - navigate back to DayOverview
    const handleDone = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    if (isLoadingAggregate) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2978A0" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={{ height: '90%' }}>
                <MeasurementChart
                    data={chartData}
                    initialDate={date} // Pass date from parent
                    showSummary={false} // Current value now shown in ChartRenderer renderTopBar
                    restData={restData}
                    activeTab={activeTab}
                    totalChange={totalChange}
                    currentValue={currentValue}
                    onTabChange={handleTabChange}
                    startingValue={startingValue}
                    onDateChange={handleDateChange}
                    measurementType={measurementType}
                    isBloodPressure={isBloodPressure}
                    onShowAllData={handleShowAllData}
                />
            </View>
            
            {/* DONE Button */}
            <TouchableOpacity
                onPress={handleDone}
                style={[styles.doneButton, { backgroundColor: theme.colors.successAlt || '#96E072' }]}
            >
                <Text style={[styles.doneButtonText, { color: theme.colors.successAltText || '#4E733C' }]}>DONE</Text>
            </TouchableOpacity>
        </View>
    );
};

export default MeasurementChartScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    doneButton: {
        borderWidth: 0,
        // backgroundColor moved to inline style with theme
        paddingVertical: 18,
        marginHorizontal: 25,
        marginBottom: 60,
        // marginTop: 20,
        borderRadius: 25,
        alignItems: 'center',
    },
    doneButtonText: {
        // color moved to inline style with theme
        fontSize: 20,
        fontWeight: '700',
    },
});

