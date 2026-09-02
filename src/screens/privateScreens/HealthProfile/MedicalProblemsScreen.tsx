// outsource dependencies
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import React, { memo, useState, useCallback, useEffect, useRef } from 'react';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import Checkbox from 'components/Checkbox';
import SearchInput from 'components/SearchInput';
import StackHeader from 'components/StackHeader';
import { EmptyState } from 'components/EmptyState';
import { ListItemSkeleton } from 'components/Skeleton';
import {
    useFilterMedicalTermsQuery,
    useGetPatientMedicalProblemsQuery,
    useAddPatientMedicalProblemMutation,
    useRemovePatientMedicalProblemMutation,
} from 'store/api/healthProfileApi';

const PAGE_SIZE = 20;

interface ListItemProps {
    id: number;
    name: string;
    selected: boolean;
    onToggle: (id: number, isSelected: boolean) => void;
}

const ListItem: React.FC<ListItemProps> = memo(({ id, name, selected, onToggle }) => {
    const theme = useTheme();

    const handlePress = useCallback(() => {
        onToggle(id, selected);
    }, [id, selected, onToggle]);

    return (
        <TouchableOpacity
            activeOpacity={0.5}
            onPress={handlePress}
            style={[styles.listItem, { borderBottomColor: theme.colors.darkGrey }]}
        >
            <Text numberOfLines={2} style={[styles.itemName, { color: theme.colors.text }]}>
                {name}
            </Text>
            <Checkbox size={18} value={selected} onChange={handlePress} />
        </TouchableOpacity>
    );
});

const SkeletonList: React.FC = () => (
    <View style={styles.skeletonContainer}>
        {Array.from({ length: 10 }).map((_, index) => (
            <ListItemSkeleton key={index} showImage={false} lines={1} />
        ))}
    </View>
);

const MedicalProblemsScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const [search, setSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [allItems, setAllItems] = useState<Array<{ id: number; name: string }>>([]);
    const [localSelectedIds, setLocalSelectedIds] = useState<Set<number>>(new Set());
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const loadedIds = useRef<Set<number>>(new Set());
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {
        data: patientMedicalProblems = [],
        isLoading: patientProblemsLoading,
        isFetching: patientProblemsFetching,
    } = useGetPatientMedicalProblemsQuery();

    const [addMedicalProblem] = useAddPatientMedicalProblemMutation();
    const [removeMedicalProblem] = useRemovePatientMedicalProblemMutation();

    const {
        data: filterResult,
        isError: filterError,
        refetch: refetchFilter,
        isFetching: filterFetching,
    } = useFilterMedicalTermsQuery({
        params: { page, size: PAGE_SIZE },
        filter: { name: searchQuery, types: [] },
    }, { refetchOnMountOrArgChange: true });

    // Sync local state with server data on initial load
    useEffect(() => {
        if (!patientProblemsFetching) {
            const serverIds = new Set(patientMedicalProblems.map(p => p.medicalTerm.id));
            setLocalSelectedIds(serverIds);
        }
    }, [patientMedicalProblems, patientProblemsFetching]);

    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        const trimmed = value.trim();
        if (trimmed.length > 0 && trimmed.length < 3) {
            return;
        }

        debounceTimer.current = setTimeout(() => {
            setSearchQuery(value);
            setPage(0);
            setAllItems([]);
            loadedIds.current = new Set();
        }, 300);
    }, []);

    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    useEffect(() => {
        if (filterResult?.content) {
            setIsFirstLoad(false);

            if (page === 0) {
                const newItems = filterResult.content;
                loadedIds.current = new Set(newItems.map(item => item.id));
                setAllItems(newItems);
            } else {
                const uniqueNewItems = filterResult.content.filter(
                    item => !loadedIds.current.has(item.id)
                );
                uniqueNewItems.forEach(item => loadedIds.current.add(item.id));
                if (uniqueNewItems.length > 0) {
                    setAllItems(prev => [...prev, ...uniqueNewItems]);
                }
            }
        }
    }, [filterResult, page]);

    const handleToggle = useCallback(async (id: number, isCurrentlySelected: boolean) => {
        setLocalSelectedIds(prev => {
            const next = new Set(prev);
            if (isCurrentlySelected) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });

        try {
            if (isCurrentlySelected) {
                const record = patientMedicalProblems.find(p => p.medicalTerm.id === id);
                if (record) {
                    await removeMedicalProblem({ id: record.id }).unwrap();
                }
            } else {
                await addMedicalProblem({ id }).unwrap();
            }
        } catch (error) {
            setLocalSelectedIds(prev => {
                const next = new Set(prev);
                if (isCurrentlySelected) {
                    next.add(id);
                } else {
                    next.delete(id);
                }
                return next;
            });
            console.error('Failed to update medical problem:', error);
        }
    }, [patientMedicalProblems, addMedicalProblem, removeMedicalProblem]);

    const handleLoadMore = useCallback(() => {
        if (filterResult && page < filterResult.totalPages - 1 && !filterFetching) {
            setPage(prev => prev + 1);
        }
    }, [filterResult, page, filterFetching]);

    const handleClear = useCallback(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        setSearch('');
        setSearchQuery('');
        setPage(0);
        setAllItems([]);
        loadedIds.current = new Set();
    }, []);

    const renderItem = useCallback(({ item }: { item: { id: number; name: string } }) => (
        <ListItem
            id={item.id}
            name={item.name}
            onToggle={handleToggle}
            selected={localSelectedIds.has(item.id)}
        />
    ), [localSelectedIds, handleToggle]);

    const keyExtractor = useCallback((item: { id: number }) => String(item.id), []);

    const showMinLengthHint = search.trim().length > 0 && search.trim().length < 3;
    const showSkeleton = !filterError && ((isFirstLoad && filterFetching) || (filterFetching && allItems.length === 0 && search === searchQuery));
    const showEmpty = !filterFetching && allItems.length === 0 && (!isFirstLoad || filterError);
    const initialized = !patientProblemsLoading;

    return (
        <Screen initialized={initialized} style={styles.container}>
            <StackHeader
                title="Medical Problem"
                onBack={() => navigation.goBack()}
                onOpenDrawer={() => navigation.openDrawer?.()}
            />
            <View style={styles.searchContainer}>
                <SearchInput
                    value={search}
                    placeholder="Search"
                    onClear={handleClear}
                    onChange={handleSearchChange}
                />
                {showMinLengthHint ? (
                    <Text style={styles.hintText}>Enter at least 3 characters to search</Text>
                ) : null}
            </View>

            <View style={styles.listContainer}>
                {showSkeleton ? (
                    <SkeletonList />
                ) : showEmpty ? (
                    filterError ? (
                        <EmptyState
                            icon="alert-circle"
                            title="Something went wrong"
                            action={{ label: 'Try Again', onPress: refetchFilter }}
                        />
                    ) : (
                        <EmptyState
                            icon="search"
                            title="No items found"
                        />
                    )
                ) : (
                    <FlatList
                        data={allItems}
                        initialNumToRender={10}
                        renderItem={renderItem}
                        keyExtractor={keyExtractor}
                        onEndReachedThreshold={0.5}
                        extraData={localSelectedIds}
                        onEndReached={handleLoadMore}
                    />
                )}
            </View>
        </Screen>
    );
};

export default memo(MedicalProblemsScreen);

const styles = StyleSheet.create({
    container: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    searchContainer: {
        marginTop: 16,
        paddingHorizontal: 20,
    },
    hintText: {
        fontSize: 12,
        marginTop: 6,
        paddingHorizontal: 4,
        opacity: 0.5,
    },
    listContainer: {
        flex: 1,
        paddingLeft: 20,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingRight: 20,
        borderBottomWidth: 1,
    },
    itemName: {
        flex: 1,
        maxWidth: '85%',
        fontSize: 14,
    },
    skeletonContainer: {
        paddingHorizontal: 20,
    },
});
