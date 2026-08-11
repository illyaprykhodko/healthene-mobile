
// outsource dependencies
import { useNavigation, StackActions } from '@react-navigation/native';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, SectionList, NativeSyntheticEvent, NativeScrollEvent, RefreshControl } from 'react-native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { useHaptic } from 'hooks/useHaptic';
import { Button } from 'components/Button';
import { StockListItem } from './StockListItem';
import StackHeader from 'components/StackHeader';
import { useFontScale } from 'hooks/useFontScale';
import { useAppDispatch, useAppSelector } from 'store';
import HorizontalMenu from 'components/HorizontalMenu';
import { useListEntrance } from 'hooks/useListEntrance';
import { useShoppingDrawer } from '../useShoppingDrawer';
import type { GroupedSection, StockItem } from './types';
import ConfirmationAlert from 'components/ConfirmationAlert';
import { AnimatedListRow } from 'components/AnimatedListRow';
import { useDevHeightAssert } from 'hooks/useDevHeightAssert';
import { HEADER_CONTENT_INSET, getStockHeaderHeight, getStockItemHeight } from './metrics';
import { StockListSkeleton } from 'components/Skeleton/StockListSkeleton';
import { ListFooterLoader, type ListFooterState } from 'components/ListFooterLoader';
import { SHOPPING_STEP, SHOPPING_STATUS, SHOPPING_CONFIRMED_ITEM_TYPE } from 'constants/spec';
import {
    getSectionOffsets,
    resolveActiveSectionIndex,
    createSectionListGetItemLayout,
} from 'utils/sectionListLayout';
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

const ADDITIONAL_CATEGORY_NAME = 'Additional';
// MUST stay different from the `size` ShoppingList passes to useGetStockListQuery (20). The endpoint's
// serializeQueryArgs strips only `page`, so an equal size would collapse both screens onto ONE cache
// entry whose `originalArgs` carry conflicting page numbers — they would refetch over each other.
const PAGE_SIZE = 100;
// An animated scrollToLocation does not reliably emit onMomentumScrollEnd on every platform, so the
// programmatic-scroll lock also expires on its own. Without this a single missed event silently
// kills scroll-driven highlighting for the rest of the session.
const PROGRAMMATIC_SCROLL_TIMEOUT = 800;

// Modal identities, most blocking first. Only ONE may be mounted at a time: every alert here
// renders a React Native `Modal`, and two open at once physically stack instead of queueing.
const MODAL = {
    INTRO: 'intro',
    FINALIZE_CONFIRM: 'finalizeConfirm',
    UNFINISHED_LIST_WARNING: 'unfinishedListWarning',
} as const;

type ActiveModal = typeof MODAL[keyof typeof MODAL] | null;

const keyExtractor = (item: StockItem) => String(item.id);

const StockList: React.FC = () => {
    const theme = useTheme();
    const haptics = useHaptic();
    const fontScale = useFontScale();
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();
    const openDrawer = useShoppingDrawer({ guarded: true });
    const { seenKeys, firstWaveRef, endFirstWave, resetEntrance } = useListEntrance();

    // `isIntroAlertOpen` is the "check your kitchen" arrival alert; `isFinalizeConfirmOpen` sat one
    // letter away from the unrelated Redux flag `isFinalizeAlertOpen` (the unfinished-list warning).
    const [isIntroAlertOpen, setIsIntroAlertOpen] = useState(true);
    const [isFinalizeConfirmOpen, setIsFinalizeConfirmOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<{ name: string; id?: number | null }>({ name: '' });
    const [page, setPage] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const sectionListRef = useRef<SectionList<StockItem, GroupedSection>>(null);
    const programmaticScrollRef = useRef<number | null>(null);
    const programmaticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hapticPageRef = useRef(0);
    const endHapticRef = useRef(false);
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
    const { data: stockData, isLoading, isFetching, refetch } = useGetStockListQuery({ page, size: PAGE_SIZE });
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

    // Row and header heights are derived, never hardcoded — see ./metrics.ts.
    const itemHeight = useMemo(() => getStockItemHeight(fontScale), [fontScale]);
    const headerHeight = useMemo(() => getStockHeaderHeight(fontScale), [fontScale]);
    const layoutConfig = useMemo(() => ({ itemHeight, headerHeight }), [itemHeight, headerHeight]);

    // getStockCategories carries the clinician-facing ordering. Grouping by first appearance instead
    // made the section order depend on which page an item happened to arrive in, so the list visibly
    // reshuffled as pages landed — which is a large part of the "nothing loaded properly" impression.
    const categoryRank = useMemo(() => {
        const rank = new Map<string, number>();
        (categoriesData || []).forEach((cat, fallbackIndex) => {
            const name = cat?.name?.trim();
            if (!name) { return; }
            rank.set(name, cat.order ?? fallbackIndex);
        });
        return rank;
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

        return Object.entries(grouped)
            .map(([title, data]) => ({
                title,
                // Stable order inside a section too, so a late-arriving item lands predictably
                // instead of always appending to the bottom.
                data: [...data].sort((a, b) => (a.food?.name || '').localeCompare(b.food?.name || '')),
            }))
            .sort((a, b) => {
                // Unranked categories (and "Additional") sink to the bottom, then alphabetical so the
                // ordering is total and stable across pages.
                const rankA = categoryRank.get(a.title) ?? Number.MAX_SAFE_INTEGER;
                const rankB = categoryRank.get(b.title) ?? Number.MAX_SAFE_INTEGER;
                return rankA === rankB ? a.title.localeCompare(b.title) : rankA - rankB;
            });
    }, [stockList, uncategorizedCategoryName, categoryRank]);

    const tabs = useMemo(() => {
        const categoryMap = new Map(
            (categoriesData || [])
                .filter(cat => cat && typeof cat.name === 'string' && cat.name.trim() !== '')
                .map(cat => [cat.name.trim(), { ...cat, name: cat.name.trim() }]),
        );
        return groupedList.map(section => categoryMap.get(section.title) ?? { name: section.title });
    }, [groupedList, categoriesData]);

    const getItemLayout = useMemo(
        () => createSectionListGetItemLayout<GroupedSection>(layoutConfig),
        [layoutConfig],
    );
    // Derived from groupedList, so appending a page into an already-rendered earlier section
    // recomputes the offsets and they stay exact — the estimate-drift bug class is gone.
    const sectionOffsets = useMemo(() => getSectionOffsets(groupedList, layoutConfig), [groupedList, layoutConfig]);

    const totalPages = stockData?.totalPages ?? 0;
    const hasNextPage = page + 1 < totalPages;
    // RTK Query merges every page into ONE cache entry (serializeQueryArgs strips `page`), so there is
    // no isLoadingMore flag — only isFetching, which is also true on first load and on a refetch.
    const isLoadingMore = isFetching && page > 0 && !isRefreshing;
    const footerState: ListFooterState = isLoadingMore
        ? 'loading'
        : (!isFetching && !hasNextPage && totalPages > 1) ? 'end' : 'idle';

    useEffect(() => {
        if (tabs.length > 0 && !activeCategoryRef.current.name) {
            setActiveCategory(tabs[0]);
        }
    }, [tabs]);

    // One tick per landed page, on the isFetching falling edge, guarded by the page number so a
    // re-render cannot repeat it. `selection` is the quietest entry in useHaptic's vocabulary;
    // `light` is already the app's press feedback, so reusing it here would blur that meaning.
    useEffect(() => {
        if (isFetching || page === 0 || hapticPageRef.current === page) { return; }
        hapticPageRef.current = page;
        haptics.selection();
    }, [isFetching, page, haptics]);

    // A softer, distinct tick the first time the list is fully loaded.
    useEffect(() => {
        if (footerState !== 'end') {
            endHapticRef.current = false;
            return;
        }
        if (endHapticRef.current) { return; }
        endHapticRef.current = true;
        haptics.light();
    }, [footerState, haptics]);

    // RefreshControl must spin ONLY for a pull, never while page N+1 loads at the bottom.
    useEffect(() => {
        if (!isFetching && isRefreshing) { setIsRefreshing(false); }
    }, [isFetching, isRefreshing]);

    useEffect(() => () => {
        if (programmaticTimerRef.current) { clearTimeout(programmaticTimerRef.current); }
    }, []);

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
        setIsFinalizeConfirmOpen(true);
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
            setIsFinalizeConfirmOpen(false);
            navigation.dispatch(StackActions.replace(ROUTES.SHOPPING_LIST, { isShopOnMyOwn: true }));
        } catch (error) {
            console.error('Error finalizing shopping list:', error);
        }
    }, [checkedItems, moveStocksToShoppingList, shoppingListId, separateRescueItems, buildShopOnMyOwnPayload, updateShoppingListStatus, dispatch, navigation]);

    const handleCloseFinalizeAlert = useCallback(() => setIsFinalizeConfirmOpen(false), []);

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

    const endProgrammaticScroll = useCallback(() => {
        programmaticScrollRef.current = null;
        if (programmaticTimerRef.current) {
            clearTimeout(programmaticTimerRef.current);
            programmaticTimerRef.current = null;
        }
    }, []);

    const beginProgrammaticScroll = useCallback((sectionIndex: number) => {
        programmaticScrollRef.current = sectionIndex;
        if (programmaticTimerRef.current) { clearTimeout(programmaticTimerRef.current); }
        programmaticTimerRef.current = setTimeout(endProgrammaticScroll, PROGRAMMATIC_SCROLL_TIMEOUT);
    }, [endProgrammaticScroll]);

    const handleCategoryChange = useCallback((item: any) => {
        const next = item?.activeItem ?? item;
        setActiveCategory({ name: next?.name ?? '', id: next?.id });
        const sectionIndex = groupedList.findIndex(s => s.title === next?.name);
        if (sectionIndex === -1 || !sectionListRef.current) { return; }
        // Suppress scroll-driven highlighting while the animation runs: the reference line sweeps
        // across every intervening section, which would machine-gun the chip bar through them.
        beginProgrammaticScroll(sectionIndex);
        // itemIndex 0 targets the SECTION HEADER itself — VirtualizedSectionList flattens each section
        // to [header, ...items, footer] — so no manual sticky-header offset is needed here.
        sectionListRef.current.scrollToLocation({
            sectionIndex,
            itemIndex: 0,
            animated: true,
            viewPosition: 0,
        });
    }, [groupedList, beginProgrammaticScroll]);

    // With an exact getItemLayout this should never fire; kept so a mistuned constant degrades to
    // "jumps to roughly the right place" instead of "does nothing".
    const handleScrollToIndexFailed = useCallback(() => {
        const target = sectionOffsets[programmaticScrollRef.current ?? 0] ?? 0;
        (sectionListRef.current?.getScrollResponder() as any)?.scrollTo?.({ y: target, animated: true });
    }, [sectionOffsets]);

    const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (programmaticScrollRef.current !== null) { return; }
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const nextIndex = resolveActiveSectionIndex(
            sectionOffsets,
            { y: contentOffset.y, contentHeight: contentSize.height, viewportHeight: layoutMeasurement.height },
            headerHeight,
        );
        const matchingTab = tabs[nextIndex];
        if (matchingTab && matchingTab.name !== activeCategoryRef.current.name) {
            setActiveCategory(matchingTab);
            haptics.selection();
        }
    }, [sectionOffsets, tabs, headerHeight, haptics]);

    const onScrollBeginDrag = useCallback(() => {
        // The user took over — release the lock and stop staggering later rows.
        endProgrammaticScroll();
        endFirstWave();
    }, [endProgrammaticScroll, endFirstWave]);

    const handleEndReached = useCallback(() => {
        if (isFetching || !hasNextPage) { return; }
        endFirstWave();
        setPage(prev => prev + 1);
    }, [isFetching, hasNextPage, endFirstWave]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        hapticPageRef.current = 0;
        resetEntrance();
        // page 0 makes `merge` REPLACE content instead of appending. Changing `page` alone already
        // re-issues the request (the cache key ignores it), so refetch() would double-fire.
        if (page > 0) {
            setPage(0);
            return;
        }
        refetch();
    }, [page, refetch, resetEntrance]);

    const handleCloseIntroAlert = useCallback(() => setIsIntroAlertOpen(false), []);

    const disabled = isLoading || isUpdating || isMovingStocks || isFinalizing;

    // One winner by priority, so the next alert surfaces only once the current one closes.
    const activeModal: ActiveModal = useMemo(() => {
        if (isFinalizeConfirmOpen) { return MODAL.FINALIZE_CONFIRM; }
        if (isFinalizeAlertOpen) { return MODAL.UNFINISHED_LIST_WARNING; }
        // Waits for real content — it asks the user to check a list that is still a skeleton.
        if (isIntroAlertOpen && !isLoading) { return MODAL.INTRO; }
        return null;
    }, [isFinalizeConfirmOpen, isFinalizeAlertOpen, isIntroAlertOpen, isLoading]);

    // Set lookup instead of `checkedItems.includes` per row — that was O(checked) on every row of
    // every render, and every toggle re-renders the whole list.
    const checkedIds = useMemo(() => new Set(checkedItems), [checkedItems]);

    const renderItem = useCallback(({ item, index }: { item: StockItem; index: number }) => (
        <AnimatedListRow
            index={index}
            itemKey={item.id}
            seenKeys={seenKeys}
            isFirstWave={firstWaveRef.current}
        >
            <StockListItem
                item={item}
                height={itemHeight}
                disabled={disabled}
                onToggle={handleToggleItem}
                isChecked={checkedIds.has(item.id)}
            />
        </AnimatedListRow>
    ), [checkedIds, disabled, handleToggleItem, itemHeight, seenKeys, firstWaveRef]);

    const assertHeaderHeight = useDevHeightAssert('StockList section header', headerHeight - HEADER_CONTENT_INSET);

    const renderSectionHeader = useCallback(({ section }: { section: GroupedSection }) => (
        <View style={[styles.section, {
            height: headerHeight,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceAlt,
        }]}>
            {/* The count turns "this category looks suspiciously empty" into a stated fact. */}
            {/* The wrapper carries onLayout: the shared Text does not forward it, and the header
                View itself has a pinned height, so only this unconstrained box can reveal overflow. */}
            <View onLayout={assertHeaderHeight}>
                <Text variant="h4" numberOfLines={1} style={styles.sectionTitle} color={theme.colors.primary}>
                    Select all the {section.title} ({section.data.length})
                </Text>
            </View>
        </View>
    ), [theme.colors, headerHeight, assertHeaderHeight]);

    const listFooter = useMemo(() => (
        <ListFooterLoader
            imageSize={80}
            state={footerState}
            rowHeight={itemHeight}
            endLabel={`That's everything — ${stockData?.totalElements ?? 0} items`}
        />
    ), [footerState, itemHeight, stockData?.totalElements]);

    const renderBody = () => {
        if (isLoading) { return <StockListSkeleton />; }
        if (groupedList.length === 0) {
            return (
                <Text textAlign="center" color={COLORS.GREY} style={styles.emptyText}>
                    No Stock list was found
                </Text>
            );
        }
        return (
            <>
                <HorizontalMenu
                    data={tabs}
                    disabled={disabled}
                    activeItem={activeCategory}
                    handleItem={handleCategoryChange}
                />
                <SectionList<StockItem, GroupedSection>
                    windowSize={7}
                    onScroll={onScroll}
                    ref={sectionListRef}
                    sections={groupedList}
                    renderItem={renderItem}
                    initialNumToRender={12}
                    maxToRenderPerBatch={6}
                    scrollEventThrottle={16}
                    stickySectionHeadersEnabled
                    keyExtractor={keyExtractor}
                    onEndReachedThreshold={0.5}
                    getItemLayout={getItemLayout}
                    updateCellsBatchingPeriod={60}
                    onEndReached={handleEndReached}
                    ListFooterComponent={listFooter}
                    onScrollBeginDrag={onScrollBeginDrag}
                    onScrollEndDrag={endProgrammaticScroll}
                    renderSectionHeader={renderSectionHeader}
                    onMomentumScrollEnd={endProgrammaticScroll}
                    onScrollToIndexFailed={handleScrollToIndexFailed}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
                />
            </>
        );
    };

    return (
        // The list body owns its own loading state now — gating `Screen` on isLoading blanked the
        // whole screen behind a SkypeIndicator, so StackHeader and the Finalize bar only appeared
        // once data arrived.
        <Screen initialized style={styles.container}>
            <StackHeader
                title="Stock List"
                onBack={handleGoBack}
                onOpenDrawer={openDrawer}
            />
            <View style={styles.content}>
                {renderBody()}
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
                title="Stock List"
                disabled={disabled}
                applyTxt="View List"
                onClose={handleCloseIntroAlert}
                onSubmit={handleCloseIntroAlert}
                isOpen={activeModal === MODAL.INTRO}
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
                onSubmit={handleFinalize}
                onClose={handleCloseFinalizeAlert}
                isOpen={activeModal === MODAL.FINALIZE_CONFIRM}
            />
            <ConfirmationAlert
                title="Oops!"
                variant="legacy"
                cancelTxt="Not Now"
                applyTxt="Finish Up"
                onClose={handleNotNowAlert}
                onSubmit={handleFinishUpAlert}
                isOpen={activeModal === MODAL.UNFINISHED_LIST_WARNING}
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
    },
    emptyText: {
        marginTop: OFFSET.VERTICAL * 2,
    },
    section: {
        paddingLeft: 16,
        alignItems: 'center',
        flexDirection: 'row',
        borderBottomWidth: 1,
        justifyContent: 'space-between',
        borderBottomColor: COLORS.LIGHT_GREY,
    },
    sectionTitle: {
        fontWeight: 'semibold',
        color: COLORS.THEME_COLOR,
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
