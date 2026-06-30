// outsource dependencies
import moment from 'moment';
import React, { useState, useCallback, useMemo } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
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
} from 'store/api/dayOverviewApi';
import { useTheme } from 'hooks/useTheme';
import { ROUTES } from 'constants/routes';
import { MAX_FONT_SCALE } from 'constants/typography.ts';
import { RootStackParamList } from 'services/navigation/types';

type Navigation = StackNavigationProp<RootStackParamList>;

const MeasurementChartScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute();
    const theme = useTheme();
    const measurementType = (route.params as any)?.measurementType || 'WEIGHT';
    const measurementName = (route.params as any)?.measurementName || measurementType;
    
    const [currentDate, setCurrentDate] = useState(() => moment().format('YYYY-MM-DD'));
    const [selectedPeriod, setSelectedPeriod] = useState<MeasurementTab['name']>(() => {
        const tabs = getMeasurementTabs();
        return tabs[1]?.name ?? tabs[0].name;
    });

    const tabs = useMemo(
        () => getMeasurementTabs(currentDate),
        [currentDate]
    );

    const activeTab = useMemo(
        () => tabs.find(tab => tab.name === selectedPeriod) ?? tabs[0],
        [tabs, selectedPeriod]
    );

    const { data: aggregateData, isLoading: isLoadingAggregate } = useGetAggregateMeasurementDataQuery({
        date: currentDate,
        type: measurementType,
        period: activeTab.request,
        offset: moment().utcOffset() / 60,
    });

    const { data: lastMeasurement } = useGetLastMeasurementQuery(measurementType);

    const queryArgs = React.useMemo(() => ({
        dateTime: moment().startOf('day').toISOString(),
        period: '1-year',
    }), []);
      
    const { data: measurementTypes } = useGetMeasurementTypesQuery(queryArgs);
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
        const processed = data
            .map(item => {
                const fromDate = moment(item?.fromDate);
                const toDate = moment(item?.toDate);
                if (!fromDate.isValid() || !toDate.isValid()) {
                    return null;
                }
                const diff = toDate.diff(fromDate) / 2;
                return {
                    ...item,
                    displayFromDate: fromDate.clone().utcOffset(offset).format('MMM DD, h:mm A'),
                    displayToDate: toDate.clone().utcOffset(offset).format('MMM DD, h:mm A'),
                    // Keep averageDate as Moment object for calculateXCoordinate
                    averageDate: moment(fromDate).add(diff, 'ms'),
                    units: isBloodPressure ? [{ ...item?.units?.[0], name: 'mmHg' }] : item?.units,
                };
            })
            .filter(Boolean) as any[];

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

    const currentValue = useMemo(() => {
        if (!lastMeasurement?.values?.[0]) {
            return undefined;
        }
        if (isBloodPressure && lastMeasurement.values.length >= 2) {
            const systolic = lastMeasurement.values.find((v: any) =>
                v.measurementUnit?.unitType === 'SYSTOLIC' || v.measurementUnit?.id === 1
            );
            const diastolic = lastMeasurement.values.find((v: any) =>
                v.measurementUnit?.unitType === 'DIASTOLIC' || v.measurementUnit?.id === 2
            );

            return {
                unit: 'mmHg',
                isBloodPressure: true,
                value: systolic?.value || 0,
                systolic: systolic?.value || 0,
                diastolic: diastolic?.value || 0,
            };
        }

        // Single value measurements
        const displayUnit = measurementType === 'BMI'
            ? 'BMI'
            : lastMeasurement.values[0].measurementUnit?.name || '';

        return {
            isBloodPressure: false,
            value: lastMeasurement.values[0].value,
            unit: displayUnit,
        };
    }, [lastMeasurement, isBloodPressure, measurementType]);

    // Calculate starting value and total change
    const currentMeasurement = (measurementTypes || []).find(
        (m: any) => m?.measurement?.type === measurementType
    );
    
    // BP-specific: extract both systolic and diastolic starting values and calculate changes
    const bpValues = useMemo(() => {
        if (!isBloodPressure || !currentMeasurement?.initialValues) {
            return null;
        }
        
        const systolicInitial = currentMeasurement.initialValues.find(
            (v: any) => v.measurementUnit?.unitType === 'SYSTOLIC' || v.measurementUnit?.id === 1
        );
        const diastolicInitial = currentMeasurement.initialValues.find(
            (v: any) => v.measurementUnit?.unitType === 'DIASTOLIC' || v.measurementUnit?.id === 2
        );
        
        const startingSystolic = systolicInitial?.value || 0;
        const startingDiastolic = diastolicInitial?.value || 0;
        const totalChangeSystolic = currentValue?.systolic ? currentValue.systolic - startingSystolic : 0;
        const totalChangeDiastolic = currentValue?.diastolic ? currentValue.diastolic - startingDiastolic : 0;
        
        return {
            startingSystolic,
            startingDiastolic,
            totalChangeSystolic,
            totalChangeDiastolic,
        };
    }, [isBloodPressure, currentMeasurement, currentValue]);
    
    const startingValue = currentMeasurement?.initialValues?.[0]?.value || 0;
    const totalChange = currentValue ? currentValue.value - startingValue : 0;

    const handleTabChange = useCallback((tab: MeasurementTab) => {
        setSelectedPeriod(tab.name);
    }, []);

    const handleDateChange = useCallback((newDate: string, period: MeasurementTab['name']) => {
        setCurrentDate(newDate);
        setSelectedPeriod(period);
    }, []);

    // Navigate to All Recorded Data
    const handleShowAllData = useCallback(() => {
        navigation.navigate(ROUTES.ALL_RECORDED_DATA, {
            measurementType,
            title: measurementName,
        });
    }, [navigation, measurementType, measurementName]);

    const handleDone = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    if (isLoadingAggregate) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.info} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={{ height: '90%' }}>
                <MeasurementChart
                    data={chartData}
                    showSummary={false}
                    restData={restData}
                    activeTab={activeTab}
                    currentDate={currentDate}
                    totalChange={totalChange}
                    currentValue={currentValue}
                    onTabChange={handleTabChange}
                    startingValue={startingValue}
                    onDateChange={handleDateChange}
                    measurementType={measurementType}
                    isBloodPressure={isBloodPressure}
                    onShowAllData={handleShowAllData}
                    // BP-specific props
                    startingSystolic={bpValues?.startingSystolic}
                    startingDiastolic={bpValues?.startingDiastolic}
                    totalChangeSystolic={bpValues?.totalChangeSystolic}
                    totalChangeDiastolic={bpValues?.totalChangeDiastolic}
                />
            </View>
            <TouchableOpacity
                onPress={handleDone}
                style={[styles.doneButton, { backgroundColor: theme.colors.successAlt }]}
            >
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.doneButtonText, { color: theme.colors.successAltText }]}>DONE</Text>
            </TouchableOpacity>
        </View>
    );
};

export default MeasurementChartScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneButton: {
        borderWidth: 0,
        paddingVertical: 18,
        marginHorizontal: 25,
        marginBottom: 60,
        // marginTop: 20,
        borderRadius: 25,
        alignItems: 'center',
    },
    doneButtonText: {
        fontSize: 20,
        fontWeight: '700',
    },
});
