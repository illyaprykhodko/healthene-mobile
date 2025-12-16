// outsource dependencies
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    View,
    Image,
    FlatList,
    Keyboard,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { COLORS } from 'constants/colors';
import { ROUTES } from 'constants/routes';
import { RootStackParamList } from 'services/navigation';
import { SEARCH_TYPE, SUBSTANCE_TYPE, TAG_TYPE } from 'constants/spec';
import {
    useGetFoodsQuery,
    useGetRecipePrototypesQuery,
    useGetCategoryTreeNodesQuery,
    useGetCatalogPrototypeTreeNodesQuery,
} from 'store/api/dayOverviewApi';

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
    const isRecipesTab = selectedTab === TAG_TYPE.PATIENT_RECIPES;
    const isRestaurantTab = selectedTab === TAG_TYPE.RESTAURANT;
    const hasSearch = debouncedSearchQuery.trim().length > 0;

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 600);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    useEffect(() => {
        if (debouncedSearchQuery.trim().length === 0 && selectedTab !== TAG_TYPE.RESTAURANT) {
            setPage(0);
            setAllItems([]);
        }
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

    const handleSelectItem = useCallback((item: any) => {
        const isNode = searchType === SEARCH_TYPE.TREE;
        
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
    }, [searchType, date, selectedTab, substanceType, onApply, navigation]);

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
        setSearchQuery('');
        setDebouncedSearchQuery('');
        setCurrentNodeId(null);
        setBreadcrumb([]);
        // setSearchType(SEARCH_TYPE.ITEM);
        setSearchType(tabType === TAG_TYPE.RESTAURANT ? SEARCH_TYPE.TREE : SEARCH_TYPE.ITEM);
    }, []);

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
            const imageUrl = item.coverImage?.url;
            
            return (
                <TouchableOpacity style={styles.listItem} onPress={() => handleSelectItem(item)}>
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
                            {/* <Text style={styles.itemType}>
                                {selectedTab === TAG_TYPE.PATIENT_RECIPES || selectedTab === TAG_TYPE.RESTAURANT
                                    ? 'RECIPE'
                                    : 'FOOD'}
                            </Text> */}
                        </View>
                    </View>
                    <Icon name="chevron-right" size={16} color={COLORS.BLACK} />
                </TouchableOpacity>
            );
        },
        [handleSelectItem, selectedTab]
    );

    const renderSearchInput = () => (
        <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
                <Icon name="search" size={14} color={COLORS.GREY} style={styles.searchIcon} />
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
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                            setSearchQuery('');
                            setDebouncedSearchQuery('');
                        }}
                    >
                        <Icon name="times" size={14} color={COLORS.GREY} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={handleGoBack} style={{ paddingLeft: 16 }}>
                    <Icon name="arrow-left" size={20} color={COLORS.WHITE} />
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

    // if (isLoading && page === 0 && allItems.length === 0) {
    //     return (
    //         <View style={styles.loadingContainer}>
    //             <ActivityIndicator size="large" color={theme.colors.primary} />
    //         </View>
    //     );
    // }
    return (
        <Screen initialized style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Add item</Text>
            </View>
            {renderTabs()}
            {renderSearchInput()}
            <FlatList
                data={allItems}
                renderItem={renderItem}
                onEndReached={handleLoadMore}
                keyboardDismissMode="on-drag"
                onScrollBeginDrag={() => {
                    if (isKeyboardVisible) { Keyboard.dismiss(); }
                }}
                onEndReachedThreshold={0.1}
                keyExtractor={({ id }) => String(id)}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                    !isLoading ? (
                        <Text style={styles.emptyScreen}>
                            {searchQuery.trim().length > 0 ? 'No items found' : 'Enter a search term'}
                        </Text>
                    ) : null
                }
                ListFooterComponent={
                    isLoading && page > 0 ? (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                        </View>
                    ) : null
                }
            />
        </Screen>
    );
};

export default TreeAddReplaceItem;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 0,
        paddingRight: 0,
        backgroundColor: COLORS.WHITE,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        color: COLORS.BLACK,
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
        paddingHorizontal: OFFSET.HORIZONTAL,
        fontSize: 16,
    },
    loadingMore: {
        padding: 20,
        alignItems: 'center',
    },
});
