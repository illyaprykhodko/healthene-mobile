
// outsource dependencies
import { useNavigation, StackActions } from '@react-navigation/native';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { StyleSheet, View, SectionList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

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
    updateShoppingMeta,
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

const ADDITIONAL_CATEGORY_NAME = 'Additional';
// Used only for the onScroll tab-sync approximation — NOT passed to SectionList.
// Items with wrapping text are taller; the sync may lag by a few items, which is acceptable.
const ITEM_HEIGHT_APPROX = 121;      // padding: 20*2 + image: 80 + hairline
const SECTION_HEADER_HEIGHT = 53;    // paddingVertical: 16*2 + ~20px text + 1px border

const StockList: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();
    const openDrawer = useShoppingDrawer({ guarded: true });

    const [open, setOpen] = useState(true);
    const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<{ name: string; id?: number | null }>({ name: '' });
    const [page, setPage] = useState(0);
    const sectionListRef = useRef<SectionList<StockItem, GroupedSection>>(null);
    const suppressScrollRef = useRef(false);
    const activeCategoryRef = useRef(activeCategory);
    activeCategoryRef.current = activeCategory;
    const checkedItems = useAppSelector(selectCheckedStockItems);
    const {
        confirmedItemsType,
        separateRescueItems,
        isFinalizeAlertOpen,
        id: shoppingListId,
    } = useAppSelector(selectShopping);
    const includeRescueFoodsInShoppingList = useAppSelector(state => state.app?.user?.includeRescueFoodsInShoppingList);
    const { data: stockData, isLoading, isFetching } = useGetStockListQuery({ page, size: 100 });
    // const { data: stockData, isLoading } = useGetStockListQuery();
    // TEMP: updateStock is kept for the upcoming revert — the call site below is commented in handleNextBtn.
    // eslint-disable-next-line no-unused-vars
    const [updateStock, { isLoading: isUpdating }] = useUpdateStockItemsMutation();
    const { data: categoriesData } = useGetStockCategoriesQuery();
    const [moveStocksToShoppingList, { isLoading: isMovingStocks }] = useMoveStocksToShoppingListMutation();
    const [updateShoppingListStatus, { isLoading: isFinalizing }] = useUpdateShoppingListStatusMutation();
    const stockList = stockData?.content || [];
    const uncategorizedCategoryName = useMemo(() => {
        const cat = (categoriesData || []).find(c => c?.id === null || c?.id === 0);
        return cat?.name?.trim() || ADDITIONAL_CATEGORY_NAME;
    }, [categoriesData]);

    // Filter and group by category
    const groupedList: GroupedSection[] = useMemo(() => {
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

    const tabs = useMemo(() => {
        const categoryMap = new Map(
            (categoriesData || [])
                .filter(cat => cat && typeof cat.name === 'string' && cat.name.trim() !== '')
                .map(cat => [cat.name.trim(), { ...cat, name: cat.name.trim() }]),
        );
        return groupedList.map(section => categoryMap.get(section.title) ?? { name: section.title });
    }, [groupedList, categoriesData]);

    const sectionHeaderOffsets = useMemo(() => {
        let offset = 0;
        return groupedList.map(section => {
            const headerOffset = offset;
            offset += SECTION_HEADER_HEIGHT + section.data.length * ITEM_HEIGHT_APPROX;
            return headerOffset;
        });
    }, [groupedList]);

    useEffect(() => {
        if (tabs.length > 0 && !activeCategoryRef.current.name) {
            setActiveCategory(tabs[0]);
        }
    }, [tabs]);

    const handleGoBack = useCallback(() => {
        dispatch(setCurrentStep(SHOPPING_STEP.MAIN));
        navigation.goBack();
    }, [navigation, dispatch]);

    const handleToggleItem = useCallback((item: StockItem) => {
        dispatch(toggleStockItem(item.id));
    }, [dispatch]);

    const handleNextBtn = useCallback(() => {
        // HS-3113: third shopping-list review removed. Instead of flipping to
        // SHOPPING_STEP.CHECK and bouncing back to ShoppingList, prompt the
        // finalize confirmation right here. Kept commented to ease revert.
        // dispatch(setCurrentStep(SHOPPING_STEP.CHECK));
        // navigation.navigate(ROUTES.SHOPPING_LIST);
        setIsFinalizeOpen(true);
    }, []);

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
            if (checkedItems.length > 0) {
                // await updateStock({ ids: checkedItems }).unwrap();
                await moveStocksToShoppingList({ ids: checkedItems }).unwrap();
            }
            // TEMP: mirrors ShoppingList.handleFinalize until /shop-on-my-own is restored on backend.
            if (shoppingListId) {
                const { newConfirmedItemsType } = buildShopOnMyOwnPayload();
                await updateShoppingListStatus({
                    id: shoppingListId,
                    separateRescueItems,
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
    }, [checkedItems, moveStocksToShoppingList, shoppingListId, separateRescueItems, buildShopOnMyOwnPayload, updateShoppingListStatus, dispatch, navigation]);

    const handleCloseFinalizeAlert = useCallback(() => setIsFinalizeOpen(false), []);

    const handleFinishUpAlert = useCallback(() => {
        dispatch(updateShoppingMeta({ isFinalizeAlertOpen: false, isTryToOpenSideMenu: false }));
    }, [dispatch]);

    const handleNotNowAlert = useCallback(() => {
        dispatch(updateShoppingMeta({ isFinalizeAlertOpen: false, isTryToOpenSideMenu: false }));
        const parentNav = (navigation as any)?.getParent?.();
        if (parentNav?.toggleDrawer) {
            parentNav.toggleDrawer();
            return;
        }
        if (parentNav?.openDrawer) {
            parentNav.openDrawer();
            return;
        }
        (navigation as any).toggleDrawer?.();
    }, [dispatch, navigation]);

    const handleCategoryChange = useCallback((item: any) => {
        const next = item?.activeItem ?? item;
        setActiveCategory({ name: next?.name ?? '', id: next?.id });
        const sectionIndex = groupedList.findIndex(s => s.title === next?.name);
        if (sectionIndex === -1 || !sectionListRef.current) { return; }
        suppressScrollRef.current = true;
        const offset = sectionHeaderOffsets[sectionIndex] ?? 0;
        (sectionListRef.current.getScrollResponder() as any)?.scrollTo?.({ y: offset, animated: true });
    }, [groupedList, sectionHeaderOffsets]);

    const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (suppressScrollRef.current) { return; }
        const y = event.nativeEvent.contentOffset.y;
        let newIndex = 0;
        for (let i = sectionHeaderOffsets.length - 1; i >= 0; i--) {
            if (sectionHeaderOffsets[i] <= y) {
                newIndex = i;
                break;
            }
        }
        const matchingTab = tabs[newIndex];
        if (matchingTab && matchingTab.name !== activeCategoryRef.current.name) {
            setActiveCategory(matchingTab);
        }
    }, [sectionHeaderOffsets, tabs]);

    const onMomentumScrollEnd = useCallback(() => {
        suppressScrollRef.current = false;
    }, []);

    // Reset suppression when the user begins a manual drag — programmatic scrollTo
    // does not fire onMomentumScrollEnd, so without this the tab sync stays blocked.
    const onScrollBeginDrag = useCallback(() => {
        suppressScrollRef.current = false;
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
                exiting={FadeOut.duration(200)}
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
        <View style={[styles.section, { backgroundColor: theme.colors.surfaceAlt, borderBottomColor: theme.colors.border }]}>
            <Text variant="h4" style={styles.sectionTitle} color={theme.colors.primary}>
                Select all the {section.title}
            </Text>
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
                        <SectionList<StockItem, GroupedSection>
                            onScroll={onScroll}
                            ref={sectionListRef}
                            sections={groupedList}
                            renderItem={renderItem}
                            scrollEventThrottle={50}
                            initialNumToRender={100}
                            stickySectionHeadersEnabled
                            onScrollBeginDrag={onScrollBeginDrag}
                            renderSectionHeader={renderSectionHeader}
                            onMomentumScrollEnd={onMomentumScrollEnd}
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
            <ConfirmationAlert
                title="Oops!"
                variant="legacy"
                cancelTxt="Not Now"
                applyTxt="Finish Up"
                onClose={handleNotNowAlert}
                isOpen={isFinalizeAlertOpen}
                onSubmit={handleFinishUpAlert}
                message="Looks like your list isn’t done yet. Finish it before you go?"
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
        // marginTop: OFFSET.VERTICAL,
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
        fontWeight: 'semibold',
        color: COLORS.THEME_COLOR,
    },
    itemContainer: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomColor: COLORS.LIGHT_GREY,
        borderBottomWidth: StyleSheet.hairlineWidth,
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
