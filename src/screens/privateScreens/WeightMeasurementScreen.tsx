// outsource dependencies
import {
    View,
    Text,
    Platform,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import * as yup from 'yup';
import moment from 'moment';
import { Formik } from 'formik';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import React, { useState, useCallback, useRef } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useRoute } from '@react-navigation/native';

// local dependencies
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { SwipeablePanel } from 'components/SwipeablePanel';
import { RootStackParamList } from 'services/navigation/types';
import { useMeasurementSubmit } from 'hooks/useMeasurementSubmit';
import { useGetAggregateMeasurementDataQuery } from 'store/api/dayOverviewApi';

type Navigation = StackNavigationProp<RootStackParamList>;

const validationSchema = yup.object().shape({
    value: yup
        .string()
        .matches(/^\d+([.,]\d{1})?$/, { message: 'Shouldn\'t have more than 1 symbol after comma' })
        .required('Weight is required'),
});

const WeightMeasurementScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute();
    const theme = useTheme();
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const measurementPhaseItem = (route.params as any)?.measurementPhaseItem;
    const currentDate = (route.params as any)?.date || moment().format('YYYY-MM-DD');
    const isFutureDay = moment(currentDate).isAfter(moment(), 'day');

    const item = measurementPhaseItem || {};
    const { data: aggregateData } = useGetAggregateMeasurementDataQuery({
        type: 'WEIGHT',
        period: '1-day',
        date: currentDate,
        offset: moment().utcOffset() / 60,
    });
    const hasRecentWeight = aggregateData?.data?.length > 0;
    const lastSubmittedValueRef = useRef<string | null>(null);
    // const hasRecentWeight = aggregateData?.totalLastValuesByUnitType?.DEFAULT !== null
    //     && aggregateData?.totalLastValuesByUnitType?.DEFAULT !== undefined;
    const { submit, isSubmitting } = useMeasurementSubmit(item, {
        onSuccess: () => {
            (navigation as any).navigate('SaveValue', {
                date: currentDate,
                measurementPhaseItem: item,
                savedValue: lastSubmittedValueRef.current,
                measurementType: item?.measurement?.type || 'WEIGHT',
                measurementName: item?.measurement?.name || 'Weight',
            });
            // navigation.navigate(ROUTES.DAY_OVERVIEW);
            // navigation.goBack();
        },
        onError: error => {
            // console.error('[WeightMeasurementScreen] Submit error:', error);
        },
    });

    const handleSmartScalePress = useCallback(() => {
        if (isPanelOpen) {
            setIsPanelOpen(false);
            return;
        }
        navigation.navigate(ROUTES.SMART_SCALE, {
            measurementPhaseItem: item,
        });
    }, [navigation, item, isPanelOpen]);

    const handleManualPress = useCallback(() => {
        setIsPanelOpen(!isPanelOpen);
    }, [isPanelOpen]);

    const handleSubmit = useCallback(
        async (values: { value: string }) => {
            setIsPanelOpen(false);
            const normalizedValue = values.value.replace(',', '.');
            lastSubmittedValueRef.current = normalizedValue;
            await submit(
                { value: normalizedValue },
                'HEALTHENE_MANUAL_INPUT',
                'lbs'
            );
        },
        [submit]
    );

    return (<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {isPanelOpen && (
            <TouchableOpacity
                activeOpacity={1}
                style={styles.overlayBackground}
                onPress={() => setIsPanelOpen(false)}
            />
        )}
        <TouchableOpacity
            disabled={isFutureDay}
            onPress={handleSmartScalePress}
            style={[
                styles.scaleButton,
                isFutureDay && styles.opacityFuture,
                { borderColor: theme.colors.success, backgroundColor: theme.colors.muted }
            ]}
        >
            <Text style={[styles.scaleButtonText, { color: theme.colors.darkGrey }]}>
                    Step on Scale
            </Text>
        </TouchableOpacity>
        <TouchableOpacity
            disabled={isFutureDay}
            onPress={handleManualPress}
            style={[
                styles.manualButton,
                isFutureDay && styles.opacityFuture,
                { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }
            ]}
        >
            <Text style={[styles.manualButtonText, { color: theme.colors.primary }]}>
                {isSubmitting
                    ? <ActivityIndicator size="small" color={theme.colors.primary} />
                    : 'Add your Weight Manually'
                }
            </Text>
        </TouchableOpacity>
        <SwipeablePanel
            snapPoints={['75%']}
            isActive={isPanelOpen}
            showCloseButton={false}
            keyboardBehavior="extend"
            style={styles.swipeablePanel}
            onClose={() => setIsPanelOpen(false)}
        >
            <Formik
                onSubmit={handleSubmit}
                initialValues={{ value: '' }}
                validationSchema={validationSchema}
            >
                {({ values, errors, touched, setFieldValue, setFieldTouched, handleSubmit }) => (
                    <View style={styles.formContainer}>
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={() => setIsPanelOpen(false)}
                            >
                                <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>
                                        Cancel
                                </Text>
                            </TouchableOpacity>
                            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                                    Weight
                            </Text>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={() => handleSubmit()}
                                disabled={!values.value || !!errors.value || isSubmitting}
                            >
                                <Text
                                    style={[styles.headerButtonText,
                                        {
                                            color: !values.value || errors.value
                                                ? theme.colors.textSecondary
                                                : theme.colors.primary,
                                        },
                                    ]}
                                >
                                    Add
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {!hasRecentWeight && (
                            <Text style={[styles.noRecentDataText, { color: theme.colors.primary }]}>
                                    No Weight was recorded recently - please add it manually
                            </Text>
                        )}
                        <View style={styles.dateContainer}>
                            <View style={[styles.item, { borderBottomColor: theme.colors.border }]}>
                                <Text style={[styles.itemLabel, { color: theme.colors.text }]}>
                                        Date
                                </Text>
                                <Text style={[styles.itemValue, { color: theme.colors.text }]}>
                                    {moment().format('MMM Do YY')}
                                </Text>
                            </View>
                            <View style={[styles.item, { borderBottomColor: theme.colors.border }]}>
                                <Text style={[styles.itemLabel, { color: theme.colors.text }]}>
                                        Time
                                </Text>
                                <Text style={[styles.itemValue, { color: theme.colors.text }]}>
                                    {moment().format('LT')}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.item,
                                    { borderBottomColor: theme.colors.border },
                                    errors.value && touched.value && styles.errorInput,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.itemLabel,
                                        { color: theme.colors.text },
                                        errors.value && touched.value && styles.errorText,
                                    ]}
                                >
                                        lbs.
                                </Text>
                                <BottomSheetTextInput
                                    maxLength={40}
                                    placeholder="0.0"
                                    value={values.value}
                                    keyboardType="decimal-pad"
                                    onBlur={() => setFieldTouched('value')}
                                    placeholderTextColor={theme.colors.textSecondary}
                                    onChangeText={text => {
                                        const processedText = text.replace(/[^0-9.,]/g, '');
                                        const parts = processedText.split('.');
                                        if (parts.length <= 2) {
                                            setFieldValue('value', processedText);
                                        }
                                    }}
                                    style={[
                                        styles.input,
                                        { color: theme.colors.text },
                                        Platform.OS === 'ios' && styles.inputIOS,
                                    ]}
                                />
                            </View>
                            {errors.value && touched.value && (
                                <Text style={[styles.errorTextSmall, { color: theme.colors.error }]}>
                                    {errors.value}
                                </Text>
                            )}
                        </View>
                    </View>
                )}
            </Formik>
        </SwipeablePanel>
    </View>
    );
};

export default WeightMeasurementScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    swipeablePanel: {
        paddingTop: 25,
    },
    overlayBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#DADADA99',
        zIndex: 1,
    },
    scaleButton: {
        marginTop: 70,
        marginHorizontal: 20,
        paddingVertical: OFFSET.VERTICAL * 2,
        borderWidth: 2,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scaleButtonText: {
        fontSize: 24,
        fontWeight: '600',
    },
    manualButton: {
        marginTop: 30,
        marginHorizontal: 20,
        paddingVertical: 16,
        borderWidth: 2,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    manualButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    formContainer: {
        padding: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    },
    headerButton: {
        // width: '33.33%',
    },
    headerButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerTitle: {
        // width: '33.33%',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    dateContainer: {
        paddingTop: 10,
    },
    noRecentDataText: {
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '500',
        marginBottom: 8,
        paddingHorizontal: 12,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    itemLabel: {
        fontSize: 18,
        fontWeight: '500',
    },
    itemValue: {
        fontSize: 18,
        fontWeight: '400',
    },
    input: {
        width: 200,
        fontSize: 18,
        textAlign: 'right',
    },
    inputIOS: {
        paddingVertical: 4,
    },
    errorInput: {
        borderBottomColor: '#D32F2F',
    },
    errorText: {
        color: '#D32F2F',
    },
    errorTextSmall: {
        padding: 5,
        fontSize: 12,
        textAlign: 'right',
        paddingRight: 20,
    },
    opacityFuture: {
        opacity: 0.4,
    },
});
