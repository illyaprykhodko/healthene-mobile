// outsource dependencies
import Icon from '@react-native-vector-icons/fontawesome5';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

// local dependencies
import { Badge } from './Badge';
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';
import Checkbox from 'components/Checkbox';
import { PHASE_ITEM_STATUS } from 'constants/spec';
import { EmptyState } from 'components/EmptyState';
import { ActivityIcon, CloseIcon } from './AnytimeIcons';
import { ModalCloseContext } from './ModalCloseContext';
import { useGetDayOverviewQuery, useUpdatePhaseMutation } from 'store/api/dayOverviewApi';
import {
    extractExercise,
    getCategoryStatus,
    getPhaseNewStatus,
    areAllItemsFullyDone,
    isAnytimeExerciseItem,
} from 'utils/exercise';

const ANYTIME_PHASE_TYPE = 'ANYTIME';

interface ExerciseCategory {
    id: number;
    type: string;
    title: string;
    list: any[] | null;
    status: string | null;
}

interface AnytimeExerciseListParams {
    date?: string;
    disabled?: boolean;
}

const humanizeExerciseType = (typeKey: string): string => typeKey
    .replace(/^EXERCISE_/, '')
    .toLowerCase()
    .split('_')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');

export const AnytimeExerciseList: React.FC = () => {
    const theme = useTheme();
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const onClose = useContext(ModalCloseContext);

    const { date, disabled = false } = (route.params || {}) as AnytimeExerciseListParams;
    const today = useMemo(() => new Date().toISOString().split('T')[0], []);
    const queryDate = date || today;
    const { data: dayOverviewData, refetch } = useGetDayOverviewQuery(queryDate);
    const [updatePhase] = useUpdatePhaseMutation();

    const { phase, exerciseItems } = useMemo(() => {
        const anytimePhase = dayOverviewData?.phases?.find(p => p.type === ANYTIME_PHASE_TYPE);
        const items = (anytimePhase?.items || []).filter(isAnytimeExerciseItem);
        return { phase: anytimePhase, exerciseItems: items };
    }, [dayOverviewData]);

    const exerciseCategories = useMemo<ExerciseCategory[]>(() => {
        if (!exerciseItems.length) { return []; }

        const groups = exerciseItems.reduce((acc: Record<string, any[]>, item: any) => {
            const ex = extractExercise(item);
            if (!item.type || ex == null) { return acc; }
            if (!acc[item.type]) { acc[item.type] = []; }
            acc[item.type].push(ex);
            return acc;
        }, {});

        return Object.keys(groups)
            .filter(typeKey => typeKey !== 'PHYSICAL_ACTIVITY')
            .map((typeKey, idx) => ({
                id: idx + 1,
                type: typeKey,
                title: humanizeExerciseType(typeKey),
                status: getCategoryStatus(groups[typeKey]),
                list: groups[typeKey].length ? groups[typeKey] : null,
            }));
    }, [exerciseItems]);

    const activeExercisesCount = useMemo(
        () => exerciseItems.filter((item: any) => item.status === PHASE_ITEM_STATUS.PENDING).length,
        [exerciseItems]
    );

    const listIsDone = useMemo(() => areAllItemsFullyDone(exerciseCategories), [exerciseCategories]);
    const isSingleExerciseCategoryDone = exerciseCategories.length === 1 && listIsDone;
    const isToday = queryDate === today;

    useEffect(() => {
        if (!phase?.id || !phase?.status) { return; }
        const nextStatus = getPhaseNewStatus(exerciseItems, isToday);
        if (phase.status !== nextStatus) {
            try {
                updatePhase({ id: phase.id, data: { status: nextStatus } });
            } catch (error) {
                console.error('Failed to update anytime phase status:', error);
            }
        }
    }, [phase?.id, phase?.status, exerciseItems, isToday, updatePhase]);

    const refreshAnytimeExercises = useCallback(() => refetch(), [refetch]);

    const handleItemPress = useCallback((item: ExerciseCategory) => {
        const baseParams = {
            date,
            deepPhaseId: phase?.id,
            onRefresh: refreshAnytimeExercises,
        };
        if (item.list && item.list.length > 0) {
            navigation.navigate('ExerciseCategories', {
                ...baseParams,
                onClose,
                deepCounter: 1,
                list: item.list,
                title: item.title,
                exercisePhaseStatus: phase?.status,
            });
        } else {
            navigation.navigate('ExerciseDetails', {
                ...baseParams,
                exercise: item,
                isAnytimeExercise: true,
            });
        }
    }, [navigation, date, refreshAnytimeExercises, phase?.id, phase?.status, onClose]);

    const renderItem = useCallback(({ item }: { item: ExerciseCategory }) => {
        const isSkipped = item.status === PHASE_ITEM_STATUS.DID_NOT_EAT;
        return (
            <TouchableOpacity
                disabled={disabled || isSkipped}
                onPress={() => handleItemPress(item)}
                style={[styles.exerciseItem, { borderBottomColor: theme.colors.border }]}
            >
                <View style={[styles.exerciseContent, isSkipped && styles.opacity]}>
                    <Text style={[styles.exerciseName, { color: theme.colors.text }]}>
                        {item.title}
                    </Text>
                </View>

                {item.status === PHASE_ITEM_STATUS.DONE && (
                    <Checkbox value size={15} editable={false} onChange={() => {}} />
                )}
                {item.status === PHASE_ITEM_STATUS.INCOMPLETE && (
                    <View style={[styles.finishBadge, { backgroundColor: theme.colors.warning }]}>
                        <Text style={styles.finishText}>Finish</Text>
                    </View>
                )}
                {isSkipped && (
                    <View style={styles.skippedLabel}>
                        <Text style={[styles.skippedText, { color: theme.colors.primary }]}>Skipped</Text>
                        <Icon iconStyle="solid" name="minus-square" size={22} color={theme.colors.primary} />
                    </View>
                )}
                {!isSkipped && item.status !== PHASE_ITEM_STATUS.DONE && item.status !== PHASE_ITEM_STATUS.INCOMPLETE && (
                    <Icon iconStyle="solid" name="chevron-right" size={18} color={theme.colors.text} />
                )}
            </TouchableOpacity>
        );
    }, [disabled, theme.colors, handleItemPress]);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { backgroundColor: theme.colors.surfaceAlt, borderBottomColor: theme.colors.border }]}>
                <View style={styles.headerLeft}>
                    <Badge count={activeExercisesCount} bgColor={theme.colors.aqua}>
                        <ActivityIcon size={24} />
                    </Badge>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                        Exercise
                    </Text>
                </View>
                <TouchableOpacity onPress={onClose} disabled={disabled} style={styles.closeButton}>
                    <CloseIcon size={24} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <FlatList
                style={styles.list}
                renderItem={renderItem}
                data={exerciseCategories}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={exerciseCategories.length === 0 && styles.emptyContent}
                ListEmptyComponent={(
                    <EmptyState
                        icon="activity"
                        title="No exercises planned"
                        subtitle="When activities are scheduled, they will appear here."
                    />
                )}
            />

            {listIsDone && (
                <View style={styles.completionContainer}>
                    <Text style={[styles.goodWorkText, { backgroundColor: theme.colors.surface }]}>
                        Keep It Up!
                    </Text>
                    <TouchableOpacity
                        style={[styles.nextActivityButton, { backgroundColor: theme.colors.successAlt }]}
                        onPress={onClose}
                    >
                        <Text style={[styles.nextActivityText, { color: theme.colors.white }]}>
                            {isSingleExerciseCategoryDone ? 'DONE' : 'NEXT ACTIVITY'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        marginLeft: 16,
        fontSize: 20,
        fontWeight: '700',
    },
    closeButton: {
        borderRadius: 20,
    },
    list: {
        flex: 1,
    },
    emptyContent: {
        flexGrow: 1,
    },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 40,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    exerciseContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    exerciseName: {
        marginLeft: 16,
        fontSize: 18,
        fontWeight: '500',
    },
    finishBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 5,
    },
    finishText: {
        fontSize: 17,
    },
    skippedLabel: {
        gap: 8,
        alignItems: 'center',
        flexDirection: 'row',
    },
    skippedText: {
        fontWeight: 'bold',
    },
    opacity: {
        opacity: 0.3,
    },
    completionContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 24,
    },
    goodWorkText: {
        fontSize: 32,
        fontWeight: '500',
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        marginBottom: 20,
    },
    nextActivityButton: {
        width: '90%',
        borderRadius: 30,
        alignSelf: 'center',
        borderColor: 'transparent',
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextActivityText: {
        fontSize: 20,
        fontWeight: '500',
    },
});
