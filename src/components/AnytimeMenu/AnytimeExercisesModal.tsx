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

function isItemFullyDone (item: any): boolean {
    if (![PHASE_ITEM_STATUS.DONE, PHASE_ITEM_STATUS.DID_NOT_EAT].includes(item.status)) { return false; }
    if (Array.isArray(item.list) && item.list.length) { return item.list.every(isItemFullyDone); }
    return true;
}

function areAllItemsFullyDone (items: any[] = []) { return items.every(isItemFullyDone); }

function getPhaseNewStatus (exercises: any[] = [], isToday: boolean) {
    if (areAllItemsFullyDone(exercises)) {
        return PHASE_ITEM_STATUS.DONE;
    }
    return isToday ? PHASE_ITEM_STATUS.PENDING : PHASE_ITEM_STATUS.INCOMPLETE;
}

function getCategoryStatus (items: any[]) {
    if (!items.length) {
        return null;
    }

    const allDone = items.every(item => item.status === PHASE_ITEM_STATUS.DONE);
    if (allDone) {
        return PHASE_ITEM_STATUS.DONE;
    }

    const hasDone = items.some(item => item.status === PHASE_ITEM_STATUS.INCOMPLETE || item.status === PHASE_ITEM_STATUS.DONE);
    if (hasDone) {
        return PHASE_ITEM_STATUS.INCOMPLETE;
    }

    return null;
}

function extractExercise (item: any): any {

    if (!item) {
        return null;
    }

    // If item has a list, it's a category - return the item with processed list
    if (Array.isArray(item.list) && item.list.length > 0) {
        return {
            ...item,
            id: item.id,
            type: item.type,
            title: item.title || item.name,
            status: item.status || PHASE_ITEM_STATUS.PENDING,
            list: item.list.map(extractExercise).filter(Boolean) // Recursively process nested items
        };
    }

    if (item.physicalActivity) {
        const result = {
            ...item.physicalActivity,
            id: item.id,
            type: item.type,
            status: item.status,
            title: item.title || item.physicalActivity?.title,
        };
        return result;
    }

    const result = {
        ...item?.exercise,
        id: item.id,
        type: item?.type,
        status: item?.status,
        title: item.title || item?.exercise?.title,
    };
    return result;
}

interface AnytimeExercisesModalProps {
    date?: string;
    onClose: () => void;
    visible: boolean;
    disabled?: boolean;
}

export const AnytimeExercisesModal: React.FC<AnytimeExercisesModalProps> = ({
    date,
    onClose,
    visible,
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
        
        // Filter only exercise items (EXERCISE_AEROBIC, EXERCISE_RESISTANCE, etc.)
        const exerciseItems = anytimeItems.filter(item =>
            item.type?.startsWith('EXERCISE_') || item.type === 'PHYSICAL_ACTIVITY'
        );

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
        const exerciseItems = anytimeItems.filter(item =>
            item.type?.startsWith('EXERCISE_') || item.type === 'PHYSICAL_ACTIVITY'
        );
        return exerciseItems.filter(item => item.status === PHASE_ITEM_STATUS.PENDING).length;
    }, [dayOverviewData]);
    const listIsDone = useMemo(() => areAllItemsFullyDone(exerciseCategories), [exerciseCategories]);
    
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
    const allAnytimeExercises = useMemo(() => {
        if (!anytimePhase?.items) { return []; }
        return anytimePhase.items.filter(item =>
            item.type?.startsWith('EXERCISE_') || item.type === 'PHYSICAL_ACTIVITY'
        );
    }, [anytimePhase]);

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
            <TouchableOpacity
                onPress={onClose}
                activeOpacity={1}
                style={StyleSheet.absoluteFill}
            />
      
            <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
                <View style={[styles.header, { backgroundColor: '#E0EBF7', borderBottomColor: theme.colors.border }]}>
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
                        <CloseIcon size={24} color="#181818" />
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
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    )}
                </View>
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
                                NEXT ACTIVITY
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 999,
    },
    modal: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
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
        backgroundColor: '#E0EBF7',
        borderBottomWidth: 1,
        borderBottomColor: '#CCDCE4',
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
        color: '#181818',
    },
    closeButton: {
        // padding: 8,
        borderRadius: 20,
    },
    closeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#181818',
    },
    content: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E1E1E1',
    },
    exerciseContent: {
        flex: 1,
        flexDirection: 'column',
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: '500',
        color: '#181818',
        marginBottom: 4,
    },
    exerciseType: {
        fontSize: 14,
        color: '#666666',
    },
    completedBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#96E072',
        alignItems: 'center',
        justifyContent: 'center',
    },
    completedText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    finishBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#FFE17A',
        borderRadius: 5,
    },
    finishText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#181818',
    },
    chevron: {
        fontSize: 20,
        color: '#666666',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#808080',
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
        color: '#181818',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        marginBottom: 20,
    },
    nextActivityButton: {
        width: '90%',
        borderRadius: 30,
        alignSelf: 'center',
        backgroundColor: '#96E072',
        borderColor: 'transparent',
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextActivityText: {
        fontSize: 20,
        fontWeight: '500',
        color: '#FFFFFF',
    },
});
