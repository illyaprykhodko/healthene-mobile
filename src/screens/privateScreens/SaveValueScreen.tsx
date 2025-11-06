// outsource dependencies
import moment from 'moment';
import React, { useCallback, useMemo } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import {
    View,
    Alert,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useRoute } from '@react-navigation/native';
// local dependencies
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';
import { ROUTES } from 'constants/routes';
import { MessageService } from 'services/messages/service';
import { RootStackParamList } from 'services/navigation/types';
import {
    useGetAggregateMeasurementDataQuery,
    useDeleteMeasurementsMutation,
    useUpdatePhaseItemMutation,
} from 'store/api/dayOverviewApi';

type Navigation = StackNavigationProp<RootStackParamList>;

const SaveValueScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<Navigation>();
    const route = useRoute();
    const params = route.params as any;

    const measurementType = params?.measurementType;
    const measurementName = params?.measurementName || measurementType;
    const measurementPhaseItem = params?.measurementPhaseItem;
    const currentDate = params?.date || moment().format('YYYY-MM-DD');

    const isSameDate = moment().isSame(currentDate, 'day');
    const isFutureDate = moment(currentDate).isAfter(moment(), 'day');

    const { data: aggregateData, isLoading } = useGetAggregateMeasurementDataQuery({
        type: measurementType,
        period: '1-day',
        date: currentDate,
        offset: moment().utcOffset() / 60,
    });

    const [deleteMeasurements, { isLoading: isDeleting }] = useDeleteMeasurementsMutation();
    const [updatePhaseItem] = useUpdatePhaseItemMutation();

    // Extract current value
    const currentValue = useMemo(() => {
        const totalAverage = aggregateData?.totalLastValuesByUnitType;
        if (!totalAverage) { return null; }

        if (measurementType === 'BLOOD_PRESSURE') {
            const systolic = totalAverage.SYSTOLIC;
            const diastolic = totalAverage.DIASTOLIC;
            return systolic && diastolic
                ? `${Math.round(systolic)}/${Math.round(diastolic)}`
                : null;
        }

        return totalAverage.DEFAULT;
    }, [aggregateData, measurementType]);

    // Extract measurement IDs for delete
    const measurementIds = useMemo(() => {
        const data = aggregateData?.data || [];
        return data.reduce((acc: number[], item: any) => {
            return [...acc, ...(item?.measurementIds || [])];
        }, []);
    }, [aggregateData]);

    const handleGoToChart = useCallback(() => {
        navigation.navigate(ROUTES.MEASUREMENT_CHART, {
            measurementType,
            measurementName,
            date: currentDate,
        });
    }, [navigation, measurementType, measurementName, currentDate]);

    const handleDelete = useCallback(() => {
        if (measurementIds.length === 0) {
            MessageService.toastWarning('No measurements to delete');
            return;
        }

        Alert.alert(
            'Delete',
            'Are you sure you want to delete the most recent measurement?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMeasurements(measurementIds).unwrap();
                            MessageService.toastSuccess('Measurement deleted');
                            navigation.goBack();
                        } catch (error) {
                            // console.error('[SaveValue] Delete error:', error);
                            MessageService.error({
                                title: 'Delete Error',
                                message: 'Failed to delete measurement',
                                uid: 'delete-measurement-error',
                            });
                        }
                    },
                },
            ]
        );
    }, [measurementIds, deleteMeasurements, navigation]);

    const handleDone = useCallback(async () => {
        try {
            if (measurementPhaseItem) {
                await updatePhaseItem({
                    id: measurementPhaseItem.id,
                    phaseId: measurementPhaseItem.phaseId!,
                    data: {
                        ...measurementPhaseItem,
                        status: 'DONE',
                    },
                }).unwrap();
            }
            navigation.navigate(ROUTES.DAY_OVERVIEW);
        } catch (error) {
            // console.error('[SaveValue] Done error:', error);
            MessageService.error({
                title: 'Update Error',
                uid: 'update-status-error',
                message: 'Failed to update measurement status',
            });
        }
    }, [measurementPhaseItem, updatePhaseItem, navigation]);

    const isDisabled = isDeleting || isFutureDate || measurementPhaseItem?.status === 'DONE';

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <TouchableOpacity
                style={[
                    styles.graphButton,
                    !isSameDate && styles.graphButtonDisabled,
                    { borderColor: theme.colors.primary },
                ]}
                onPress={handleGoToChart}
                disabled={!isSameDate}
            >
                {isSameDate && <Icon name="chart-line" size={18} color={theme.colors.primary} />}
                <Text
                    style={[
                        styles.graphButtonText,
                        { color: isSameDate ? theme.colors.primary : theme.colors.grey },
                    ]}
                >
                    Graph
                </Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <Text variant="h1" textAlign="center" style={styles.title}>
                {!currentValue && !moment().isSame(currentDate)
                    ? `No ${measurementName}`
                    : `Current ${measurementName}`}
            </Text>

            {!isFutureDate && (
                <>
                    <View
                        style={[
                            styles.valueContainer,
                            { borderColor: theme.colors.text, backgroundColor: '#F3F3F3' },
                        ]}
                    >
                        {currentValue ? (
                            <Text
                                textAlign="center"
                                style={[
                                    styles.value,
                                    measurementType === 'BLOOD_PRESSURE' ? styles.valueSmaller : {},
                                ]}
                            >
                                {typeof currentValue === 'number'
                                    ? currentValue.toFixed(1)
                                    : currentValue}
                            </Text>
                        ) : (
                            <Text textAlign="center" style={styles.noDataText}>
                                No {measurementName} was recorded recently
                            </Text>
                        )}
                    </View>
                    <View style={styles.deleteBtnWrapper}>
                        <TouchableOpacity
                            onPress={handleDelete}
                            disabled={isDisabled || measurementIds.length === 0}
                            style={[
                                styles.deleteBtn,
                                {
                                    backgroundColor:
                                        isDisabled || measurementIds.length === 0
                                            ? '#CCCCCC'
                                            : '#FFB3B3',
                                    borderColor: theme.colors.text,
                                },
                            ]}
                        >
                            {isDeleting ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text variant="h5" style={{ fontWeight: 'bold' }}>
                                    Delete
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            )}

            <TouchableOpacity
                onPress={handleDone}
                disabled={isDisabled}
                style={[
                    styles.doneBtn,
                    {
                        backgroundColor: isDisabled ? '#EEEEEE' : '#96E072',
                    },
                ]}
            >
                <Text
                    style={[
                        styles.doneBtnText,
                        { color: isDisabled ? '#888888' : '#4E733C' },
                    ]}
                >
                    Done
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default SaveValueScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    graphButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderWidth: 2,
        borderRadius: 25,
        gap: 10,
    },
    graphButtonDisabled: {
        borderColor: '#CCCCCC',
    },
    graphButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 40,
    },
    title: {
        marginBottom: 20,
    },
    valueContainer: {
        padding: 16,
        marginVertical: 20,
        borderWidth: 2,
        borderRadius: 16,
    },
    value: {
        fontSize: 60,
        fontWeight: 'bold',
    },
    valueSmaller: {
        fontSize: 50,
    },
    noDataText: {
        fontSize: 16,
        color: '#777777',
    },
    deleteBtnWrapper: {
        flexDirection: 'row',
    },
    deleteBtn: {
        paddingVertical: 10,
        paddingHorizontal: 40,
        borderWidth: 1,
        borderRadius: 10,
    },
    doneBtn: {
        marginTop: 'auto',
        paddingVertical: 16,
        borderRadius: 25,
        alignItems: 'center',
    },
    doneBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});
