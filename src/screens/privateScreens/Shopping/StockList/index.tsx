// outsource dependencies
import { StyleSheet, View, SectionList } from 'react-native';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigation, StackActions } from '@react-navigation/native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import Checkbox from 'components/Checkbox';
import DefImage from 'components/DefImage';
import { Button } from 'components/Button';
import StackHeader from 'components/StackHeader';
import { useAppDispatch, useAppSelector } from 'store';
import HorizontalMenu from 'components/HorizontalMenu';
import { useShoppingDrawer } from '../useShoppingDrawer';
import { PressableScale } from 'components/PressableScale';
import ConfirmationAlert from 'components/ConfirmationAlert';
import { SHOPPING_STEP, SHOPPING_STATUS, SHOPPING_CONFIRMED_ITEM_TYPE } from 'constants/spec';
import {
    selectShopping,
    setCurrentStep,
    toggleStockItem,
    setShoppingStatus,
    selectCheckedStockItems,
} from 'store/slices/shoppingSlice';
import {
    useGetStockListQuery,
    useGetStockCategoriesQuery,
    useUpdateStockItemsMutation,
    useMoveStocksToShoppingListMutation,
    useUpdateShoppingListStatusMutation,
} from 'store/api/shoppingApi';

interface StockItem {
    id: number;
    gramWeight: number;
    food: {
        id: number;
        name: string;
        coverImage?: { url: string };
        shoppingCartCategory?: {
            id: number;
            name: string;
        };
    };
}

interface GroupedSection {
    title: string;
    data: StockItem[];
}

const ALL_CATEGORY: { name: string; id?: number | null } = { name: 'All' };
const ADDITIONAL_CATEGORY_NAME = 'Additional';

const StockList: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();
    const openDrawer = useShoppingDrawer();

    const [open, setOpen] = useState(true);
    const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<{ name: string; id?: number | null }>(ALL_CATEGORY);
    const [page, setPage] = useState(0);
    const checkedItems = useAppSelector(selectCheckedStockItems);
    const {
        confirmedItemsType,
        separateRescueItems,
        id: shoppingListId,
    } = useAppSelector(selectShopping);
    const includeRescueFoodsInShoppingList = useAppSelector(state => state.app?.user?.includeRescueFoodsInShoppingList);
    const hasActiveCategoryId = Object.prototype.hasOwnProperty.call(activeCategory || {}, 'id');
    const selectedStockCategoryId = hasActiveCategoryId
        ? activeCategory.id
        : undefined;
    const { data: stockData, isLoading, isFetching } = useGetStockListQuery({
        shoppingCartCategoryId: selectedStockCategoryId,
        page,
        size: 20,
    });
    // const { data: stockData, isLoading } = useGetStockListQuery();
    // TEMP: updateStock is kept for the upcoming revert — the call site below is commented in handleNextBtn.
    // eslint-disable-next-line no-unused-vars
    const [updateStock, { isLoading: isUpdating }] = useUpdateStockItemsMutation();
    const { data: categoriesData } = useGetStockCategoriesQuery();
    const [moveStocksToShoppingList, { isLoading: isMovingStocks }] = useMoveStocksToShoppingListMutation();
    const [updateShoppingListStatus, { isLoading: isFinalizing }] = useUpdateShoppingListStatusMutation();
    const stockList = stockData?.content || [];
    const isAllCategory = activeCategory?.name === 'All';
    // Get unique categories
    // const tabs = useMemo(() => {
    //     const categories = new Map<number, string>();
    //     stockList.forEach((item: StockItem) => {
    //         const cat = item.food?.shoppingCartCategory;
    //         if (cat) {
    //             categories.set(cat.id, cat.name);
    //         }
    //     });
    //     return [
    //         { name: 'All' },
    //         ...Array.from(categories.entries()).map(([id, name]) => ({ id, name })),
    //     ];
    // }, [stockList]);
    const tabs = useMemo(() => {
        const categories = categoriesData || [];
        const normalized = categories
            .filter(category => category && typeof category.name === 'string' && category.name.trim() !== '')
            .map(category => ({ ...category, name: category.name.trim() }));
        return [ALL_CATEGORY, ...normalized];
    }, [categoriesData]);

    const uncategorizedCategoryName = useMemo(() => (
        tabs.find(tab => tab?.id === null || tab?.id === 0)?.name || ADDITIONAL_CATEGORY_NAME
    ), [tabs]);
    // Filter and group by category
    const groupedList: GroupedSection[] = useMemo(() => {
        // let filtered = stockList;
        // if (activeCategory.id) {
        //     filtered = stockList.filter(
        //         (item: StockItem) => item.food?.shoppingCartCategory?.id === activeCategory.id
        //     );
        // }

        const grouped: Record<string, StockItem[]> = {};
        stockList.forEach((item: StockItem) => {
            const categoryName = item.food?.shoppingCartCategory?.name
                || (item as any)?.shoppingCartCategory?.name
                || uncategorizedCategoryName;
            if (!grouped[categoryName]) {
                grouped[categoryName] = [];
            }
            grouped[categoryName].push(item);
        });

        return Object.entries(grouped).map(([title, data]) => ({ title, data }));
    }, [stockList, uncategorizedCategoryName]);

    const handleGoBack = useCallback(() => {
        dispatch(setCurrentStep(SHOPPING_STEP.MAIN));
        navigation.goBack();
    }, [navigation, dispatch]);

    const handleToggleItem = useCallback((item: StockItem) => {
        dispatch(toggleStockItem(item.id));
    }, [dispatch]);

    const handleNextBtn = useCallback(async () => {
        try {
            if (checkedItems.length > 0) {
                // await updateStock({ ids: checkedItems }).unwrap();
                await moveStocksToShoppingList({ ids: checkedItems }).unwrap();
            }
            // HS-3113: third shopping-list review removed. Instead of flipping to
            // SHOPPING_STEP.CHECK and bouncing back to ShoppingList, prompt the
            // finalize confirmation right here. Kept commented to ease revert.
            // dispatch(setCurrentStep(SHOPPING_STEP.CHECK));
            // navigation.navigate(ROUTES.SHOPPING_LIST);
            setIsFinalizeOpen(true);
        } catch (error) {
            console.error('Error updating stock:', error);
        }
    }, [checkedItems, moveStocksToShoppingList]);

    const buildShopOnMyOwnPayload = useCallback(() => {
        const allItems = includeRescueFoodsInShoppingList;
        const mainCondition = confirmedItemsType === SHOPPING_CONFIRMED_ITEM_TYPE.NONE;
        const newConfirmedItemsType = allItems
            ? SHOPPING_CONFIRMED_ITEM_TYPE.ALL
            : mainCondition
                ? SHOPPING_CONFIRMED_ITEM_TYPE.ORIGINAL
                : SHOPPING_CONFIRMED_ITEM_TYPE.ALL;
        return { newConfirmedItemsType };
    }, [includeRescueFoodsInShoppingList, confirmedItemsType]);

    const handleFinalize = useCallback(async () => {
        try {
            // TEMP: mirrors ShoppingList.handleFinalize until /shop-on-my-own is restored on backend.
            if (shoppingListId) {
                const { newConfirmedItemsType } = buildShopOnMyOwnPayload();
                await updateShoppingListStatus({
                    separateRescueItems,
                    id: shoppingListId,
                    status: SHOPPING_STATUS.SHOP_ON_MY_OWN,
                    confirmedItemsType: newConfirmedItemsType,
                }).unwrap();
                dispatch(setShoppingStatus({
                    status: SHOPPING_STATUS.SHOP_ON_MY_OWN,
                    confirmedItemsType: newConfirmedItemsType,
                }));
            }
            dispatch(setCurrentStep(SHOPPING_STEP.MAIN));
            setIsFinalizeOpen(false);
            navigation.dispatch(StackActions.replace(ROUTES.SHOPPING_LIST, { isShopOnMyOwn: true }));
        } catch (error) {
            console.error('Error finalizing shopping list:', error);
        }
    }, [shoppingListId, separateRescueItems, buildShopOnMyOwnPayload, updateShoppingListStatus, dispatch, navigation]);

    const handleCloseFinalizeAlert = useCallback(() => setIsFinalizeOpen(false), []);

    const handleCategoryChange = useCallback((item: any) => {
        const next = item?.activeItem ?? item;
        setActiveCategory({ name: next?.name ?? 'All', id: next?.id });
        // setActiveCategory(item.activeItem || item);
        setPage(0);
    }, []);

    const handleCloseAlert = useCallback(() => setOpen(false), []);

    const disabled = isLoading || isUpdating || isMovingStocks || isFinalizing;

    const renderItem = useCallback(({ item, index }: { item: StockItem; index: number }) => {
        const isChecked = checkedItems.includes(item.id);

        // Convert weight
        // let convertedWeight = filters.kilogramsToPounds(item.gramWeight);
        let convertedWeight = Math.round((item.gramWeight / 1000) * 2.20462 * 100) / 100;
        let unit = 'lbs';
        if (convertedWeight <= 0) {
            convertedWeight = Math.round(item.gramWeight * 0.03527396195 * 1000) / 1000;
            unit = 'oz';
        }

        return (
            <Animated.View
                exiting={FadeOut.duration(220)}
                layout={LinearTransition.springify().damping(20)}
                entering={FadeInDown.delay(Math.min(index, 10) * 80).springify().mass(1.2).damping(30)}
            >
                <PressableScale
                    scale={1}
                    haptic="success"
                    disabled={disabled}
                    style={styles.itemContainer}
                    onPress={() => handleToggleItem(item)}
                >
                    <DefImage
                        src={item.food?.coverImage?.url}
                        style={isChecked ? { ...styles.image, ...styles.imageChecked } : styles.image}
                    />
                    <View style={styles.textContainer}>
                        <Text
                            variant="h5"
                            style={isChecked ? styles.textDecoration : undefined}
                        >
                            {item.food?.name}
                        </Text>
                        <Text
                            variant="h6"
                            color={COLORS.GREY}
                            style={isChecked ? styles.textDecoration : undefined}
                        >
                            {convertedWeight} {unit}
                        </Text>
                    </View>
                    {/* Visual-only checkbox — pointerEvents=none so the row PressableScale owns the tap. */}
                    <View pointerEvents="none" style={styles.checkboxWrap}>
                        <Checkbox
                            editable={false}
                            value={isChecked}
                            onChange={() => {}}
                        />
                    </View>
                </PressableScale>
            </Animated.View>
        );
    }, [checkedItems, disabled, handleToggleItem]);

    const renderSectionHeader = useCallback(({ section }: { section: GroupedSection }) => (
        <View style={[
            isAllCategory ? styles.sectionMuted : styles.section,
            { backgroundColor: theme.colors.surfaceAlt, borderBottomColor: theme.colors.border },
        ]}>
            <Text variant="h3" style={styles.sectionTitle} color={theme.colors.primary}>
                {isAllCategory ? section.title : `Select all ${section.title} You Need`}
            </Text>
        </View>
    ), [isAllCategory, theme.colors]);
    const renderListHeader = useCallback(() => (
        <View style={[styles.section, { backgroundColor: theme.colors.surfaceAlt, borderBottomColor: theme.colors.border }]}>
            <Text variant="h3" style={styles.sectionTitle} color={theme.colors.primary}>Select all Produce You Need</Text>
        </View>
    ), [theme.colors]);

    return (
        <Screen initialized={!isLoading} style={styles.container}>
            <StackHeader
                title="Stock List"
                onBack={handleGoBack}
                onOpenDrawer={openDrawer}
            />
            <View style={styles.content}>
                {groupedList.length === 0 ? (
                    <Text textAlign="center" color={COLORS.GREY} style={styles.emptyText}>
                        No Stock list was found
                    </Text>
                ) : (
                    <>
                        <HorizontalMenu
                            data={tabs}
                            disabled={disabled}
                            activeItem={activeCategory}
                            handleItem={handleCategoryChange}
                        />
                        {isAllCategory && renderListHeader()}
                        <SectionList
                            sections={groupedList}
                            renderItem={renderItem}
                            stickySectionHeadersEnabled
                            renderSectionHeader={renderSectionHeader}
                            keyExtractor={(item, index) => `${item.id}_${index}`}
                            onEndReached={() => {
                                if (stockData && !isFetching && page + 1 < stockData.totalPages) {
                                    setPage(p => p + 1);
                                }
                            }}
                        />
                    </>
                )}
            </View>

            <View style={styles.buttonControl}>
                <Button
                    title="Finalize"
                    variant="primary"
                    disabled={disabled}
                    style={styles.nextBtn}
                    onPress={handleNextBtn}
                    textStyle={styles.nextBtnText}
                    // title={checkedItems.length === 0 ? 'Skip' : 'Next'}
                />
            </View>

            <ConfirmationAlert
                hideCancelBtn
                isOpen={open}
                title="Stock List"
                disabled={disabled}
                applyTxt="View List"
                onClose={handleCloseAlert}
                onSubmit={handleCloseAlert}
                message="Check that these items are still in your kitchen."
            />
            {/* HS-3113: finalize confirmation moved here from ShoppingList. With the third
                review (SHOPPING_STEP.CHECK) removed, StockList's Next button must prompt
                the same "Are you done?" alert instead of bouncing back
                to ShoppingList in CHECK mode. */}
            <ConfirmationAlert
                cancelTxt="Cancel"
                applyTxt="Finalize"
                disabled={disabled}
                title="Are you done?"
                isOpen={isFinalizeOpen}
                onSubmit={handleFinalize}
                onClose={handleCloseFinalizeAlert}
            />
        </Screen>
    );
};

export default memo(StockList);

const styles = StyleSheet.create({
    container: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    content: {
        flex: 1,
        marginTop: OFFSET.VERTICAL,
    },
    emptyText: {
        marginTop: OFFSET.VERTICAL * 2,
    },
    section: {
        paddingLeft: 16,
        paddingVertical: 16,
        alignItems: 'center',
        flexDirection: 'row',
        borderBottomWidth: 1,
        justifyContent: 'space-between',
        borderBottomColor: COLORS.LIGHT_GREY,
    },
    sectionMuted: {
        paddingLeft: 20,
        paddingVertical: 4,
        alignItems: 'center',
        flexDirection: 'row',
        borderBottomWidth: 1,
        justifyContent: 'space-between',
        backgroundColor: COLORS.LIGHT_GREY,
        borderBottomColor: COLORS.LIGHT_GREY,
    },
    sectionTitle: {
        color: COLORS.THEME_COLOR,
    },
    itemContainer: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.LIGHT_GREY,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    imageChecked: {
        opacity: 0.5,
    },
    textContainer: {
        flex: 1,
        marginLeft: OFFSET.HORIZONTAL,
    },
    textDecoration: {
        color: COLORS.GREY,
        textDecorationStyle: 'solid',
        textDecorationLine: 'line-through',
    },
    // Visual checkbox is now `<Checkbox>` (FA5 icon). This wrapper just reserves space + right alignment.
    checkboxWrap: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonControl: {
        borderTopWidth: 1,
        flexDirection: 'row',
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
        borderTopColor: COLORS.LIGHT_GREY,
    },
    nextBtn: {
        flex: 1,
        backgroundColor: '#B8E6B3',
        borderColor: '#00788D',
        borderWidth: 3,
        borderRadius: 30,
    },
    nextBtnText: {
        fontSize: 24,
        color: '#00788D',
        fontWeight: 'bold',
    },
});
