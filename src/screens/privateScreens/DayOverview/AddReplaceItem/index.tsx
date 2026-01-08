// outsource dependencies
import Icon from '@react-native-vector-icons/fontawesome5';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, StyleSheet, TouchableOpacity, FlatList, TextInput, Image } from 'react-native';

// local dependencies
import {
    AvailableItem,
    useGetFoodsQuery,
    useGetRecipePrototypesQuery,
    useGetCatalogPrototypeTreeNodesQuery
} from 'store/api/dayOverviewApi';
import Text from 'components/Text';
import Screen from 'components/Screen';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { CATALOG_TAG_TYPE, SEARCH_TYPE } from 'constants/spec';

export const AddReplaceItem: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [allItems, setAllItems] = useState<AvailableItem[]>([]);

    const initialEntityType: string = CATALOG_TAG_TYPE.PATIENT_FOOD;
    const initialSearchType: string = SEARCH_TYPE.ITEM;

    const [activeTab, setActiveTab] = useState<string>(initialEntityType);
    const [searchType, setSearchType] = useState<string>(initialSearchType);
    const [currentNodeId, setCurrentNodeId] = useState<number | null>(null);

    const onApply = route.params?.onApply;
    const date = route.params?.date;

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    useEffect(() => {
        if (debouncedSearchQuery.trim().length === 0 && activeTab !== CATALOG_TAG_TYPE.RESTAURANT) {
            setPage(0);
            setAllItems([]);
        }
    }, [debouncedSearchQuery, activeTab]);

    const { data: catalogTreeData, isLoading: isCatalogTreeLoading } = useGetCatalogPrototypeTreeNodesQuery({
        filter: {
            restaurantCatalog: true,
            parentId: currentNodeId || undefined,
            name: debouncedSearchQuery || undefined,
        },
        page,
        size: 10,
        sort: 'name,ASC',
    }, {
        skip: !(activeTab === CATALOG_TAG_TYPE.RESTAURANT && searchType === SEARCH_TYPE.TREE),
    });

    const { data: recipeData, isLoading: isRecipeLoading } = useGetRecipePrototypesQuery({
        filter: {
            name: debouncedSearchQuery || undefined,
            catalogNodeId: currentNodeId || undefined,
        },
        page,
        size: 10,
        sort: 'name,ASC',
    }, {
        skip: !(activeTab === CATALOG_TAG_TYPE.PATIENT_RECIPES
            && searchType === SEARCH_TYPE.ITEM
            && debouncedSearchQuery.trim().length > 0),
    });

    const { data: foodsData, isLoading: isFoodsLoading } = useGetFoodsQuery({
        filter: {
            isEnabled: true,
            categoryNodeId: currentNodeId || undefined,
            nameFragment: debouncedSearchQuery || undefined,
            treeTypeViewLabel: 'PATIENT_NAVIGATION' as const,
        },
        page,
        size: 10,
        sort: 'name,ASC',
    }, {
        skip: !(activeTab === CATALOG_TAG_TYPE.PATIENT_FOOD
            && searchType === SEARCH_TYPE.ITEM
            && debouncedSearchQuery.trim().length > 0),
    });

    const EMPTY = useMemo(() => [] as any[], []);

    const currentContent: any[] = useMemo(() => {
        if (activeTab === CATALOG_TAG_TYPE.RESTAURANT && searchType === SEARCH_TYPE.TREE) {
            return catalogTreeData?.content || EMPTY;
        }
        if (activeTab === CATALOG_TAG_TYPE.PATIENT_FOOD && searchType === SEARCH_TYPE.ITEM) {
            return foodsData?.content || EMPTY;
        }
        if (activeTab === CATALOG_TAG_TYPE.PATIENT_RECIPES && searchType === SEARCH_TYPE.ITEM) {
            return recipeData?.content || EMPTY;
        }
        return EMPTY;
    }, [activeTab, searchType, catalogTreeData, foodsData, recipeData, EMPTY]);

    const isLoading = useMemo(() => {
        if (activeTab === CATALOG_TAG_TYPE.RESTAURANT && searchType === SEARCH_TYPE.TREE) { return !!isCatalogTreeLoading; }
        if (activeTab === CATALOG_TAG_TYPE.PATIENT_FOOD && searchType === SEARCH_TYPE.ITEM) { return !!isFoodsLoading; }
        if (activeTab === CATALOG_TAG_TYPE.PATIENT_RECIPES && searchType === SEARCH_TYPE.ITEM) { return !!isRecipeLoading; }
        return false;
    }, [activeTab, searchType, isCatalogTreeLoading, isFoodsLoading, isRecipeLoading]);

    const contentKey = useMemo(() => (currentContent || []).map((i: any) => i.id).join('|'), [currentContent]);
    const allItemsKey = useMemo(() => allItems.map(i => i.id).join('|'), [allItems]);

    useEffect(() => {
        if (!Array.isArray(currentContent) || (debouncedSearchQuery.trim().length === 0 && activeTab !== CATALOG_TAG_TYPE.RESTAURANT)) { return; }
        if (page === 0) {
            if (contentKey !== allItemsKey) {
                setAllItems(currentContent);
            }
        } else {
            setAllItems(prev => {
                const existingIds = new Set(prev.map(i => i.id));
                const newItems = currentContent.filter(i => !existingIds.has(i.id));
                if (newItems.length === 0) { return prev; }
                return [...prev, ...newItems];
            });
        }
    }, [page, contentKey, allItemsKey, currentContent, debouncedSearchQuery, activeTab]);

    const handleItemPress = (item: AvailableItem) => {
        const isNode = activeTab === CATALOG_TAG_TYPE.RESTAURANT && searchType === SEARCH_TYPE.TREE;

        if (isNode) {
            setCurrentNodeId(item.id as number);
            setPage(0);
            setAllItems([]);
        } else {
            navigation.navigate(ROUTES.EDIT_FOOD, {
                item,
                date,
                entityType: activeTab,
                onApply: (editedItem: any) => {
                    if (onApply) {
                        onApply(editedItem);
                    }
                },
            });
        }
    };

    const handleLoadMore = () => {
        if (!isLoading && Array.isArray(currentContent) && currentContent.length > 0) {
            setPage(prev => prev + 1);
        }
    };

    const handleTabPress = (tabType: string) => {
        setActiveTab(tabType);
        setPage(0);
        setAllItems([]);
        setSearchQuery('');
        setDebouncedSearchQuery('');
        setCurrentNodeId(null);
        setSearchType(tabType === CATALOG_TAG_TYPE.RESTAURANT ? SEARCH_TYPE.TREE : SEARCH_TYPE.ITEM);
    };

    const renderTabs = () => {
        const tabs = [
            { label: 'Food/Drink', value: CATALOG_TAG_TYPE.PATIENT_FOOD },
            { label: 'Recipes', value: CATALOG_TAG_TYPE.PATIENT_RECIPES },
            { label: 'Restaurants', value: CATALOG_TAG_TYPE.RESTAURANT },
        ];

        return (
            <View style={styles.tabsRow}>
                {tabs.map((tab, index) => {
                    const isActive = activeTab === tab.value;
                    return (
                        <TouchableOpacity
                            key={tab.value}
                            style={[
                                styles.tabButton,
                                isActive && styles.activeTabButton,
                                { borderRightWidth: tabs.length === index + 1 ? 0 : 2 },
                            ]}
                            onPress={() => handleTabPress(tab.value)}
                        >
                            <Text style={isActive ? [styles.tabText, styles.activeTabText] : styles.tabText}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    const renderItem = ({ item }: { item: AvailableItem }) => {
        const imageUrl = (item as any).coverImage?.url;

        return (
            <TouchableOpacity style={styles.listItem} onPress={() => handleItemPress(item)}>
                <View style={styles.content}>
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
                    ) : (
                        <View style={[styles.image, styles.imagePlaceholder]} />
                    )}
                    <View style={styles.listTitle}>
                        <Text style={styles.itemName} numberOfLines={2}>
                            {item.name}
                        </Text>
                        <Text style={styles.itemType}>
                            {activeTab === CATALOG_TAG_TYPE.PATIENT_RECIPES ? 'RECIPE' : 'FOOD'}
                        </Text>
                    </View>
                </View>
                <Icon iconStyle="solid" name="chevron-right" size={16} color={COLORS.BLACK} />
            </TouchableOpacity>
        );
    };

    const renderSearchInput = () => (
        <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
                <Icon iconStyle="solid" name="search" size={14} color={COLORS.GREY} style={styles.searchIcon} />
                <TextInput
                    value={searchQuery}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="search"
                    placeholder="Search..."
                    style={styles.searchInput}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={COLORS.GREY}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                        <Icon iconStyle="solid" name="times" size={14} color={COLORS.GREY} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <Screen initialized={true} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Add item</Text>
            </View>

            {renderTabs()}
            {renderSearchInput()}

            <FlatList
                data={allItems}
                style={styles.list}
                renderItem={renderItem}
                onEndReachedThreshold={0.5}
                onEndReached={handleLoadMore}
                keyboardShouldPersistTaps="handled"
                keyExtractor={item => String(item.id)}
                ListEmptyComponent={
                    <Text style={styles.emptyScreen}>
                        {searchQuery.trim().length > 0 ? 'No items found' : 'Enter a search term'}
                    </Text>
                }
                ListFooterComponent={
                    isLoading && page > 0 ? (
                        <View style={styles.loadingMore}>
                            <Text>Loading more...</Text>
                        </View>
                    ) : null
                }
            />
        </Screen>
    );
};

export default AddReplaceItem;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 0,
        paddingRight: 0,
        backgroundColor: COLORS.WHITE,
    },
    header: {
        backgroundColor: '#E0EBF7',
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '400',
        color: '#181818',
    },
    tabsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: OFFSET.HORIZONTAL,
        marginTop: OFFSET.VERTICAL,
        marginBottom: OFFSET.VERTICAL,
        borderWidth: 2,
        borderColor: '#156F93',
        borderRadius: 8,
        overflow: 'hidden',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: '#F3F3F3',
        alignItems: 'center',
        borderRightColor: '#156F93',
    },
    activeTabButton: {
        backgroundColor: '#2978A0',
    },
    tabText: {
        color: COLORS.BLACK,
        fontWeight: '500',
        fontSize: 14,
    },
    activeTabText: {
        color: COLORS.WHITE,
        fontWeight: '600',
    },
    searchContainer: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        marginBottom: OFFSET.VERTICAL,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: 25,
        paddingHorizontal: 16,
        backgroundColor: COLORS.WHITE,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 16,
        color: COLORS.BLACK,
    },
    clearButton: {
        padding: 4,
    },
    list: {
        flex: 1,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: OFFSET.HORIZONTAL,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    image: {
        width: 48,
        height: 48,
        borderRadius: 4,
        marginRight: 12,
    },
    imagePlaceholder: {
        backgroundColor: '#F3F3F3',
    },
    listTitle: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.BLACK,
        marginBottom: 4,
    },
    itemType: {
        fontSize: 12,
        color: COLORS.GREY,
        textTransform: 'uppercase',
    },
    emptyScreen: {
        textAlign: 'center',
        color: COLORS.GREY,
        marginTop: OFFSET.VERTICAL * 2,
        fontSize: 16,
    },
    loadingMore: {
        padding: 20,
        alignItems: 'center',
    },
});
