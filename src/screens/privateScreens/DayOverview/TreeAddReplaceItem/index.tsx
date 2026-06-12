// outsource dependencies
import {
    View,
    FlatList,
    Keyboard,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import Icon from '@react-native-vector-icons/fontawesome5';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// local dependencies
import {
    useGetFoodsQuery,
    useLazyGetAiFoodsQuery,
    useGetAiFoodDataMutation,
    useGetRecipePrototypesQuery,
    useGetCategoryTreeNodesQuery,
    useGetCatalogPrototypeTreeNodesQuery,
} from 'store/api/dayOverviewApi';
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { COLORS } from 'constants/colors';
import { ROUTES } from 'constants/routes';
import DefImage from 'components/DefImage';
import { GlassSurface } from 'components/GlassSurface';
import { RootStackParamList } from 'services/navigation';
import { ENTITY_TYPE, SEARCH_TYPE, SUBSTANCE_TYPE, TAG_TYPE } from 'constants/spec';

interface TreeItem {
    id: number;
    name: string;
    coverImage?: {
        url: string;
    };
    // list?: TreeItem[];
}

interface TreeAddReplaceItemProps {
    date: string;
    prevItem?: any;
    entityType: string;
    substanceType: string;
    onApply?: (data: any) => void;
}

const TreeAddReplaceItem: React.FC = () => {
    const theme = useTheme();
    const route = useRoute<any>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const params = route.params as TreeAddReplaceItemProps;
    const { date, entityType, substanceType, onApply } = params;

    const [currentNodeId, setCurrentNodeId] = useState<number | null>(null);
    const [breadcrumb, setBreadcrumb] = useState<TreeItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState(entityType || TAG_TYPE.PATIENT_FOOD);

    const [searchType, setSearchType] = useState(
        // SEARCH_TYPE.ITEM
        entityType === TAG_TYPE.RESTAURANT ? SEARCH_TYPE.TREE : SEARCH_TYPE.ITEM
    );
    const [page, setPage] = useState(0);
    const [allItems, setAllItems] = useState<any[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isAiItemLoading, setIsAiItemLoading] = useState(false);
    const [aiFoods, setAiFoods] = useState<any[]>([]);
    const [isAiFoodsAdded, setIsAiFoodsAdded] = useState(false);
    const isRecipesTab = selectedTab === TAG_TYPE.PATIENT_RECIPES;
    const isRestaurantTab = selectedTab === TAG_TYPE.RESTAURANT;
    const hasSearch = debouncedSearchQuery.trim().length > 0;
    const [getAiFoodsTrigger] = useLazyGetAiFoodsQuery();
    const [getAiFoodData] = useGetAiFoodDataMutation();

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 600);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Reset paginated state whenever the (debounced) search term changes. Without this,
    // editing the query while results are paginated would leave `page` at e.g. 2, so the
    // next query fires with { nameFragment: <new>, page: 2 } and the items effect takes
    // the append branch — new results would concat onto the previous ones.
    // The clear-to-empty case on the RESTAURANT tab is preserved as a no-op so the tree
    // browsing state isn't wiped when the user just clears the search there.
    useEffect(() => {
        if (debouncedSearchQuery.trim().length === 0 && selectedTab === TAG_TYPE.RESTAURANT) {
            return;
        }
        setPage(0);
        setAllItems([]);
        setAiFoods([]);
        setIsAiFoodsAdded(false);
    }, [debouncedSearchQuery, selectedTab]);
    const { data: categoryTreeData, isLoading: isCategoryTreeLoading } = useGetCategoryTreeNodesQuery(
        {
            filter: {
                parentId: currentNodeId || undefined,
                name: debouncedSearchQuery || undefined,
                treeTypeViewLabel: 'PATIENT_NAVIGATION',
                systemTag: substanceType === SUBSTANCE_TYPE.DRINK ? 'PATIENT_DRINK' : 'PATIENT_FOOD',
            },
            page,
            size: 10,
            sort: 'name,ASC',
        },
        {
            skip: !(
                (selectedTab === TAG_TYPE.PATIENT_FOOD || selectedTab === TAG_TYPE.PATIENT_DRINK)
                && searchType === SEARCH_TYPE.TREE
            ),
        }
    );
    const { data: catalogTreeData, isLoading: isCatalogTreeLoading } = useGetCatalogPrototypeTreeNodesQuery(
        {
            filter: {
                restaurantCatalog: true,
                parentId: currentNodeId || undefined,
                name: debouncedSearchQuery || undefined,
                // hasParent: true,
            },
            page,
            size: 10,
            sort: 'name,ASC',
        },
        {
            skip: !(selectedTab === TAG_TYPE.RESTAURANT && searchType === SEARCH_TYPE.TREE),
        }
    );
    // Foods Query (for item search)
    const { data: foodsData, isLoading: isFoodsLoading } = useGetFoodsQuery(
        {
            filter: {
                isEnabled: true,
                treeTypeViewLabel: 'PATIENT_NAVIGATION',
                categoryNodeId: currentNodeId || undefined,
                nameFragment: debouncedSearchQuery || undefined,
            },
            page,
            size: 10,
            sort: 'name,ASC',
        },
        {
            skip: !(
                (selectedTab === TAG_TYPE.PATIENT_FOOD || selectedTab === TAG_TYPE.PATIENT_DRINK)
                && searchType === SEARCH_TYPE.ITEM
                && debouncedSearchQuery.trim().length > 0
            ),
        }
    );

    // Recipe Query
    const { data: recipeData, isLoading: isRecipeLoading } = useGetRecipePrototypesQuery(
        {
            filter: {
                name: hasSearch ? debouncedSearchQuery : undefined,
                catalogNodeId: isRestaurantTab ? (currentNodeId || undefined) : undefined,
                // restaurantCatalog: isRestaurantTab,
            },
            page,
            size: 10,
            sort: 'name,ASC',
        },
        {
            skip: !(
                searchType === SEARCH_TYPE.ITEM
                && (
                    (isRecipesTab && hasSearch)
                    || (isRestaurantTab && currentNodeId != null)
                )
            ),
        }
    );
    // const { data: recipeData, isLoading: isRecipeLoading } = useGetRecipePrototypesQuery(
    //     {
    //         filter: {
    //             name: debouncedSearchQuery || undefined,
    //             catalogNodeId: currentNodeId || undefined,
    //         },
    //         page,
    //         size: 10,
    //         sort: 'name,ASC',
    //     },
    //     {
    //         skip: !(
    //             selectedTab === TAG_TYPE.PATIENT_RECIPES
    //             && searchType === SEARCH_TYPE.ITEM
    //             // && debouncedSearchQuery.trim().length > 0
    //             && currentNodeId != null
    //         ),
    //     }
    // );

    const EMPTY = useMemo(() => [] as any[], []);

    // const currentContent: any[] = useMemo(() => {
    //     if (selectedTab === TAG_TYPE.RESTAURANT && searchType === SEARCH_TYPE.TREE) {
    //         return catalogTreeData?.content || EMPTY;
    //     }
    //     if ((selectedTab === TAG_TYPE.PATIENT_FOOD || selectedTab === TAG_TYPE.PATIENT_DRINK) && searchType === SEARCH_TYPE.TREE) {
    //         return categoryTreeData?.content || EMPTY;
    //     }
    //     if ((selectedTab === TAG_TYPE.PATIENT_FOOD || selectedTab === TAG_TYPE.PATIENT_DRINK) && searchType === SEARCH_TYPE.ITEM) {
    //         return foodsData?.content || EMPTY;
    //     }
    //     if (selectedTab === TAG_TYPE.PATIENT_RECIPES && searchType === SEARCH_TYPE.ITEM) {
    //         return recipeData?.content || EMPTY;
    //     }
    //     return EMPTY;
    // }, [selectedTab, searchType, categoryTreeData, catalogTreeData, foodsData, recipeData, EMPTY]);
    const currentContent: any[] = useMemo(() => {
        if (selectedTab === TAG_TYPE.RESTAURANT && searchType === SEARCH_TYPE.TREE) {
            return catalogTreeData?.content || EMPTY;
        }
        if ((selectedTab === TAG_TYPE.PATIENT_FOOD || selectedTab === TAG_TYPE.PATIENT_DRINK) && searchType === SEARCH_TYPE.TREE) {
            return categoryTreeData?.content || EMPTY;
        }
        if ((selectedTab === TAG_TYPE.PATIENT_FOOD || selectedTab === TAG_TYPE.PATIENT_DRINK) && searchType === SEARCH_TYPE.ITEM) {
            return foodsData?.content || EMPTY;
        }
        if (
            (selectedTab === TAG_TYPE.PATIENT_RECIPES || selectedTab === TAG_TYPE.RESTAURANT)
            && searchType === SEARCH_TYPE.ITEM
        ) {
            return recipeData?.content || EMPTY;
        }
        return EMPTY;
    }, [selectedTab, searchType, categoryTreeData, catalogTreeData, foodsData, recipeData, EMPTY]);
    const isLoading = useMemo(() => {
        if (selectedTab === TAG_TYPE.RESTAURANT && searchType === SEARCH_TYPE.TREE) {
            return isCatalogTreeLoading;
        }
        if (
            (selectedTab === TAG_TYPE.PATIENT_FOOD || selectedTab === TAG_TYPE.PATIENT_DRINK)
            && searchType === SEARCH_TYPE.TREE
        ) {
            return isCategoryTreeLoading;
        }
        if (
            (selectedTab === TAG_TYPE.PATIENT_FOOD || selectedTab === TAG_TYPE.PATIENT_DRINK)
            && searchType === SEARCH_TYPE.ITEM
        ) {
            return isFoodsLoading;
        }
        if (
            (selectedTab === TAG_TYPE.PATIENT_RECIPES || selectedTab === TAG_TYPE.RESTAURANT)
            && searchType === SEARCH_TYPE.ITEM
        ) {
            return isRecipeLoading;
        }
        return false;
    }, [selectedTab, searchType, isCategoryTreeLoading, isCatalogTreeLoading, isFoodsLoading, isRecipeLoading]);
    // const isLoading = useMemo(() => {
    //     if (selectedTab === TAG_TYPE.RESTAURANT && searchType === SEARCH_TYPE.TREE) { return isCatalogTreeLoading; }
    //     if ((selectedTab === TAG_TYPE.PATIENT_FOOD || selectedTab === TAG_TYPE.PATIENT_DRINK) && searchType === SEARCH_TYPE.TREE) { return isCategoryTreeLoading; }
    //     if ((selectedTab === TAG_TYPE.PATIENT_FOOD || selectedTab === TAG_TYPE.PATIENT_DRINK) && searchType === SEARCH_TYPE.ITEM) { return isFoodsLoading; }
    //     if (selectedTab === TAG_TYPE.PATIENT_RECIPES && searchType === SEARCH_TYPE.ITEM) { return isRecipeLoading; }
    //     return false;
    // }, [selectedTab, searchType, isCategoryTreeLoading, isCatalogTreeLoading, isFoodsLoading, isRecipeLoading]);

    const contentKey = useMemo(() => (currentContent || []).map((i: any) => i.id).join('|'), [currentContent]);
    const allItemsKey = useMemo(() => allItems.map(i => i.id).join('|'), [allItems]);

    useEffect(() => {
        if (!Array.isArray(currentContent) || (debouncedSearchQuery.trim().length === 0 && selectedTab !== TAG_TYPE.RESTAURANT)) { return; }
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
    }, [page, contentKey, allItemsKey, currentContent, debouncedSearchQuery, selectedTab]);

    const handleSelectItem = useCallback(async (item: any) => {
        const isNode = searchType === SEARCH_TYPE.TREE;

        if (item?.isDisabled) {
            return;
        }

        if (item?.isGPTFood) {
            try {
                setIsAiItemLoading(true);
                const aiItem = await getAiFoodData({ name: item.name }).unwrap();
                (navigation as any).navigate(ROUTES.EDIT_FOOD, {
                    date,
                    item: aiItem,
                    substanceType,
                    entityType: selectedTab,
                    onApply: (editedItem: any) => {
                        if (onApply) {
                            onApply({ item: editedItem });
                        }
                    },
                });
            } finally {
                setIsAiItemLoading(false);
            }
            return;
        }

        if (isNode) {
            setBreadcrumb(prev => [...prev, item]);
            // setList(item.list || []);
            setCurrentNodeId(item.id);
            setPage(0);
            setAllItems([]);
            if (selectedTab === TAG_TYPE.RESTAURANT) {
                setSearchType(SEARCH_TYPE.ITEM);
            }
        } else {
            (navigation as any).navigate(ROUTES.EDIT_FOOD, {
                item,
                date,
                entityType: selectedTab,
                substanceType,
                onApply: (editedItem: any) => {
                    if (onApply) {
                        onApply({ item: editedItem });
                    }
                },
            });
        }
    }, [searchType, date, selectedTab, substanceType, onApply, navigation, getAiFoodData]);

    const handleGoBack = useCallback(() => {
        if (breadcrumb.length > 0) {
            const newBreadcrumb = [...breadcrumb];
            newBreadcrumb.pop();
            setBreadcrumb(newBreadcrumb);

            if (newBreadcrumb.length > 0) {
                const currentParent = newBreadcrumb[newBreadcrumb.length - 1];
                setCurrentNodeId(currentParent.id);
            } else {
                setCurrentNodeId(null);
            }

            if (selectedTab === TAG_TYPE.RESTAURANT) {
                setSearchType(SEARCH_TYPE.TREE);
            }

            setPage(0);
            setAllItems([]);
        } else {
            navigation.goBack();
        }
    }, [breadcrumb, navigation, selectedTab]);

    // const handleGoBack = useCallback(() => {
    //     if (breadcrumb.length > 0) {
    //         const newBreadcrumb = [...breadcrumb];
    //         // const parent = newBreadcrumb.pop();
    //         newBreadcrumb.pop();
    //         setBreadcrumb(newBreadcrumb);

    //         if (newBreadcrumb.length > 0) {
    //             const currentParent = newBreadcrumb[newBreadcrumb.length - 1];
    //             // setList(currentParent.list || []);
    //             setCurrentNodeId(currentParent.id);
    //             if (selectedTab === TAG_TYPE.RESTAURANT) {
    //                 setSearchType(SEARCH_TYPE.ITEM);
    //             }
    //         } else {
    //             setCurrentNodeId(null);
    //         }
    //         setPage(0);
    //         setAllItems([]);
    //     } else {
    //         navigation.goBack();
    //     }
    // }, [breadcrumb, navigation]);

    // const handleConfirmReplace = useCallback(async ({ prevItem, nextItem }: { prevItem: any; nextItem: any }) => {
    //     try {
    //         if (onApply) {
    //             onApply({ item: nextItem });
    //         }

    //         // Navigate back
    //         navigation.goBack();
    //     } catch (error) {
    //         console.error('Error replacing item:', error);
    //     }
    // }, [onApply, navigation]);
    const handleLoadMore = useCallback(() => {
        if (!isLoading && Array.isArray(currentContent) && currentContent.length > 0) {
            setPage(prev => prev + 1);
        }
    }, [isLoading, currentContent]);

    const handleTabPress = useCallback((tabType: string) => {
        setSelectedTab(tabType);
        setPage(0);
        setAllItems([]);
        setAiFoods([]);
        setIsAiFoodsAdded(false);
        setSearchQuery('');
        setDebouncedSearchQuery('');
        setCurrentNodeId(null);
        setBreadcrumb([]);
        // setSearchType(SEARCH_TYPE.ITEM);
        setSearchType(tabType === TAG_TYPE.RESTAURANT ? SEARCH_TYPE.TREE : SEARCH_TYPE.ITEM);
    }, []);

    const handleShowMore = useCallback(async () => {
        if (isAiLoading || !debouncedSearchQuery.trim()) {
            return;
        }
        try {
            setIsAiLoading(true);
            const data = await getAiFoodsTrigger({ name: debouncedSearchQuery.trim() }).unwrap();
            if (!Array.isArray(data) || data.length === 0) {
                return;
            }
            const preparedData = data.map((item: any) => ({
                ...item,
                isGPTFood: true,
                id: `${item.name}-${Math.random()}`,
            }));
            setAiFoods(preparedData);
            setIsAiFoodsAdded(true);
        } finally {
            setIsAiLoading(false);
        }
    }, [debouncedSearchQuery, getAiFoodsTrigger, isAiLoading]);

    const renderTabs = useCallback(() => {
        const tabs = [
            { label: 'Food/Drink', value: TAG_TYPE.PATIENT_FOOD },
            { label: 'Recipes', value: TAG_TYPE.PATIENT_RECIPES },
            { label: 'Restaurants', value: TAG_TYPE.RESTAURANT },
        ];

        return (
            <View style={styles.tabsRow}>
                {tabs.map((tab, index) => {
                    const isActive = selectedTab === tab.value;
                    return (
                        <TouchableOpacity
                            key={tab.value}
                            style={[
                                styles.tabButton,
                                isActive && styles.activeTabButton,
                                { borderRightWidth: tabs.length === index + 1 ? 0 : 2 },
                                { backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceAlt },
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
    }, [selectedTab, handleTabPress]);
    // const renderItem = useCallback(({ item }: { item: TreeItem }) => {
    //     const hasSubcategories = !!item.list && item.list.length > 0;

    //     return (
    //         <TouchableOpacity
    //             onPress={() => handleSelectItem(item)}
    //             style={[styles.listItem, { borderBottomColor: theme.colors.border }]}
    //         >
    //             {item.coverImage?.url ? (
    //                 <View style={[styles.image, { backgroundColor: theme.colors.lightGrey }]} />
    //             ) : (
    //                 <View style={[styles.image, { backgroundColor: theme.colors.lightGrey }]} />
    //             )}
    //             <Text variant="h4" numberOfLines={1} style={[styles.listItemText, { color: theme.colors.text }]}>
    //                 {item.name}
    //             </Text>
    //             <Icon name="chevron-right" color={theme.colors.black} size={16} />
    //         </TouchableOpacity>
    //     );
    // }, [theme, handleSelectItem]);
    const renderItem = useCallback(
        ({ item }: { item: any }) => {
            if (item?.isDisabled) {
                return (
                    <View style={styles.listItem}>
                        <Text style={[styles.itemName, styles.additionalTitle]} numberOfLines={2}>
                            {item.name}
                        </Text>
                    </View>
                );
            }

            const imageUrl = item.coverImage?.url;

            return (
                <TouchableOpacity style={styles.listItem} onPress={() => handleSelectItem(item)}>
                    <View style={styles.content}>
                        <DefImage
                            src={imageUrl}
                            style={styles.image}
                        />
                        <View style={styles.listTitle}>
                            <Text style={styles.itemName} numberOfLines={2}>
                                {item.name}
                            </Text>
                            {/* <Text style={styles.itemType}>
                                {selectedTab === TAG_TYPE.PATIENT_RECIPES || selectedTab === TAG_TYPE.RESTAURANT
                                    ? 'RECIPE'
                                    : 'FOOD'}
                            </Text> */}
                        </View>
                    </View>
                    <Icon iconStyle="solid" name="chevron-right" size={16} color={theme.colors.text} />
                </TouchableOpacity>
            );
        },
        [handleSelectItem, selectedTab]
    );

    const renderSearchInput = () => (
        <View style={styles.searchContainer}>
            <View style={[styles.searchInputWrapper, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
                <Icon iconStyle="solid" name="search" size={14} color={theme.colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    value={searchQuery}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="search"
                    placeholder="Search..."
                    onChangeText={(value: string) => {
                        setSearchQuery(value);
                        setAiFoods([]);
                        setIsAiFoodsAdded(false);
                    }}
                    placeholderTextColor={theme.colors.textSecondary}
                    style={[styles.searchInput, { color: theme.colors.text }]}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                            setSearchQuery('');
                            setDebouncedSearchQuery('');
                            setAiFoods([]);
                            setIsAiFoodsAdded(false);
                        }}
                    >
                        <Icon iconStyle="solid" name="times" size={14} color={COLORS.GREY} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={handleGoBack} style={{ paddingLeft: 16 }}>
                    <Icon iconStyle="solid" name="arrow-left" size={20} color={theme.colors.headerText} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, handleGoBack]);

    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const displayedItems = useMemo(() => {
        if (!isAiFoodsAdded || aiFoods.length === 0) {
            return allItems;
        }

        return [
            ...allItems,
            { id: 'additionalSearchResult', isDisabled: true, name: 'Additional Search Result' },
            ...aiFoods,
        ];
    }, [allItems, aiFoods, isAiFoodsAdded]);

    const isShowMoreVisible = useMemo(
        () => selectedTab === TAG_TYPE.PATIENT_FOOD
            && searchType === SEARCH_TYPE.ITEM
            && debouncedSearchQuery.trim().length > 3
            && !isAiFoodsAdded,
        [selectedTab, searchType, debouncedSearchQuery, isAiFoodsAdded]
    );

    // if (isLoading && page === 0 && allItems.length === 0) {
    //     return (
    //         <View style={styles.loadingContainer}>
    //             <ActivityIndicator size="large" color={theme.colors.primary} />
    //         </View>
    //     );
    // }
    return (
        <Screen initialized style={styles.container}>
            <View style={[styles.header, { backgroundColor: theme.colors.surfaceAlt }]}>
                <Text style={styles.headerTitle}>Add item</Text>
            </View>
            {renderTabs()}
            {renderSearchInput()}
            <FlatList
                data={displayedItems}
                renderItem={renderItem}
                onEndReachedThreshold={0.1}
                onEndReached={handleLoadMore}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.listContent}
                keyExtractor={({ id }) => String(id)}
                onScrollBeginDrag={() => {
                    if (isKeyboardVisible) { Keyboard.dismiss(); }
                }}
                ListEmptyComponent={
                    isLoading || isAiLoading ? (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                        </View>
                    ) : (
                        <Text style={styles.emptyScreen}>
                            {searchQuery.trim().length > 0 ? 'No items found' : 'Enter a search term'}
                        </Text>
                    )
                }
                ListFooterComponent={
                    isLoading && page > 0 ? (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                        </View>
                    ) : isShowMoreVisible ? (
                        <TouchableOpacity
                            onPress={handleShowMore}
                            style={styles.showMoreContainer}
                            disabled={isLoading || isAiLoading}
                        >
                            {isAiLoading ? (
                                <ActivityIndicator size="small" color={theme.colors.primary} />
                            ) : (
                                <Text style={styles.showMoreText}>✨  Show More...</Text>
                            )}
                        </TouchableOpacity>
                    ) : null
                }
            />
            <GlassSurface
                intensity={5}
                style={styles.glassBar}
                tint={theme.dark ? 'dark' : 'light'}
            >
                <View style={styles.upcBtnContainer}>
                    <TouchableOpacity
                        style={styles.upcBtn}
                        onPress={() => (navigation as any).navigate(ROUTES.UPC_SCAN, {
                            date,
                            onApply,
                            substanceType,
                            entityType: ENTITY_TYPE.FOOD,
                        })}
                    >
                        <Text style={styles.upcBtnText}>SCAN UPC CODE</Text>
                    </TouchableOpacity>
                </View>
            </GlassSurface>
            {isAiItemLoading && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            )}
        </Screen>
    );
};

export default TreeAddReplaceItem;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 0,
        paddingRight: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        alignItems: 'center',
        backgroundColor: '#F3F3F3',
        borderRightColor: '#156F93',
    },
    activeTabButton: {
        backgroundColor: '#2978A0',
    },
    tabText: {
        fontWeight: '500',
        fontSize: 14,
    },
    activeTabText: {
        color: COLORS.WHITE,
        fontWeight: '600',
    },
    searchContainer: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        marginBottom: OFFSET.VERTICAL * 0.5,
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
        marginBottom: 4,
    },
    additionalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.GREY,
        textDecorationLine: 'underline',
        textAlign: 'right',
        width: '100%',
        marginBottom: 0,
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
        paddingHorizontal: OFFSET.HORIZONTAL,
        fontSize: 16,
    },
    loadingMore: {
        padding: 20,
        alignItems: 'center',
    },
    showMoreContainer: {
        minHeight: 26,
        justifyContent: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL,
        marginBottom: OFFSET.VERTICAL,
    },
    showMoreText: {
        fontSize: 22,
        color: '#156F93',
        fontWeight: '300',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DADADA99',
    },
    upcBtnContainer: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
        // marginBottom: OFFSET.VERTICAL
    },
    upcBtn: {
        backgroundColor: '#CAE1F9',
        borderRadius: 30,
        paddingVertical: OFFSET.VERTICAL * 0.75,
        alignItems: 'center',
        justifyContent: 'center',
    },
    upcBtnText: {
        color: '#567697',
        fontSize: 14,
        fontWeight: '500',
    },
    glassBar: {
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 6,
        position: 'absolute',
    },
    listContent: {
        // Room so the last items scroll up above the floating glass SCAN bar.
        paddingBottom: 88,
    },
});
