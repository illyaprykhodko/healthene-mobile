// outsource dependencies
import Icon from '@react-native-vector-icons/fontawesome5';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useMemo, useState, useEffect, useRef } from 'react';

// local dependencies
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { COLORS } from 'constants/colors';
import Checkbox from 'components/Checkbox';
import { Button } from 'components/Button';
import { EmptyState } from 'components/EmptyState';
import { PHASE_ITEM_STATUS } from 'constants/spec';
import { Badge, ActivityIcon } from 'components/AnytimeMenu';
import {
    extractExercise,
    getCategoryStatus,
    getPhaseNewStatus,
    areAllItemsFullyDone,
} from 'utils/exercise';
import { useGetDayOverviewQuery, useUpdatePhaseMutation, useUpdatePhaseItemMutation } from 'store/api/dayOverviewApi';

export default function ExerciseCategories () {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const parentNavigation = route.params?.parentNavigation;
    const onClose = route.params?.onClose;
    const date = route.params?.date;
    const title = route.params?.title || 'Exercise';
    const deepPhaseId = route.params?.deepPhaseId;
    const isTopLevel = (route.params?.deepCounter || 0) === 0;
    const [currentList, setCurrentList] = useState<any[]>(route.params?.list || []);
    const [isNeedUpdateDayOverview, setNeedUpdateDayOverview] = useState(false);
    const [scrollEnabled, setScrollEnabled] = useState(true);
    // Load day overview data to get physical activity items
    const { data: dayOverviewData } = useGetDayOverviewQuery(date || new Date().toISOString().split('T')[0]);

    // Mutation for updating phase status
    const [updatePhase] = useUpdatePhaseMutation();
    const [updatePhaseItem] = useUpdatePhaseItemMutation();

    // Single source of truth for the PHYSICAL_ACTIVITY phase — shared by category list,
    // activeExercisesCount, allExercises roll-up, and the cached phase.status.
    const physicalActivityPhase = useMemo(
        () => dayOverviewData?.phases?.find(phase => phase.type === 'PHYSICAL_ACTIVITY'),
        [dayOverviewData]
    );

    // Build exercise categories from physical activity items
    const exerciseCategories = useMemo(() => {
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
    }, [physicalActivityPhase]);

    // Use exercise categories if no current list is set
    const displayList = currentList.length > 0 ? currentList : exerciseCategories;
    const listIsDone = useMemo(() => areAllItemsFullyDone(displayList), [displayList]);
    const isExercise = Boolean(route.params?.list && route.params?.list?.length);
    const isSingleExerciseCategoryDone = useMemo(
        () => title === 'Exercise' && displayList.length === 1 && listIsDone,
        [title, displayList.length, listIsDone]
    );
    const swipeWidth = 123;

    // Calculate active exercises count
    const activeExercisesCount = useMemo(() => {
        if (!physicalActivityPhase?.items) { return 0; }
        return physicalActivityPhase.items.filter(item => item.status === PHASE_ITEM_STATUS.PENDING).length;
    }, [physicalActivityPhase]);

    // Check if today to determine status logic
    const isToday = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return today === date;
    }, [date]);

    // Roll-up source for phase status. Filter out the PHYSICAL_ACTIVITY wrapper so the
    // "all done" check matches the categories the user actually sees (the category list
    // applies the same filter), otherwise an invisible PENDING item could block DONE.
    const allExercises = useMemo(() => {
        if (!physicalActivityPhase?.items) { return []; }
        return physicalActivityPhase.items.filter((item: any) => item.type !== 'PHYSICAL_ACTIVITY');
    }, [physicalActivityPhase]);

    // Always compute against the full phase. The nested screen's currentList is only
    // one category's items and would otherwise yield a premature DONE.
    const newPhaseStatus = useMemo(
        () => getPhaseNewStatus(allExercises as any[], isToday),
        [allExercises, isToday]
    );

    // Live phase.status from cache — replaces the frozen route.params snapshot.
    const currentPhaseStatus = physicalActivityPhase?.status;

    // Reconcile phase.status with the rolled-up status. Runs only at the top level
    // (deepCounter === 0) — the nested screen only sees one category's items and would
    // incorrectly fire DONE for the whole phase. An inFlight ref blocks the same status
    // from being re-sent if the server keeps returning a different value, preventing loops.
    const inFlightStatusRef = useRef<string | null>(null);
    useEffect(() => {
        if (!isTopLevel || !deepPhaseId || !currentPhaseStatus || !physicalActivityPhase) { return; }
        if (currentPhaseStatus === newPhaseStatus) {
            inFlightStatusRef.current = null;
            return;
        }
        if (inFlightStatusRef.current === newPhaseStatus) { return; }
        inFlightStatusRef.current = newPhaseStatus;
        // Server NPEs on a body of just `{ status }` (DayOverviewPhaseServiceImpl.runIncompleteStatusScenario
        // dereferences required phase fields). Spread the full phase shape, drop items, override status —
        // same convention used in DayOverview/Edit/index.tsx:520-526.
        const { items: _items, ...phaseWithoutItems } = physicalActivityPhase as any;
        updatePhase({
            id: deepPhaseId,
            data: { ...phaseWithoutItems, status: newPhaseStatus },
        })
            .unwrap()
            .then(() => { setNeedUpdateDayOverview(true); })
            .catch(error => {
                inFlightStatusRef.current = null;
                console.error('Failed to update phase status:', error);
            });
    }, [isTopLevel, currentPhaseStatus, newPhaseStatus, deepPhaseId, physicalActivityPhase, updatePhase]);

    // Function to update current list when exercise status changes
    const refreshCurrentList = useCallback((id: string | number, index: string, value: any) => {
        setCurrentList((prev: any[]) => {
            if (prev.length === 0) { return prev; } // If using exerciseCategories, don't modify
            return prev.map((item: any) => (item.id === id ? { ...item, [index]: value } : item));
        });
    }, []);

    // Mirror the local list onto route params so that re-mounts (deep links, screen
    // restoration) keep the latest statuses. Runs as a side effect — never call
    // navigation.setParams inside a setState updater (it would update the navigator
    // during render and trigger the "setState in render" warning).
    useEffect(() => {
        if (currentList.length > 0) {
            navigation.setParams({ list: currentList });
        }
    }, [currentList, navigation]);
    const handleChangeStatus = useCallback(async (item: any, status: string) => {
        refreshCurrentList(item.id, 'status', status);
        if (!deepPhaseId) { return; }
        try {
            await updatePhaseItem({
                id: item.id,
                phaseId: deepPhaseId,
                data: {
                    status,
                    id: item.id,
                    type: item.type,
                    title: item.title,
                } as any,
                date,
            }).unwrap();
        } catch (error) {
            refreshCurrentList(item.id, 'status', item.status);
            console.error('Failed to update skipped status:', error);
        }
    }, [date, deepPhaseId, refreshCurrentList, updatePhaseItem]);

    const handleItemPress = useCallback((item: any) => {
        if (item?.list && item?.list?.length > 0) {
            navigation.push('ExerciseCategories', {
                ...route.params,
                list: item.list,
                title: item.title,
                refreshCurrentList,
                deepCounter: (route.params?.deepCounter || 0) + 1
            });
        } else if (item?.aerobicExerciseType === 'WALKING') {
            navigation.navigate('WalkingActivity', {
                date,
                deepPhaseId,
                exercise: item,
                handleChangeStatus,
                refreshCurrentList,
            });
        } else {
            navigation.navigate('ExerciseDetails', {
                ...route.params,
                exercise: item,
                refreshCurrentList,
                deepCounter: route.params?.deepCounter
            });
        }
    }, [navigation, route.params, refreshCurrentList, date, deepPhaseId, handleChangeStatus]);

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
                    <Text style={{ color: theme.colors.white }}>Back</Text>
                </TouchableOpacity>
            )
        });
    }, [parentNavigation, handleBack]);
    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <SwipeListView
                useFlatList
                closeOnScroll
                disableRightSwipe
                data={displayList}
                style={styles.list}
                recalculateHiddenLayout
                rightOpenValue={-swipeWidth}
                scrollEnabled={scrollEnabled}
                disableLeftSwipe={!isExercise}
                keyExtractor={(item: any) => String(item.id)}
                contentContainerStyle={displayList.length === 0 && styles.emptyContent}
                ListHeaderComponent={(
                    <View style={[styles.header, { backgroundColor: theme.colors.surfaceAlt || theme.colors.surface }]}>
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
                            <Icon iconStyle="solid" name="times" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={(
                    <EmptyState
                        icon="activity"
                        title="No exercises"
                        subtitle="Nothing planned for this category."
                    />
                )}
                renderItem={({ item }: { item: any }) => (
                    <View style={[styles.listItemContainer, { backgroundColor: theme.colors.surface }, isExercise && styles.swipeItemDecorator]}>
                        <TouchableOpacity
                            key={String(item.id)}
                            onPress={() => handleItemPress(item)}
                            disabled={item?.status === PHASE_ITEM_STATUS.DID_NOT_EAT}
                            style={[styles.categoryItem, { borderBottomColor: theme.colors.border }]}
                        >
                            <View style={[styles.categoryContent, item?.status === PHASE_ITEM_STATUS.DID_NOT_EAT && styles.opacity]}>
                                <Text style={[styles.categoryName, { color: theme.colors.text }]}>{item.title}</Text>
                            </View>
                            {item?.status === PHASE_ITEM_STATUS.DID_NOT_EAT && (
                                <View style={styles.skippedLabel}>
                                    <View style={styles.notEatView}>
                                        <Text style={[styles.notEatText, { color: theme.colors.primary }]}>Skipped</Text>
                                    </View>
                                    {/* Category rows have derived DID_NOT_EAT status with a fake id (idx+1) — no API call */}
                                    {!(item.list && item.list.length > 0) && (
                                        <TouchableOpacity onPress={() => handleChangeStatus(item, PHASE_ITEM_STATUS.PENDING)}>
                                            <Icon iconStyle="solid" name="minus-square" size={30} color={theme.colors.primary} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                            {item?.status === PHASE_ITEM_STATUS.DONE && (
                                <Checkbox
                                    value
                                    size={15}
                                    editable={false}
                                    onChange={() => {}}
                                />
                            )}
                            {item?.status === PHASE_ITEM_STATUS.INCOMPLETE && (
                                <View style={[styles.finishTextContainer, { backgroundColor: theme.colors.warning }]}>
                                    <Text style={styles.finishText}>Finish</Text>
                                </View>
                            )}
                            {![PHASE_ITEM_STATUS.DONE, PHASE_ITEM_STATUS.INCOMPLETE, PHASE_ITEM_STATUS.DID_NOT_EAT].includes(item?.status) && (
                                <Icon iconStyle="solid" name="chevron-right" size={18} color={theme.colors.text} />
                            )}
                        </TouchableOpacity>
                    </View>
                )}
                renderHiddenItem={({ item }: { item: any }, rowMap: Record<string, any>) => {
                    const isSkipped = item.status === PHASE_ITEM_STATUS.DID_NOT_EAT;
                    return (
                        <View style={styles.listItemHidden}>
                            <View style={[styles.listItemContent, { width: swipeWidth }]}>
                                <TouchableOpacity
                                    style={styles.listItemBtnNotEat}
                                    onPress={() => {
                                        handleChangeStatus(
                                            item,
                                            isSkipped ? PHASE_ITEM_STATUS.PENDING : PHASE_ITEM_STATUS.DID_NOT_EAT
                                        );
                                        setTimeout(() => {
                                            rowMap[item?.id] && rowMap[item?.id].closeRow();
                                        }, 200);
                                    }}
                                >
                                    <Icon iconStyle="solid" name="times" color={theme.colors.black} size={30} />
                                    <Text style={[styles.notEatBtn, styles.offsetTop]}>Skipped</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                }}
                onRowOpen={(rowKey: string, rowMap: Record<string, any>) => {
                    setScrollEnabled(false);
                    const item = displayList.find((x: any) => x.id?.toString() === rowKey);
                    if (item?.status === PHASE_ITEM_STATUS.INCOMPLETE || item?.status === PHASE_ITEM_STATUS.DONE) {
                        rowMap[rowKey] && rowMap[rowKey].closeRow();
                    }
                    setTimeout(() => {
                        rowMap[rowKey] && rowMap[rowKey].closeRow();
                    }, 10 * 1000);
                }}
                onRowDidClose={() => setScrollEnabled(true)}
                onSwipeValueChange={({ value }: { value: number }) => {
                    if (value !== 0 && scrollEnabled) {
                        setScrollEnabled(false);
                    }
                    if (value === 0 && !scrollEnabled) {
                        setScrollEnabled(true);
                    }
                }}
            />
            {listIsDone && (<Text textAlign="center" style={[styles.goodWorkText, { backgroundColor: theme.colors.surface }]}>Keep It Up!</Text>)}
            {listIsDone && !isSingleExerciseCategoryDone && (
                <Button
                    variant="primary"
                    title="NEXT ACTIVITY"
                    style={styles.submitBtn}
                    textStyle={styles.submitBtnText}
                    onPress={() => navigation.goBack()}
                />
            )}
            {isSingleExerciseCategoryDone && (
                <Button
                    title="DONE"
                    variant="primary"
                    onPress={handleBack}
                    style={styles.submitBtn}
                    textStyle={styles.submitBtnText}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
        backgroundColor: '#E0EBF7'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    name: { marginLeft: 16, marginBottom: 0 },
    list: { flex: 1 },
    // When ListEmptyComponent renders, let it stretch and centre vertically
    // beneath the header rather than huddle at the top.
    emptyContent: { flexGrow: 1 },
    listItemContainer: {
        backgroundColor: COLORS.WHITE,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: OFFSET.VERTICAL * 2,
        paddingHorizontal: OFFSET.HORIZONTAL,
        borderBottomWidth: 1,
        borderBottomColor: '#E1E1E1'
    },
    categoryContent: { flexDirection: 'row', alignItems: 'center' },
    categoryName: { marginLeft: 16, fontSize: 18, fontWeight: '500' },
    finishText: { fontSize: 17 },
    finishTextContainer: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 5
    },
    listItemHidden: {
        height: '100%',
        width: '100%',
        marginRight: OFFSET.HORIZONTAL,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    listItemContent: {
        flexDirection: 'row',
    },
    listItemBtnNotEat: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E0F6F5',
    },
    notEatBtn: {
        fontSize: 18,
        color: COLORS.BLACK,
    },
    offsetTop: {
        marginTop: OFFSET.VERTICAL,
    },
    notEatView: {
        marginRight: 15,
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    notEatText: {
        fontWeight: 'bold',
    },
    skippedLabel: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    swipeItemDecorator: {
        borderRightWidth: 7,
        borderRightColor: '#8EF9F3',
        borderBottomColor: '#E9E9E9',
    },
    opacity: {
        opacity: 0.3,
    },
    goodWorkText: {
        fontSize: 32,
        fontWeight: '500',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16
    },
    submitBtn: {
        width: '90%',
        borderRadius: 30,
        alignSelf: 'center',
        marginBottom: OFFSET.VERTICAL,
    },
    submitBtnText: {
        fontSize: 20,
        fontWeight: '500',
        paddingVertical: 3,
    },
});
