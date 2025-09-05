import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Text from 'components/Text';
import { COLORS } from 'constants/colors';
import { PHASE_ITEM_STATUS } from '../types';
import { useGetDayOverviewQuery } from 'store/api/dayOverviewApi';

function isItemFullyDone (item: any): boolean {
    if (item.status !== PHASE_ITEM_STATUS.DONE) { return false; }
    if (Array.isArray(item.list) && item.list.length) { return item.list.every(isItemFullyDone); }
    return true;
}

function areAllItemsFullyDone (items: any[] = []) { return items.every(isItemFullyDone); }

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

// Function to extract exercise data and handle nested lists (similar to original extractExercise)
function extractExercise (item: any): any {
    if (!item) {
        return null;
    }
    
    // If item has a list, it's a category - return the item with processed list
    if (Array.isArray(item.list) && item.list.length > 0) {
        return {
            ...item,
            id: item.id,
            title: item.title || item.name,
            status: item.status || PHASE_ITEM_STATUS.PENDING,
            type: item.type,
            list: item.list.map(extractExercise).filter(Boolean) // Recursively process nested items
        };
    }
    
    // Extract exercise data from item.exercise (like in original code)
    // Original: item => ({ ...item?.exercise, type: item?.type, status: item?.status })
    return {
        ...item?.exercise,
        type: item?.type,
        status: item?.status,
    };
}

export default function ExerciseCategories () {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const parentNavigation = route.params?.parentNavigation;
    const onClose = route.params?.onClose;
    const date = route.params?.date;
    const title = route.params?.title || 'Exercise';
    const [currentList] = useState(route.params?.list || []);

    // Load day overview data to get physical activity items
    const { data: dayOverviewData } = useGetDayOverviewQuery(date || new Date().toISOString().split('T')[0]);
    
    // Build exercise categories from physical activity items
    const exerciseCategories = useMemo(() => {
        if (!dayOverviewData?.phases) { return []; }
        
        const physicalActivityPhase = dayOverviewData.phases.find(phase => phase.type === 'PHYSICAL_ACTIVITY');
        if (!physicalActivityPhase?.items) { return []; }
        
        // Group exercises by type (similar to original buildCategories function)
        const groups = physicalActivityPhase.items.reduce((acc: any, item: any) => {
            const { type } = item;
            const ex = extractExercise(item);
            console.log('item', item);
            console.log('ex', ex);
            console.log('type', type);
            if (!type || ex == null) { return acc; }

            if (!acc[type]) { acc[type] = []; }
            acc[type].push(ex);
            return acc;
        }, {});
        console.log('groups', groups);
        // Convert to category format (filter out PHYSICAL_ACTIVITY like in original)
        return Object.keys(groups).filter(typeKey => typeKey !== 'PHYSICAL_ACTIVITY').map((typeKey, idx) => {
            const items = groups[typeKey];
            console.log('items', items);
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

    const handleItemPress = useCallback((item: any) => {
        if (item?.list && item?.list?.length > 0) {
            navigation.push('ExerciseCategories', { ...route.params, list: item.list, title: item.title, deepCounter: (route.params?.deepCounter || 0) + 1 });
        } else {
            navigation.navigate('ExerciseDetails', { ...route.params, exercise: item, deepCounter: route.params?.deepCounter });
        }
    }, [navigation, route.params]);

    useLayoutEffect(() => {
        parentNavigation?.setOptions({
            headerLeft:
            () => (<TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: COLORS.WHITE }}>Back</Text></TouchableOpacity>) });
    }, [parentNavigation, navigation]);
    console.log('currentList', currentList);
    console.log('exerciseCategories', exerciseCategories);
    console.log('displayList', displayList);
    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <View style={{ flex: 1 }} />
                    <Text variant="h3" style={styles.name}>{title}</Text>
                    <TouchableOpacity onPress={() => ((route.params?.deepCounter || 0) > 0 ? navigation.goBack() : onClose?.())}>
                        <Text variant="h4">×</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.content}>
                    {displayList?.map((item: any) => (
                        <TouchableOpacity key={String(item.id)} style={styles.categoryItem} onPress={() => handleItemPress(item)}>
                            <View style={styles.categoryContent}>
                                <Text style={styles.categoryName}>{item.title}</Text>
                            </View>
                            {item?.status === PHASE_ITEM_STATUS.DONE && <Text>✓</Text>}
                            {item?.status === PHASE_ITEM_STATUS.INCOMPLETE && (
                                <View style={styles.finishTextContainer}><Text style={styles.finishText}>Finish</Text></View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
            {listIsDone && (<Text textAlign="center" style={styles.goodWorkText}>Keep It Up!</Text>)}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.WHITE },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#E0EBF7' },
    name: { marginLeft: 16, marginBottom: 0 },
    content: { flex: 1 },
    categoryItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 24, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E1E1E1' },
    categoryContent: { flexDirection: 'row', alignItems: 'center' },
    categoryName: { marginLeft: 16, fontSize: 18, fontWeight: '500' },
    finishText: { fontSize: 17 },
    finishTextContainer: { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#FFE17A', borderRadius: 5 },
    goodWorkText: { fontSize: 32, fontWeight: '500', color: COLORS.BLACK, backgroundColor: 'white', borderRadius: 12, padding: 16 },
});

