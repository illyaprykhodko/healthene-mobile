// outsource dependencies
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, StyleSheet, TouchableOpacity, FlatList, TextInput, Platform } from 'react-native';
// local dependencies
import Text from '../../../../components/Text';
import Screen from '../../../../components/Screen';
import { useTheme } from '../../../../hooks/useTheme';
import { COLORS } from '../../../../constants/colors';
import { Button } from '../../../../components/Button';
import {
    useGetCatalogPrototypeTreeNodesQuery,
    useGetRecipePrototypesQuery,
    useGetFoodsQuery,
    AvailableItem
} from '../../../../store/api/dayOverviewApi';

// Temporary types until full migration
interface AddReplaceItemProps {
  entityType?: string;
  excludeIds?: string[];
  onApply?: (item: any) => void;
  replaceMode?: boolean;
  itemToReplace?: any;
}

// Temporary constants until full migration
const TAG_TYPE = {
    PATIENT_FOOD: 'PATIENT_FOOD',
    PATIENT_RECIPES: 'PATIENT_RECIPES',
    RESTAURANT: 'RESTAURANT',
};

const SEARCH_TYPE = {
    TREE: 'TREE',
    ITEM: 'ITEM',
};

export const AddReplaceItem: React.FC<AddReplaceItemProps> = () => {
    const theme = useTheme();
    const navigation = useNavigation();
    const route = useRoute<any>();
  
    const [selectedItems, setSelectedItems] = useState<AvailableItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [allItems, setAllItems] = useState<AvailableItem[]>([]);

    // default tab is Food/Drink
    const initialEntityType: string = TAG_TYPE.PATIENT_FOOD;
    const initialSearchType: string = SEARCH_TYPE.ITEM;

    const [activeTab, setActiveTab] = useState<string>(initialEntityType);
    const [searchType, setSearchType] = useState<string>(initialSearchType);

    const [currentNodeId, setCurrentNodeId] = useState<number | null>(null);
    const [currentNodeName, setCurrentNodeName] = useState<string>('');
  
    const excludeIds = route.params?.excludeIds || [];
    const onApply = route.params?.onApply;
    const replaceMode = route.params?.replaceMode || false;
    const itemToReplace = route.params?.itemToReplace;

    // Debounce search query
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);
    useEffect(() => {
        if (debouncedSearchQuery.trim().length === 0 && activeTab !== TAG_TYPE.RESTAURANT) {
            setPage(0);
            setAllItems([]);
        }
    }, [debouncedSearchQuery, activeTab]);

    // restaurants only tree search
    const { data: catalogTreeData, isLoading: isCatalogTreeLoading } = useGetCatalogPrototypeTreeNodesQuery({
        filter: {
            name: debouncedSearchQuery || undefined,
            parentId: currentNodeId || undefined,
            restaurantCatalog: true,
            // excludeIds: excludeIds.map((id: string) => parseInt(id)),
        },
        page,
        size: 10,
        sort: 'name,ASC',
    }, {
        // skip: !(activeTab === TAG_TYPE.RESTAURANT),
        skip: !(activeTab === TAG_TYPE.RESTAURANT && searchType === SEARCH_TYPE.TREE),
    });

    // recipe prototypes query (non-restaurants, item search)
    // useGetRecipePrototypesQuery
    const { data: recipeData, isLoading: isRecipeLoading } = useGetRecipePrototypesQuery({
        filter: {
            name: debouncedSearchQuery || undefined,
            catalogNodeId: currentNodeId || undefined,
            excludeIds: excludeIds.map((id: string) => parseInt(id)),
        },
        page,
        size: 10,
        sort: 'name,ASC',
    }, {
        skip: !(activeTab === TAG_TYPE.PATIENT_RECIPES && searchType === SEARCH_TYPE.ITEM && debouncedSearchQuery.trim().length > 0),
    });

    // foods query (non-restaurants, item search)
    const { data: foodsData, isLoading: isFoodsLoading } = useGetFoodsQuery({
        filter: {
            // name: debouncedSearchQuery || undefined,
            nameFragment: debouncedSearchQuery || undefined,
            categoryNodeId: currentNodeId || undefined,
            isEnabled: true,
            treeTypeViewLabel: 'PATIENT_NAVIGATION' as const,
            excludeIds: excludeIds.map((id: string) => parseInt(id)),
        },
        page,
        size: 10,
        sort: 'name,ASC',
    }, {
        skip: !(activeTab === TAG_TYPE.PATIENT_FOOD && searchType === SEARCH_TYPE.ITEM && debouncedSearchQuery.trim().length > 0),
    });

    // stable empty array reference
    const EMPTY = useMemo(() => [] as any[], []);

    // determine which content to use and memoize to avoid identity churn
    const currentContent: any[] = useMemo(() => {
        if (activeTab === TAG_TYPE.RESTAURANT && searchType === SEARCH_TYPE.TREE) {
            return catalogTreeData?.content || EMPTY;
        }
        if (activeTab === TAG_TYPE.PATIENT_FOOD && searchType === SEARCH_TYPE.ITEM) {
            return foodsData?.content || EMPTY;
        }
        if (activeTab === TAG_TYPE.PATIENT_RECIPES && searchType === SEARCH_TYPE.ITEM) {
            return recipeData?.content || EMPTY;
        }
        return EMPTY;
    }, [activeTab, searchType, catalogTreeData, foodsData, recipeData, EMPTY]);

    const isLoading = useMemo(() => {
        if (activeTab === TAG_TYPE.RESTAURANT && searchType === SEARCH_TYPE.TREE) { return !!isCatalogTreeLoading; }
        if (activeTab === TAG_TYPE.PATIENT_FOOD && searchType === SEARCH_TYPE.ITEM) { return !!isFoodsLoading; }
        if (activeTab === TAG_TYPE.PATIENT_RECIPES && searchType === SEARCH_TYPE.ITEM) { return !!isRecipeLoading; }
        return false;
    }, [activeTab, searchType, isCatalogTreeLoading, isFoodsLoading, isRecipeLoading]);

    const contentKey = useMemo(() => (currentContent || []).map((i: any) => i.id).join('|'), [currentContent]);
    const allItemsKey = useMemo(() => allItems.map(i => i.id).join('|'), [allItems]);

    useEffect(() => {
        if (!Array.isArray(currentContent) || (debouncedSearchQuery.trim().length === 0 && activeTab !== TAG_TYPE.RESTAURANT)) { return; }
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

    const filteredItems = allItems;

    useEffect(() => {
        const title = replaceMode
            ? `Replace ${activeTab.toLowerCase().replace('_', ' ')}`
            : `Select ${activeTab.toLowerCase().replace('_', ' ')}`;
        navigation.setOptions({ title });
    }, [navigation, activeTab, replaceMode]);

    // useEffect(() => {
    //     setPage(0);
    //     setAllItems([]);
    // }, [debouncedSearchQuery, activeTab, searchType, currentNodeId]);

    const handleItemPress = (item: AvailableItem) => {
        if (selectedItems.find(selected => selected.id === item.id)) {
            setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
        } else {
            if (replaceMode) {
                setSelectedItems([item]);
            } else {
                setSelectedItems([...selectedItems, item]);
            }
        }
    };

    const handleApply = () => {
        if (onApply && selectedItems.length > 0) {
            const itemToApply = selectedItems[0];
            onApply(itemToApply);
            navigation.goBack();
        }
    };

    const handleLoadMore = () => {
        if (!isLoading && Array.isArray(currentContent) && currentContent.length > 0) {
            setPage(prev => prev + 1);
        }
    };

    const handleTabPress = (tabType: string) => {
        setActiveTab(tabType);
        setSelectedItems([]);
        setPage(0);
        setAllItems([]);
        setSearchQuery('');
        setDebouncedSearchQuery('');
        setCurrentNodeId(null);
        setCurrentNodeName('');
        setSearchType(tabType === TAG_TYPE.RESTAURANT ? SEARCH_TYPE.TREE : SEARCH_TYPE.ITEM);
    };

    const handleNodePress = (node: any) => {
        if (activeTab !== TAG_TYPE.RESTAURANT) { return; }
        setCurrentNodeId(node.id);
        setCurrentNodeName(node.name);
        setPage(0);
        setAllItems([]);
    };

    const handleScanUPC = () => {
        (navigation as any).navigate('UPCScan', {
            entityType: activeTab === TAG_TYPE.PATIENT_FOOD ? 'FOOD' : 'RECIPE',
            onApply: (scannedItem: any) => { if (onApply) { onApply(scannedItem); } },
        });
    };

    const renderTabs = () => {
        const tabs = [
            { label: 'Food/Drink', value: TAG_TYPE.PATIENT_FOOD },
            { label: 'Recipes', value: TAG_TYPE.PATIENT_RECIPES },
            { label: 'Restaurants', value: TAG_TYPE.RESTAURANT },
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
        const isSelected = selectedItems.find(selected => selected.id === item.id);
        const isNode = activeTab === TAG_TYPE.RESTAURANT && searchType === SEARCH_TYPE.TREE;
    
        return (
            <TouchableOpacity
                style={styles.listItem}
                onPress={() => (isNode ? handleNodePress(item) : handleItemPress(item))}
            >
                <View style={styles.content}>
                    <View style={styles.image} />
                    <View style={styles.listTitle}>
                        <Text style={{ fontSize: 16, fontWeight: '500', color: theme.colors.text }}>
                            {item.name}
                        </Text>
                        <Text style={{ fontSize: 14, color: COLORS.GREY, marginTop: 4 }}>
                            {isNode ? 'Category' : (activeTab === TAG_TYPE.PATIENT_RECIPES ? 'RECIPE' : 'FOOD')}
                        </Text>
                        {item.description && (
                            <Text style={{ fontSize: 12, color: COLORS.GREY, marginTop: 2 }}>
                                {item.description}
                            </Text>
                        )}
                    </View>
                </View>
                {!isNode && isSelected && (
                    <Text style={{ color: COLORS.BLUE, fontSize: 18 }}>✓</Text>
                )}
                {isNode && (
                    <Text style={{ color: COLORS.GREY, fontSize: 16 }}>›</Text>
                )}
            </TouchableOpacity>
        );
    };

    const renderSearchInput = () => (
        <View style={[styles.search, styles.offset]}>
            <TextInput
                value={searchQuery}
                placeholder="Search..."
                onChangeText={setSearchQuery}
                placeholderTextColor={COLORS.GREY}
                style={[styles.searchInput, { color: theme.colors.text }]}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
            />
        </View>
    );

    const renderReplaceInfo = () => {
        if (!replaceMode || !itemToReplace) { return null; }

        return (
            <View style={styles.replaceInfo}>
                <Text style={{ fontSize: 14, color: COLORS.GREY, marginBottom: 8 }}>
                    Replacing:
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '500', color: theme.colors.text }}>
                    {itemToReplace.recipe?.name || itemToReplace.food?.name || 'Item'}
                </Text>
            </View>
        );
    };

    const renderBreadcrumb = () => {
        if (!currentNodeName || !(activeTab === TAG_TYPE.RESTAURANT && searchType === SEARCH_TYPE.TREE)) { return null; }

        return (
            <View style={styles.breadcrumb}>
                <TouchableOpacity onPress={() => {
                    setCurrentNodeId(null);
                    setCurrentNodeName('');
                }}>
                    <Text style={{ color: COLORS.BLUE, textDecorationLine: 'underline' }}>
                        Back to root
                    </Text>
                </TouchableOpacity>
                <Text style={{ color: COLORS.GREY }}> › {currentNodeName}</Text>
            </View>
        );
    };

    // if (isLoading && page === 0) {
    //     return (
    //         <Screen initialized={true} style={styles.container}>
    //             <View style={styles.loadingContainer}>
    //                 <Text>Loading available items...</Text>
    //             </View>
    //         </Screen>
    //     );
    // }
    return (
        <Screen initialized={true} style={styles.container}>
            <View style={styles.offset}>
                <Text variant="h3" style={styles.title}>
                    {replaceMode ? `Replace ${activeTab.toLowerCase().replace('_', ' ')}` : `Select ${activeTab.toLowerCase().replace('_', ' ')}`}
                </Text>
            </View>

            {renderReplaceInfo()}

            {renderTabs()}

            {/* {renderBreadcrumb()} */}

            {renderSearchInput()}

            <FlatList
                data={allItems}
                style={styles.list}
                // data={filteredItems}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                    <Text style={[styles.emptyScreen, { textAlign: 'center', color: COLORS.GREY }]}>
            No items found
                    </Text>
                }
                ListFooterComponent={
                    isLoading && page > 0 ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text>Loading more...</Text>
                        </View>
                    ) : null
                }
            />

            <View style={styles.bottomSection}>
                {/* {Platform.OS === 'ios' && (
                    <View style={styles.scanButtonContainer}>
                        <Button
                            title="SCAN UPC CODE"
                            variant="secondary"
                            onPress={handleScanUPC}
                            style={styles.scanButton}
                            textStyle={styles.scanButtonText}
                        />
                    </View>
                )} */}

                {selectedItems.length > 0 && searchType === SEARCH_TYPE.ITEM && (
                    <View style={styles.buttonContainer}>
                        <Button
                            title={replaceMode
                                ? `Replace with ${selectedItems[0].name}`
                                : `Add ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}`
                            }
                            variant="primary"
                            onPress={handleApply}
                        />
                    </View>
                )}
            </View>
        </Screen>
    );
};

export default AddReplaceItem;

const styles = StyleSheet.create({
    container: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    offset: {
        paddingTop: 20,
        paddingLeft: 16,
        paddingRight: 16,
    },
    title: {
        paddingTop: 20,
        marginBottom: 20,
    },
    replaceInfo: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F5F5F5',
        marginBottom: 8,
    },
    breadcrumb: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F9F9F9',
        marginBottom: 8,
    },
    tabsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#156F93',
        borderRadius: 8,
        overflow: 'hidden',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: COLORS.LIGHT_GREY,
        alignItems: 'center',
        borderRightColor: '#156F93',
    },
    activeTabButton: {
        backgroundColor: COLORS.BLUE,
    },
    tabText: {
        color: COLORS.BLACK,
        fontWeight: '500',
    },
    activeTabText: {
        color: COLORS.WHITE,
        fontWeight: '600',
    },
    search: {
        marginBottom: 4,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: COLORS.GREY,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        backgroundColor: COLORS.WHITE,
    },
    list: {
        flex: 1,
        paddingLeft: 16,
        paddingRight: 0,
    },
    listItem: {
        display: 'flex',
        flexDirection: 'row',
        paddingVertical: 20,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.DARK_GREY,
        marginRight: 16,
    },
    content: {
        display: 'flex',
        flexDirection: 'row',
        maxWidth: '85%',
    },
    image: {
        width: 48,
        height: 48,
        marginRight: 4,
        backgroundColor: COLORS.LIGHT_GREY,
        borderRadius: 4,
    },
    listTitle: {
        flex: 1,
        alignSelf: 'center',
    },
    emptyScreen: {
        marginTop: 20,
    },
    bottomSection: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.LIGHT_GREY,
    },
    scanButtonContainer: {
        marginBottom: 16,
    },
    scanButton: {
        borderWidth: 0,
        backgroundColor: '#CAE1F9',
        paddingTop: 15,
        paddingBottom: 15,
    },
    scanButtonText: {
        color: '#567697',
        fontSize: 14,
        fontWeight: '500',
    },
    buttonContainer: {
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
