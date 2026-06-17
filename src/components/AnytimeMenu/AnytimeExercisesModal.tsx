// outsource dependencies
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
// local dependencies
import { Badge } from './Badge';
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';
import Checkbox from 'components/Checkbox';
import { PHASE_ITEM_STATUS } from 'constants/spec';
import { ActivityIcon, CloseIcon } from './AnytimeIcons';
import { useGetDayOverviewQuery, useUpdatePhaseMutation } from 'store/api/dayOverviewApi';
import {
    extractExercise,
    getCategoryStatus,
    getPhaseNewStatus,
    areAllItemsFullyDone,
    isAnytimeExerciseItem,
} from 'utils/exercise';


interface AnytimeExercisesModalProps {
    date?: string;
    visible: boolean;
    disabled?: boolean;
    onClose: () => void;
     maxHeight: number | undefined;
                    fullScreen: boolean;
}

export const AnytimeExercisesModal: React.FC<AnytimeExercisesModalProps> = ({
    date,
    onClose,
    visible,
    maxHeight,
    fullScreen,
    disabled = false,
}) => {
    const theme = useTheme();
    const navigation = useNavigation();
    const { data: dayOverviewData, refetch } = useGetDayOverviewQuery(date || new Date().toISOString().split('T')[0]);
    const [updatePhase] = useUpdatePhaseMutation();
    const exerciseCategories = useMemo(() => {
        const anytimePhase = dayOverviewData?.phases?.find(phase => phase.type === 'ANYTIME');
        const anytimeItems = anytimePhase?.items || [];
        
        if (!anytimeItems.length) { return []; }
        
        const exerciseItems = anytimeItems.filter(isAnytimeExerciseItem);

        // Group exercises by type
        const groups = exerciseItems.reduce((acc: any, item: any) => {
            const { type } = item;
            const ex = extractExercise(item);
            if (!type || ex == null) { return acc; }

            if (!acc[type]) { acc[type] = []; }
            acc[type].push(ex);
            return acc;
        }, {});

        
        // Convert to category format
        return Object.keys(groups).filter(typeKey => typeKey !== 'PHYSICAL_ACTIVITY').map((typeKey, idx) => {
            const items = groups[typeKey];
            const title = typeKey
                .replace(/^EXERCISE_/, '')
                .toLowerCase()
                .split('_')
                .map(s => s.charAt(0).toUpperCase() + s.slice(1))
                .join(' ');
            
            const categoryStatus = getCategoryStatus(items);
            
            return {
                title,
                id: idx + 1,
                type: typeKey,
                status: categoryStatus,
                list: items.length ? items : null
            };
        });
    }, [dayOverviewData]);

    // Calculate active exercises count from anytime phase
    const activeExercisesCount = useMemo(() => {
        const anytimePhase = dayOverviewData?.phases?.find(phase => phase.type === 'ANYTIME');
        const anytimeItems = anytimePhase?.items || [];
        return anytimeItems
            .filter(isAnytimeExerciseItem)
            .filter(item => item.status === PHASE_ITEM_STATUS.PENDING).length;
    }, [dayOverviewData]);
    const listIsDone = useMemo(() => areAllItemsFullyDone(exerciseCategories), [exerciseCategories]);
    const isSingleExerciseCategoryDone = useMemo(
        () => exerciseCategories.length === 1 && listIsDone,
        [exerciseCategories.length, listIsDone]
    );
    
    // Check if today to determine status logic
    const isToday = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return today === date;
    }, [date]);

    // Get anytime phase info for status tracking
    const anytimePhase = useMemo(() => {
        return dayOverviewData?.phases?.find(phase => phase.type === 'ANYTIME');
    }, [dayOverviewData]);

    const anytimePhaseStatus = anytimePhase?.status;
    const anytimePhaseId = anytimePhase?.id;

    // Calculate new phase status based on all anytime exercises
    const allAnytimeExercises = useMemo(
        () => (anytimePhase?.items || []).filter(isAnytimeExerciseItem),
        [anytimePhase]
    );

    const newAnytimePhaseStatus = useMemo(() => {
        return getPhaseNewStatus(allAnytimeExercises, isToday);
    }, [allAnytimeExercises, isToday]);

    // Update anytime phase status when exercises change
    useEffect(() => {
        if (anytimePhaseStatus && anytimePhaseId && anytimePhaseStatus !== newAnytimePhaseStatus) {
            try {
                updatePhase({
                    id: anytimePhaseId,
                    data: { status: newAnytimePhaseStatus }
                });
            } catch (error) {
                console.error('Failed to update anytime phase status:', error);
            }
        }
    }, [anytimePhaseStatus, newAnytimePhaseStatus, anytimePhaseId, updatePhase]);

    // Function to refresh anytime exercises when status changes
    const refreshAnytimeExercises = useCallback(() => {
        refetch && refetch();
    }, [refetch]);

    const handleItemPress = useCallback((item: any) => {
        if (item?.list && item?.list?.length > 0) {
            (navigation as any).navigate('ExerciseCategories', {
                date,
                deepCounter: 1,
                list: item.list,
                title: item?.title,
                deepPhaseId: anytimePhaseId,
                onRefresh: refreshAnytimeExercises,
            });
        } else {
            (navigation as any).navigate('ExerciseDetails', {
                date,
                exercise: item,
                isAnytimeExercise: true,
                deepPhaseId: anytimePhaseId,
                onRefresh: refreshAnytimeExercises,
            });
        }
    }, [navigation, date, refreshAnytimeExercises, anytimePhaseId]);

    if (!visible) { return null; }

    return (
        <View style={styles.overlay}>
            {/* <BottomGlassModal
           visible={visible}
            onClose={onClose}
            maxHeight={maxHeight}
             fullScreen={fullScreen}
         > */}
            <TouchableOpacity
                onPress={onClose}
                activeOpacity={1}
                style={StyleSheet.absoluteFill}
            />
      
            <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
                <View style={[styles.header, { backgroundColor: theme.colors.surfaceAlt, borderBottomColor: theme.colors.border }]}>
                    <View style={styles.headerLeft}>
                        <Badge count={activeExercisesCount} bgColor={theme.colors.aqua} showZero>
                            <ActivityIcon size={24} />
                        </Badge>
                        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                            Exercise
                        </Text>
                    </View>
          
                    <TouchableOpacity
                        onPress={onClose}
                        disabled={disabled}
                        style={styles.closeButton}
                    >
                        <CloseIcon size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {exerciseCategories.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                No exercises found
                            </Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.scrollView}>
                            {exerciseCategories.map((item: any) =>
                                <TouchableOpacity
                                    disabled={disabled}
                                    key={String(item.id)}
                                    onPress={() => handleItemPress(item)}
                                    style={[styles.exerciseItem, { borderBottomColor: theme.colors.border }]}
                                >
                                    <View style={styles.exerciseContent}>
                                        <Text style={[styles.exerciseName, { color: theme.colors.text }]}>
                                            {item.title}
                                        </Text>
                                    </View>
                                        
                                    {item?.status === PHASE_ITEM_STATUS.DONE && (
                                        <Checkbox
                                            value
                                            size={15}
                                            editable={false}
                                            onChange={() => {}}
                                        />
                                    )}
                                        
                                    {item?.status === PHASE_ITEM_STATUS.INCOMPLETE && (
                                        <View style={[styles.finishBadge, { backgroundColor: theme.colors.warning }]}>
                                            <Text style={styles.finishText}>Finish</Text>
                                        </View>
                                    )}
                                        
                                    {![PHASE_ITEM_STATUS.DONE, PHASE_ITEM_STATUS.INCOMPLETE].includes(item?.status) && (
                                        <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>›</Text>
                                    )}
                                </TouchableOpacity>)}
                        </ScrollView>
                    )}
                </View>
                {listIsDone && (
                    <View style={styles.completionContainer}>
                        <Text style={[styles.goodWorkText, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}>
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
            {/* </BottomGlassModal> */}
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 999,
    },
    modal: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        elevation: 7,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
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
    content: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    exerciseItem: {
        paddingVertical: 35,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        justifyContent: 'space-between',
    },
    exerciseContent: {
        flex: 1,
        flexDirection: 'column',
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 4,
    },
    finishBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 5,
    },
    finishText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#181818',
    },
    chevron: {
        fontSize: 28,
    },
    emptyState: {
        flex: 1,
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
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
