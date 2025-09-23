// outsource dependencies
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import React, { useCallback, useLayoutEffect, useMemo, useState, useEffect } from 'react';
// local dependencies
import Text from 'components/Text';
import { COLORS } from 'constants/colors';
import { useTheme } from 'hooks/useTheme';
import Checkbox from 'components/Checkbox';
import { Button } from 'components/Button';
import { PHASE_ITEM_STATUS } from '../types';
import { Badge, ActivityIcon } from 'components/AnytimeMenu';
import { useGetDayOverviewQuery, useUpdatePhaseMutation } from 'store/api/dayOverviewApi';

function isItemFullyDone (item: any): boolean {
    if (item.status !== PHASE_ITEM_STATUS.DONE) { return false; }
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

// Function to extract exercise data and handle nested lists
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
    // Extract exercise data from item.exercise
    return {
        ...item?.exercise,
        type: item?.type,
        status: item?.status,
    };
}

export default function ExerciseCategories () {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const parentNavigation = route.params?.parentNavigation;
    const onClose = route.params?.onClose;
    const date = route.params?.date;
    const title = route.params?.title || 'Exercise';
    const deepPhaseId = route.params?.deepPhaseId;
    const exercisePhaseStatus = route.params?.exercisePhaseStatus;
    const [currentList, setCurrentList] = useState<any[]>(route.params?.list || []);
    const [isNeedUpdateDayOverview, setNeedUpdateDayOverview] = useState(false);

    // Load day overview data to get physical activity items
    const { data: dayOverviewData } = useGetDayOverviewQuery(date || new Date().toISOString().split('T')[0]);
    
    // Mutation for updating phase status
    const [updatePhase] = useUpdatePhaseMutation();
    
    // Build exercise categories from physical activity items
    const exerciseCategories = useMemo(() => {
        if (!dayOverviewData?.phases) { return []; }
        
        const physicalActivityPhase = dayOverviewData.phases.find(phase => phase.type === 'PHYSICAL_ACTIVITY');
        if (!physicalActivityPhase?.items) { return []; }
        
        // Group exercises by type
        const groups = physicalActivityPhase.items.reduce((acc: any, item: any) => {
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
            
            return {
                title,
                id: idx + 1,
                type: typeKey,
                status: getCategoryStatus(items),
                list: items.length ? items : null
            };
        });
    }, [dayOverviewData]);

    // Use exercise categories if no current list is set
    const displayList = currentList.length > 0 ? currentList : exerciseCategories;
    const listIsDone = useMemo(() => areAllItemsFullyDone(displayList), [displayList]);
    
    // Calculate active exercises count
    const activeExercisesCount = useMemo(() => {
        if (!dayOverviewData?.phases) { return 0; }
        const physicalActivityPhase = dayOverviewData.phases.find(phase => phase.type === 'PHYSICAL_ACTIVITY');
        if (!physicalActivityPhase?.items) { return 0; }
        return physicalActivityPhase.items.filter(item => item.status === PHASE_ITEM_STATUS.PENDING).length;
    }, [dayOverviewData]);
    
    // Check if today to determine status logic
    const isToday = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return today === date;
    }, [date]);

    // Calculate new phase status based on all exercises
    const allExercises = useMemo(() => {
        if (!dayOverviewData?.phases) { return []; }
        const physicalActivityPhase = dayOverviewData.phases.find(phase => phase.type === 'PHYSICAL_ACTIVITY');
        return physicalActivityPhase?.items || [];
    }, [dayOverviewData]);

    const newPhaseStatus = useMemo(() => {
        // Prefer local list
        const source = currentList && currentList.length > 0 ? currentList : allExercises;
        return getPhaseNewStatus(source as any[], isToday);
    }, [currentList, allExercises, isToday]);

    // Update phase status when exercises change
    useEffect(() => {
        if (exercisePhaseStatus && deepPhaseId && exercisePhaseStatus !== newPhaseStatus) {
            try {
                setNeedUpdateDayOverview(true);
                updatePhase({
                    id: deepPhaseId,
                    data: { status: newPhaseStatus }
                });
            } catch (error) {
                console.error('updatePhaseItem', error);
            }
        }
    }, [exercisePhaseStatus, newPhaseStatus, deepPhaseId, updatePhase]);

    // Function to update current list when exercise status changes
    const refreshCurrentList = useCallback((id: string | number, index: string, value: any) => {
        setCurrentList((prev: any[]) => {
            if (prev.length === 0) { return prev; } // If using exerciseCategories, don't modify
            const newList = prev.map((item: any) => (item.id === id ? { ...item, [index]: value } : item));
            // Update navigation params to persist changes
            navigation.setParams({
                list: newList,
            });
            return newList;
        });
    }, [navigation, setCurrentList]);

    const handleItemPress = useCallback((item: any) => {
        if (item?.list && item?.list?.length > 0) {
            navigation.push('ExerciseCategories', {
                ...route.params,
                list: item.list,
                title: item.title,
                refreshCurrentList,
                deepCounter: (route.params?.deepCounter || 0) + 1
            });
        } else {
            navigation.navigate('ExerciseDetails', {
                ...route.params,
                exercise: item,
                refreshCurrentList,
                deepCounter: route.params?.deepCounter
            });
        }
    }, [navigation, route.params, refreshCurrentList]);

    const handleBack = useCallback(() => {
        const deepCounter = route.params?.deepCounter || 0;
        if (deepCounter > 0) {
            navigation.goBack();
        } else {
            // Notify parent component to refresh day overview if needed
            if (isNeedUpdateDayOverview && route.params?.onRefresh) {
                route.params.onRefresh();
            }
            onClose?.();
        }
    }, [route.params, navigation, onClose, isNeedUpdateDayOverview]);

    useLayoutEffect(() => {
        parentNavigation?.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={handleBack}>
                    <Text style={{ color: COLORS.WHITE }}>Back</Text>
                </TouchableOpacity>
            )
        });
    }, [parentNavigation, handleBack]);
    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView>
                <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.row}>
                        {title === 'Exercise' && (
                            <Badge count={activeExercisesCount}>
                                <View style={{ marginRight: 3 }}>
                                    <ActivityIcon disabled={false} />
                                </View>
                            </Badge>
                        )}
                    </View>
                    <Text variant="h3" style={[styles.name, { color: theme.colors.text }]}>{title}</Text>
                    <TouchableOpacity onPress={handleBack}>
                        <Icon name="times" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.content}>
                    {displayList?.map((item: any) => (
                        <TouchableOpacity key={String(item.id)} style={styles.categoryItem} onPress={() => handleItemPress(item)}>
                            <View style={styles.categoryContent}>
                                <Text style={[styles.categoryName, { color: theme.colors.text }]}>{item.title}</Text>
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
                                <View style={styles.finishTextContainer}>
                                    <Text style={styles.finishText}>Finish</Text>
                                </View>
                            )}
                            {![PHASE_ITEM_STATUS.DONE, PHASE_ITEM_STATUS.INCOMPLETE].includes(item?.status) && (
                                <Icon name="chevron-right" size={18} color={theme.colors.text} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
            {listIsDone && (<Text textAlign="center" style={styles.goodWorkText}>Keep It Up!</Text>)}
            {listIsDone && (
                <Button
                    variant="primary"
                    title="NEXT ACTIVITY"
                    style={styles.submitBtn}
                    textStyle={styles.submitBtnText}
                    onPress={() => navigation.goBack()}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.WHITE },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#E0EBF7'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    name: { marginLeft: 16, marginBottom: 0 },
    content: { flex: 1 },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 24,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E1E1E1'
    },
    categoryContent: { flexDirection: 'row', alignItems: 'center' },
    categoryName: { marginLeft: 16, fontSize: 18, fontWeight: '500' },
    finishText: { fontSize: 17 },
    finishTextContainer: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        backgroundColor: '#FFE17A',
        borderRadius: 5
    },
    goodWorkText: {
        fontSize: 32,
        fontWeight: '500',
        color: COLORS.BLACK,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16
    },
    submitBtn: {
        width: '90%',
        borderRadius: 30,
        alignSelf: 'center',
        backgroundColor: '#96E072',
        borderColor: 'transparent',
        marginBottom: 16,
    },
    submitBtnText: {
        fontSize: 20,
        fontWeight: '500',
        paddingVertical: 3,
    },
});
