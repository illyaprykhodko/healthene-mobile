// outsource dependencies
import dayjs from 'services/date';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useCallback, useMemo, useLayoutEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
// local dependencies
import { useTheme } from 'hooks/useTheme';
import { ROUTES } from 'constants/routes';
import { MAX_FONT_SCALE } from 'constants/typography.ts';
import { RootStackParamList } from 'services/navigation/types';
import { MeasurementChart } from 'components/MeasurementChart';
import { getMeasurementTabs, shiftPeriodN, type MeasurementTab } from 'constants/measurement-chart';
import {
    useGetLastMeasurementQuery,
    useGetMeasurementTypesQuery,
    useGetAggregateMeasurementDataQuery,
} from 'store/api/dayOverviewApi';

type Navigation = StackNavigationProp<RootStackParamList>;

// Virtualized window: how many periods are kept loaded around the centred one (anchor ± HALF).
const WINDOW_HALF = 3;
const WINDOW_SIZE = WINDOW_HALF * 2 + 1;
// The latest reachable period index (origin = today → k=0 is today's period; k>0 is the future).
const MAX_K = 0;

const MeasurementChartScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute();
    const theme = useTheme();
    const measurementType = (route.params as any)?.measurementType || 'WEIGHT';
    const measurementName = (route.params as any)?.measurementName || measurementType;
    const isBloodPressure = measurementType === 'BLOOD_PRESSURE';
    const offset = dayjs().utcOffset() / 60;

    // Disable the OS edge-swipe-back on this screen — it conflicts with the chart's horizontal scroll.
    useLayoutEffect(() => {
        navigation.setOptions({ gestureEnabled: false });
    }, [navigation]);

    // Fixed reference date; period k is `shiftPeriodN(originDate, period, k)`.
    const [originDate] = useState(() => dayjs().format('YYYY-MM-DD'));
    const [selectedPeriod, setSelectedPeriod] = useState<MeasurementTab['name']>(() => {
        const t = getMeasurementTabs();
        return t[1]?.name ?? t[0].name;
    });
    // Integer index of the currently centred period (0 = today's period, negative = past).
    const [anchorK, setAnchorK] = useState(0);

    // The window of WINDOW_SIZE period slots around the anchor.
    const slots = useMemo(
        () =>
            Array.from({ length: WINDOW_SIZE }, (_, i) => {
                const k = anchorK - WINDOW_HALF + i;
                const date = shiftPeriodN(originDate, selectedPeriod, k);
                const tab = getMeasurementTabs(date).find(t => t.name === selectedPeriod) ?? getMeasurementTabs(date)[0];
                return { k, date, tab };
            }),
        [anchorK, selectedPeriod, originDate]
    );
    const currentDate = slots[WINDOW_HALF].date;
    const activeTab = slots[WINDOW_HALF].tab;

    // Fixed set of WINDOW_SIZE aggregate queries (rules of hooks); future slots (k > MAX_K) are skipped.
    const argOf = (s: (typeof slots)[number]) => ({
        date: s.date,
        offset,
        type: measurementType,
        period: s.tab.request,
    });
    const q0 = useGetAggregateMeasurementDataQuery(argOf(slots[0]), { skip: slots[0].k > MAX_K });
    const q1 = useGetAggregateMeasurementDataQuery(argOf(slots[1]), { skip: slots[1].k > MAX_K });
    const q2 = useGetAggregateMeasurementDataQuery(argOf(slots[2]), { skip: slots[2].k > MAX_K });
    const q3 = useGetAggregateMeasurementDataQuery(argOf(slots[3]), { skip: slots[3].k > MAX_K });
    const q4 = useGetAggregateMeasurementDataQuery(argOf(slots[4]), { skip: slots[4].k > MAX_K });
    const q5 = useGetAggregateMeasurementDataQuery(argOf(slots[5]), { skip: slots[5].k > MAX_K });
    const q6 = useGetAggregateMeasurementDataQuery(argOf(slots[6]), { skip: slots[6].k > MAX_K });
    const queries = [q0, q1, q2, q3, q4, q5, q6];

    const { data: lastMeasurement } = useGetLastMeasurementQuery(measurementType);
    const typesArgs = useMemo(() => ({ dateTime: dayjs().startOf('day').toISOString(), period: '1-year' }), []);
    const { data: measurementTypes } = useGetMeasurementTypesQuery(typesArgs);

    // Split blood-pressure samples into systolic (content) and diastolic (rest). Keep ONLY records
    // that carry BOTH channels, so `content` and `rest` stay index-aligned (the renderer pairs the two
    // by position; a record missing one channel would otherwise shift every following pair).
    const prepareBloodPressureData = (data: any[]) => {
        const content: any[] = [];
        const rest: any[] = [];
        data.forEach(item => {
            const systolic = item.units?.find((u: any) => u.unitType === 'SYSTOLIC');
            const diastolic = item.units?.find((u: any) => u.unitType === 'DIASTOLIC');
            if (!systolic || !diastolic) {
                return;
            }
            content.push({ ...item, units: [systolic] });
            rest.push({ ...item, units: [diastolic] });
        });
        return { content, rest };
    };

    // Normalize aggregate points (dates + averageDate for coordinate mapping).
    const processData = (data: any[]) => {
        const processed = data
            .map(item => {
                const fromDate = dayjs(item?.fromDate);
                const toDate = dayjs(item?.toDate);
                if (!fromDate.isValid() || !toDate.isValid()) {
                    return null;
                }
                const diff = toDate.diff(fromDate) / 2;
                return {
                    ...item,
                    displayFromDate: fromDate.utcOffset(offset * 60).format('MMM DD, h:mm A'),
                    displayToDate: toDate.utcOffset(offset * 60).format('MMM DD, h:mm A'),
                    averageDate: dayjs(fromDate).add(diff, 'ms'),
                    units: isBloodPressure ? [{ ...item?.units?.[0], name: 'mmHg' }] : item?.units,
                };
            })
            .filter(Boolean) as any[];
        return processed.filter(item => item.units?.[0]);
    };

    // Raw aggregate response → chart-ready {chartData, restData} for one page.
    const toPage = (raw: any[]) => {
        if (isBloodPressure) {
            const { content, rest } = prepareBloodPressureData(raw || []);
            return { chartData: processData(content), restData: processData(rest) };
        }
        return { chartData: processData(raw || []), restData: [] as any[] };
    };

    const pages = useMemo(
        () =>
            slots.map((s, i) => {
                const { chartData, restData } = toPage(queries[i].data?.data || []);
                return { k: s.k, date: s.date, tab: s.tab, chartData, restData, isLoading: queries[i].isLoading };
            }),
        // eslint-disable-next-line
        [slots, q0.data, q1.data, q2.data, q3.data, q4.data, q5.data, q6.data]
    );

    const currentValue = useMemo(() => {
        if (!lastMeasurement?.values?.[0]) {
            return undefined;
        }
        if (isBloodPressure && lastMeasurement.values.length >= 2) {
            const systolic = lastMeasurement.values.find(
                (v: any) => v.measurementUnit?.unitType === 'SYSTOLIC' || v.measurementUnit?.id === 1
            );
            const diastolic = lastMeasurement.values.find(
                (v: any) => v.measurementUnit?.unitType === 'DIASTOLIC' || v.measurementUnit?.id === 2
            );
            return {
                unit: 'mmHg',
                isBloodPressure: true,
                value: systolic?.value || 0,
                systolic: systolic?.value || 0,
                diastolic: diastolic?.value || 0,
            };
        }
        const displayUnit = measurementType === 'BMI' ? 'BMI' : lastMeasurement.values[0].measurementUnit?.name || '';
        return { isBloodPressure: false, value: lastMeasurement.values[0].value, unit: displayUnit };
    }, [lastMeasurement, isBloodPressure, measurementType]);

    const currentMeasurement = (measurementTypes || []).find((m: any) => m?.measurement?.type === measurementType);

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
        return {
            startingSystolic,
            startingDiastolic,
            totalChangeSystolic: currentValue?.systolic ? currentValue.systolic - startingSystolic : 0,
            totalChangeDiastolic: currentValue?.diastolic ? currentValue.diastolic - startingDiastolic : 0,
        };
    }, [isBloodPressure, currentMeasurement, currentValue]);

    const startingValue = currentMeasurement?.initialValues?.[0]?.value || 0;
    const totalChange = currentValue ? currentValue.value - startingValue : 0;

    const handleTabChange = useCallback((tab: MeasurementTab) => {
        setSelectedPeriod(tab.name);
        setAnchorK(0);
    }, []);

    const handleAnchorChange = useCallback((k: number) => setAnchorK(k), []);

    const handleShowAllData = useCallback(() => {
        navigation.navigate(ROUTES.ALL_RECORDED_DATA, { measurementType, title: measurementName });
    }, [navigation, measurementType, measurementName]);

    const handleDone = useCallback(() => navigation.goBack(), [navigation]);

    // Only block the whole screen on the very first center-period load (no data yet anywhere).
    const isInitialLoading = q3.isLoading && !pages.some(p => p.chartData.length > 0);

    if (isInitialLoading) {
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
                    maxK={MAX_K}
                    pages={pages}
                    anchorK={anchorK}
                    showSummary={false}
                    activeTab={activeTab}
                    period={selectedPeriod}
                    currentDate={currentDate}
                    totalChange={totalChange}
                    currentValue={currentValue}
                    onTabChange={handleTabChange}
                    startingValue={startingValue}
                    measurementType={measurementType}
                    isBloodPressure={isBloodPressure}
                    onShowAllData={handleShowAllData}
                    onAnchorChange={handleAnchorChange}
                    startingSystolic={bpValues?.startingSystolic}
                    startingDiastolic={bpValues?.startingDiastolic}
                    totalChangeSystolic={bpValues?.totalChangeSystolic}
                    totalChangeDiastolic={bpValues?.totalChangeDiastolic}
                />
            </View>
            <TouchableOpacity onPress={handleDone} style={[styles.doneButton, { backgroundColor: theme.colors.successAlt }]}>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.doneButtonText, { color: theme.colors.successAltText }]}>
                    DONE
                </Text>
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneButton: {
        borderWidth: 0,
        borderRadius: 25,
        paddingVertical: 18,
        marginBottom: 60,
        marginHorizontal: 25,
        alignItems: 'center',
    },
    doneButtonText: {
        fontSize: 20,
        fontWeight: '700',
    },
});
