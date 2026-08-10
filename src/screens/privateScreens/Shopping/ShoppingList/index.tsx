// outsource dependencies
import dayjs from 'services/date';
import Icon from '@react-native-vector-icons/feather';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, KeyboardEvents } from 'react-native-keyboard-controller';
import { useNavigation, useRoute, useIsFocused, StackActions } from '@react-navigation/native';
import { StyleSheet, View, TouchableOpacity, Modal, RefreshControl, SectionList } from 'react-native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { ROUTES } from 'constants/routes';
import { Button } from 'components/Button';
import { useHaptic } from 'hooks/useHaptic';
import StackHeader from 'components/StackHeader';
import { useFontScale } from 'hooks/useFontScale';
import { EmptyState } from 'components/EmptyState';
import { useAppDispatch, useAppSelector } from 'store';
import { useListEntrance } from 'hooks/useListEntrance';
import { useShoppingDrawer } from '../useShoppingDrawer';
import { AnimatedListRow } from 'components/AnimatedListRow';
import { PlayBtn, QuestionBtn } from 'components/LibraryButtons';
import { createSectionListGetItemLayout } from 'utils/sectionListLayout';
import { useGetCurrentLibraryElementsQuery } from 'store/api/questionApi';
import { useDevHeightAssert } from 'hooks/useDevHeightAssert';
import { HEADER_CONTENT_INSET, getSectionHeaderHeight, getShoppingItemHeight } from './itemMetrics';
import { ListFooterLoader, type ListFooterState } from 'components/ListFooterLoader';
import {
    DESTINATIONS,
    QUESTION_TYPE,
    SHOPPING_STEP,
    SHOPPING_STATUS,
    SHOPPING_ITEM_TYPE,
    VIDEO_LIBRARY_TYPE,
    SHOPPING_CONFIRMED_ITEM_TYPE
} from 'constants/spec';
import {
    setItemType,
    selectShopping,
    setCurrentStep,
    setIsListTouched,
    setShoppingStatus,
    setActiveCategory,
    updateShoppingMeta,
    setShoppingListDates,
    setIsCustomAlertOpen,
    setIsMealQuestionAsked,
} from 'store/slices/shoppingSlice';
import {
    useGetStockListQuery,
    useGetShoppingListQuery,
    useGetShoppingListDatesQuery,
    useGetShoppingListStatusQuery,
    useGetShoppingCategoriesQuery,
    useUpdateShoppingItemMutation,
    useConfirmShopOnMyOwnMutation,
    useGetShoppingPreferencesQuery,
    useUpdateShoppingListStatusMutation,
} from 'store/api/shoppingApi';
import ShoppingItem from './ShoppingItem';
import ListSwitcher from 'components/ListSwitcher';
import HorizontalMenu from 'components/HorizontalMenu';
import { GlassSurface } from 'components/GlassSurface';
import ConfirmationAlert from 'components/ConfirmationAlert';
import { ShoppingListSkeleton } from 'components/Skeleton/ShoppingListSkeleton';

interface GroupedItem {
    title: string;
    data: any[];
}

const ALL_CATEGORY: { name: string; id?: number | null } = { name: 'All' };
const ADDITIONAL_CATEGORY_NAME = 'Additional';
// Visible slack above a focused amount input once scrollToLocation has pinned it to the top.
const FOCUS_TOP_GAP = 12;

// `item.id` is unique per shopping-list row (RTK Query's `merge` dedups by it), so the old
// `${id}_${index}` key only ever shifted identity when a page appended into an earlier section —
// which remounted rows and re-fired their entrance animation mid-scroll.
const keyExtractor = (item: any) => String(item.id);

const ShoppingList: React.FC = () => {
    const theme = useTheme();
    const haptics = useHaptic();
    const fontScale = useFontScale();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const dispatch = useAppDispatch();
    const isFocused = useIsFocused();
    const openDrawer = useShoppingDrawer({ guarded: true });
    const { seenKeys, firstWaveRef, endFirstWave, resetEntrance } = useListEntrance();

    const {
        status,
        itemType,
        currentStep,
        // HS-3113: isListTouched gated the (now-removed) CHECK branches in handleNextBtn
        // and handleBack. Kept commented for easy revert.
        // isListTouched,
        activeCategory,
        shoppingListDates,
        isCustomAlertOpen,
        confirmedItemsType,
        isFinalizeAlertOpen,
        isTryToOpenSideMenu,
        separateRescueItems,
        isMealQuestionAsked,
        // TEMP: `id` (shopping list id) is needed for the PUT /shopping-list fallback while /shop-on-my-own is missing on backend
        id: shoppingListId,
    } = useAppSelector(selectShopping);

    const includeRescueFoodsInShoppingList = useAppSelector(state => state.app?.user?.includeRescueFoodsInShoppingList);
    const submittedShoppingList = useAppSelector(state => (state.app?.user as any)?.submittedShoppingList) ?? false;

    const [open, setOpen] = useState(true);
    const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
    const [page, setPage] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    // Height of the absolutely-positioned bottom button bar, measured so the list can reserve
    // matching bottom padding — otherwise the last item is hidden under the bar and can't be reached.
    const [bottomBarHeight, setBottomBarHeight] = useState(0);
    const pendingBackActionRef = useRef<any | null>(null);
    const allowBackRef = useRef(false);
    const sectionListRef = useRef<any>(null);
    const hapticPageRef = useRef(0);
    const endHapticRef = useRef(false);
    const keyboardSubRef = useRef<{ remove(): void } | null>(null);

    // Queries
    const { data: statusData } = useGetShoppingListStatusQuery();
    const { data: datesData } = useGetShoppingListDatesQuery();
    const { data: stockData, isLoading: isStockLoading, isFetching: isStockFetching } = useGetStockListQuery({
        shoppingCartCategoryId: undefined,
        page: 0,
        size: 20,
    });
    const stockList = stockData?.content || [];
    // HS-3113: Final Check step removed — was: currentStep === SHOPPING_STEP.MAIN || currentStep === SHOPPING_STEP.CHECK
    const excluded = currentStep === SHOPPING_STEP.MAIN;
    const shoppingItemType = separateRescueItems
        ? itemType ? itemType : SHOPPING_ITEM_TYPE.ORIGINAL
        : SHOPPING_ITEM_TYPE.ORIGINAL;
    const { data: categoriesData, isLoading: isCategoriesLoading } = useGetShoppingCategoriesQuery({
        withExcluded: excluded,
        shoppingItemType,
    });

    const activeCategoryIds = useMemo<(number | null)[]>(() => {
        const activeId = activeCategory?.id;
        if (!Object.prototype.hasOwnProperty.call(activeCategory || {}, 'id')) {
            return [];
        }
        if (Array.isArray(activeId)) {
            return activeId as (number | null)[];
        }
        return [activeId as number | null];
    }, [activeCategory]);

    // const [localListData, setLocalListData]
    // = useState<{ content: any[], totalPages: number, totalElements: number, pageNumber: number}>({ content: [], totalPages: 0, totalElements: 0, pageNumber: 0 });
    const { data: listData, isLoading: isListLoading, isFetching, refetch } = useGetShoppingListQuery({
        itemType: separateRescueItems ? itemType : null,
        categories: activeCategoryIds,
        withExcluded: excluded,
        size: 20,
        page,
    });

    const [updateItem] = useUpdateShoppingItemMutation();
    // TEMP: kept for the upcoming revert — backend currently 404s on /shop-on-my-own, so the call below is bypassed in favor of updateShoppingListStatus
    // eslint-disable-next-line no-unused-vars
    const [confirmShopOnMyOwn] = useConfirmShopOnMyOwnMutation();
    const [updateShoppingListStatus] = useUpdateShoppingListStatusMutation();
    const { data: preferencesData } = useGetShoppingPreferencesQuery();

    // Get questions and videos for shopping list
    const { data: libraryElements } = useGetCurrentLibraryElementsQuery([DESTINATIONS.SHOPPING_LIST]);
    const firstElement = libraryElements?.[0];
    const patientVideos = firstElement?.patientVideos || [];
    const patientQuestions = firstElement?.patientQuestions || [];
    const video = patientVideos?.[0]?.libraryItem;
    const question = patientQuestions?.[0];

    // HS-3113: stock-list query must be settled before Next can branch on stockList.length;
    // otherwise an unloaded stock query reads as "no stock" and skips StockList review.
    const isLoading = isCategoriesLoading || isListLoading || isStockLoading;
    const isStockResolving = isStockLoading || isStockFetching;

    useEffect(() => {
        if (statusData && isFocused) {
            dispatch(setShoppingStatus({
                id: statusData.id,
                status: statusData.status,
                confirmedItemsType: statusData.confirmedItemsType,
                separateRescueItems: statusData.separateRescueItems,
            }));
        }
    }, [statusData, isFocused, dispatch]);

    useEffect(() => {
        if (datesData && isFocused) {
            dispatch(setShoppingListDates({
                from: dayjs(datesData.startDate).format('MMM DD'),
                to: dayjs(datesData.endDate).format('DD'),
            }));
        }
    }, [datesData, isFocused, dispatch]);

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

    const groupedList: GroupedItem[] = useMemo(() => {
        const items = listData?.content || [];
        const grouped: Record<string, any[]> = {};

        items.forEach((item: any) => {
            const categoryName = item?.shoppingCartCategory?.name
                || item?.food?.shoppingCartCategory?.name
                || uncategorizedCategoryName;
            if (!grouped[categoryName]) {
                grouped[categoryName] = [];
            }
            grouped[categoryName].push(item);
        });

        return Object.entries(grouped).map(([title, data]) => ({
            title,
            data,
        }));
    }, [listData, uncategorizedCategoryName]);

    const itemPositionById = useMemo(() => {
        const position = new Map<number, { sectionIndex: number; itemIndex: number }>();
        groupedList.forEach((section, sectionIndex) => {
            section.data.forEach((item, itemIndex) => {
                if (item?.id) {
                    position.set(item.id, { sectionIndex, itemIndex });
                }
            });
        });
        return position;
    }, [groupedList]);

    const handleAmountFocus = useCallback((itemId: number) => {
        const location = itemPositionById.get(itemId);
        if (!location || !sectionListRef.current?.scrollToLocation) {
            return;
        }
        // SectionList flattens to [header, ...items, footer] but scrollToLocation computes
        // `index = itemIndex + Σ(count + 2)` — i.e. it lands on item (itemIndex - 1), and on the
        // section HEADER for itemIndex 0. Passing itemIndex + 1 targets the real row, and also
        // satisfies RN's internal `params.itemIndex > 0` guard, which is what adds the sticky
        // header height to viewOffset.
        //
        // viewOffset is SUBTRACTED from the scroll offset, so the previous
        // `viewPosition: 0.35, viewOffset: 120` pushed the row DOWN the screen — the opposite of
        // lifting it above the keyboard. viewPosition 0 pins the row to the top of the viewport
        // (RN already offsets it past the sticky header), so FOCUS_TOP_GAP is the only slack.
        const scroll = () => sectionListRef.current?.scrollToLocation?.({
            animated: true,
            viewPosition: 0,
            viewOffset: FOCUS_TOP_GAP,
            itemIndex: location.itemIndex + 1,
            sectionIndex: location.sectionIndex,
        });
        // KeyboardAvoidingView shrinks the list AFTER the focus event, so an immediate scroll uses
        // the pre-keyboard viewport height. Scroll once now (feels instant) and once when the
        // keyboard frame has settled (lands correctly).
        scroll();
        keyboardSubRef.current?.remove();
        keyboardSubRef.current = KeyboardEvents.addListener('keyboardDidShow', () => {
            keyboardSubRef.current?.remove();
            keyboardSubRef.current = null;
            scroll();
        });
    }, [itemPositionById]);

    useEffect(() => () => {
        keyboardSubRef.current?.remove();
        keyboardSubRef.current = null;
    }, []);

    const isOriginalConfirmed = useMemo(() => (
        confirmedItemsType === SHOPPING_CONFIRMED_ITEM_TYPE.ORIGINAL
        && (status === SHOPPING_STATUS.CONFIRMED || status === SHOPPING_STATUS.SHOP_ON_MY_OWN)
    ), [status, confirmedItemsType]);

    const isConfirmed = useMemo(() => (
        (status === SHOPPING_STATUS.CONFIRMED && itemType === confirmedItemsType)
        || confirmedItemsType === SHOPPING_CONFIRMED_ITEM_TYPE.ALL
        || (status === SHOPPING_STATUS.SHOP_ON_MY_OWN && itemType === confirmedItemsType)
    ), [status, itemType, confirmedItemsType]);

    // Lifted out of ShoppingItem: `compact` feeds both the row height and the render branch, so it
    // has to be known here. `isMainStep` gates the exclude button — a different condition.
    const isMainStep = currentStep === SHOPPING_STEP.MAIN;
    const compact = !((currentStep === SHOPPING_STEP.MAIN || currentStep === SHOPPING_STEP.MEAL) && !isConfirmed);

    // Row and header heights are derived, never hardcoded — see ./itemMetrics.
    const itemHeight = useMemo(() => getShoppingItemHeight(fontScale, compact), [fontScale, compact]);
    const sectionHeaderHeight = useMemo(() => getSectionHeaderHeight(fontScale), [fontScale]);
    const getItemLayout = useMemo(
        () => createSectionListGetItemLayout<GroupedItem>({ itemHeight, headerHeight: sectionHeaderHeight }),
        [itemHeight, sectionHeaderHeight],
    );

    const totalPages = listData?.totalPages ?? 0;
    const hasNextPage = page + 1 < totalPages;
    // RTK Query merges every page into ONE cache entry (serializeQueryArgs strips `page`), so there is
    // no isLoadingMore flag — only isFetching, which is also true on first load and on a refetch.
    const isLoadingMore = isFetching && page > 0 && !isRefreshing;
    const footerState: ListFooterState = isLoadingMore
        ? 'loading'
        : (!isFetching && !hasNextPage && totalPages > 1) ? 'end' : 'idle';

    const headerCenter = useMemo(() => (
        <View style={styles.headerContainer}>
            <Text variant="bold" style={[styles.headerTitle, { color: theme.colors.headerText }]}>Shopping list</Text>
            {shoppingListDates && (
                <Text variant="bold" style={[styles.dateText, { color: theme.colors.headerText }]}>
                    {shoppingListDates.from} - {shoppingListDates.to}
                </Text>
            )}
        </View>
    ), [shoppingListDates, theme.colors.headerText]);

    const handleCategoryChange = useCallback((item: any) => {
        dispatch(setActiveCategory(item.activeItem || item));
        hapticPageRef.current = 0;
        resetEntrance();
        setPage(0);
    }, [dispatch, resetEntrance]);

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

    // RefreshControl must spin ONLY for a pull, never while page N+1 loads at the bottom.
    useEffect(() => {
        if (!isFetching && isRefreshing) { setIsRefreshing(false); }
    }, [isFetching, isRefreshing]);

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

    const handleUpdateItem = useCallback(async (item: any) => {
        try {
            dispatch(setIsListTouched(true));
            await updateItem([item]).unwrap();
        } catch (error) {
            console.error('Error updating item:', error);
        }
    }, [updateItem, dispatch]);

    const handleNextBtn = useCallback(() => {
        // HS-3113: bail out while the stock-list query hasn't resolved — an unloaded
        // response reads as empty and would incorrectly route to the finalize alert.
        if (isStockResolving && !stockData) {
            return;
        }
        if (currentStep === SHOPPING_STEP.MAIN || currentStep === SHOPPING_STEP.MEAL) {
            if (stockList.length > 0) {
                setOpen(false);
                dispatch(setCurrentStep(SHOPPING_STEP.STOCK));
                navigation.navigate(ROUTES.STOCK_LIST);
            // HS-3113: Final Check step removed. Previously, a touched list with no stock
            // items entered SHOPPING_STEP.CHECK for a third review. Now it falls through
            // to the finalize alert. Kept commented for easy revert.
            // } else if (isListTouched) {
            //     dispatch(setCurrentStep(SHOPPING_STEP.CHECK));
            //     refetch();
            } else {
                setIsFinalizeOpen(true);
            }
        } else {
            setIsFinalizeOpen(true);
        }
    }, [navigation, currentStep, stockList, dispatch, isStockResolving, stockData]);

    const handleBack = useCallback(() => {
        // HS-3113: Final Check step removed. Previously this returned to MAIN when
        // backing out of a touched CHECK review with no stock. Block kept for easy revert.
        // if (isListTouched && stockList.length === 0 && currentStep === SHOPPING_STEP.CHECK) {
        //     dispatch(setCurrentStep(SHOPPING_STEP.MAIN));
        //     return;
        // }
        if (
            status === SHOPPING_STATUS.PENDING
            && !isFinalizeAlertOpen
            // HS-3113: CHECK step unreachable; guard simplified.
            // && currentStep !== SHOPPING_STEP.CHECK
        ) {
            pendingBackActionRef.current = null;
            dispatch(updateShoppingMeta({ isFinalizeAlertOpen: true, isTryToOpenSideMenu: false }));
            return;
        }
        if (status === SHOPPING_STATUS.CONFIRMED || status === SHOPPING_STATUS.SHOP_ON_MY_OWN) {
            navigation.navigate(ROUTES.MAIN);
            return;
        }
        navigation.goBack();
    }, [navigation, status, dispatch, isFinalizeAlertOpen]);


    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
            if (allowBackRef.current) {
                allowBackRef.current = false;
                return;
            }
            // HS-3113: Final Check step removed. Previously the guard also required
            // currentStep !== SHOPPING_STEP.CHECK to allow leaving during the third
            // review. With CHECK unreachable, the PENDING check alone is sufficient.
            if (status === SHOPPING_STATUS.PENDING) {
                event.preventDefault();
                pendingBackActionRef.current = event.data.action;
                dispatch(updateShoppingMeta({ isFinalizeAlertOpen: true, isTryToOpenSideMenu: false }));
            }
        });
        return unsubscribe;
    }, [navigation, status, dispatch]);

    // TEMP: backend /shopping-list/shop-on-my-own returns 404, so we replicate V1 behavior by flipping status via PUT /shopping-list.
    // Revert both handlers to `confirmShopOnMyOwn({}).unwrap()` once backend re-adds the dedicated endpoint.
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

    const handleDone = useCallback(async () => {
        try {
            // TEMP: replaces confirmShopOnMyOwn({}).unwrap() until /shop-on-my-own is restored
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
        } catch (error) {
            console.error('Error confirming:', error);
        }
    }, [shoppingListId, separateRescueItems, buildShopOnMyOwnPayload, updateShoppingListStatus, dispatch]);
    const handleFinalize = useCallback(async () => {
        try {
            // TEMP: replaces confirmShopOnMyOwn({}).unwrap() until /shop-on-my-own is restored
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

    const handlePrint = useCallback(() => {
        const endDate = dayjs().endOf('week').format('YYYY-MM-DD');
        const startDate = dayjs().startOf('week').format('YYYY-MM-DD');
        navigation.navigate(ROUTES.SHOPPING_PDF, { date: { endDate, startDate } });
    }, [navigation]);

    const handleCloseAlert = useCallback(() => setOpen(false), []);

    const handleFinishUpAlert = useCallback(() => {
        pendingBackActionRef.current = null;
        dispatch(updateShoppingMeta({ isFinalizeAlertOpen: false, isTryToOpenSideMenu: false }));
    }, [dispatch]);

    const handleNotNowAlert = useCallback(() => {
        const action = pendingBackActionRef.current;
        pendingBackActionRef.current = null;
        dispatch(updateShoppingMeta({ isFinalizeAlertOpen: false, isTryToOpenSideMenu: false }));
        if (isTryToOpenSideMenu) {
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
            return;
        }
        if (action) {
            allowBackRef.current = true;
            navigation.dispatch(action);
            return;
        }
        allowBackRef.current = true;
        navigation.goBack();
    }, [dispatch, navigation, isTryToOpenSideMenu]);

    const handleCloseCustomAlert = useCallback(() => {
        dispatch(setIsCustomAlertOpen(false));
        dispatch(setIsMealQuestionAsked(true));
    }, [dispatch]);

    const handleApplyCustomAlert = useCallback(() => {
        dispatch(setIsCustomAlertOpen(false));
        dispatch(setIsMealQuestionAsked(true));
        dispatch(setCurrentStep(SHOPPING_STEP.MEAL));
        navigation.navigate(ROUTES.SHOPPING_PREFERENCES);
    }, [dispatch, navigation]);

    // Check if we need to ask the meal question
    const isNeedToAskQuestion = useMemo(() => (
        isFocused
        && !isLoading
        && !isMealQuestionAsked
        && submittedShoppingList
        && currentStep === SHOPPING_STEP.MAIN
        && status === SHOPPING_STATUS.PENDING
    ), [isFocused, isLoading, isMealQuestionAsked, submittedShoppingList, currentStep, status]);

    // Show custom alert when conditions are met
    useEffect(() => {
        if (isNeedToAskQuestion) {
            dispatch(setIsCustomAlertOpen(true));
        }
    }, [isNeedToAskQuestion, dispatch]);
    const filteredPreferences = useMemo(() => (
        (preferencesData || []).filter(preference => preference?.amount !== 1)
    ), [preferencesData]);

    const handleGetRescue = useCallback(() => {
        dispatch(setItemType(SHOPPING_ITEM_TYPE.RESCUE));
        dispatch(setActiveCategory(ALL_CATEGORY));
        setPage(0);
    }, [dispatch]);

    const handleGetOriginal = useCallback(() => {
        dispatch(setItemType(SHOPPING_ITEM_TYPE.ORIGINAL));
        dispatch(setActiveCategory(ALL_CATEGORY));
        setPage(0);
    }, [dispatch]);

    const popoverText = useMemo(() => {
        const isShopOnMyOwn = route.params?.isShopOnMyOwn;
        const isSubmitted = route.params?.isSubmitted;

        if (currentStep === SHOPPING_STEP.MAIN && status === SHOPPING_STATUS.PENDING) {
            return {
                title: 'New Shopping List',
                message: shoppingListDates
                    ? `Here's your shopping list for ${shoppingListDates.from}-${shoppingListDates.to}.`
                    : 'Here\'s your shopping list.',
            };
        }
        // HS-3113: third shopping-list review removed. The "Final Check" popover
        // is the popover called out in the ticket. Block kept for easy revert.
        // if (currentStep === SHOPPING_STEP.CHECK) {
        //     return {
        //         title: 'Final Check',
        //         message: shoppingListDates
        //             ? `Review your ${shoppingListDates.from}-${shoppingListDates.to} list one last time.`
        //             : 'Review your list one last time.',
        //     };
        // }
        if (isShopOnMyOwn && status === SHOPPING_STATUS.SHOP_ON_MY_OWN) {
            return { title: 'Shopping List', message: 'You can now shop on your own.' };
        }
        if (isSubmitted && status === SHOPPING_STATUS.CONFIRMED) {
            return { title: 'Your order has been submitted', message: 'We will reach out soon to confirm.' };
        }
        return null;
    }, [currentStep, shoppingListDates, status, route.params]);

    const assertHeaderHeight = useDevHeightAssert(
        'ShoppingList section header',
        sectionHeaderHeight - HEADER_CONTENT_INSET,
    );

    const renderSectionHeader = useCallback(({ section }: any) => (
        <View style={[styles.section, {
            height: sectionHeaderHeight,
            backgroundColor: theme.colors.surfaceAlt,
            borderBottomColor: theme.colors.border,
        }]}>
            {/* The wrapper carries onLayout: the shared Text does not forward it, and the header
                View itself has a pinned height, so only this unconstrained box can reveal overflow. */}
            <View onLayout={assertHeaderHeight}>
                <Text variant="h3" numberOfLines={1} style={styles.sectionTitle} color={theme.colors.primary}>
                    {section?.title}
                </Text>
            </View>
        </View>
    ), [theme.colors, sectionHeaderHeight, assertHeaderHeight]);

    const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
        <AnimatedListRow
            index={index}
            itemKey={item.id}
            seenKeys={seenKeys}
            isFirstWave={firstWaveRef.current}
        >
            <ShoppingItem
                item={item}
                status={status}
                compact={compact}
                height={itemHeight}
                disabled={isLoading}
                isMainStep={isMainStep}
                isConfirmed={isConfirmed}
                onUpdate={handleUpdateItem}
                onAmountFocus={handleAmountFocus}
            />
        </AnimatedListRow>
    ), [
        status,
        compact,
        seenKeys,
        isLoading,
        itemHeight,
        isMainStep,
        isConfirmed,
        firstWaveRef,
        handleUpdateItem,
        handleAmountFocus,
    ]);

    const contentContainerStyle = useMemo(() => ({ paddingBottom: bottomBarHeight }), [bottomBarHeight]);

    const listFooter = useMemo(() => (
        <ListFooterLoader
            state={footerState}
            rowHeight={itemHeight}
            endLabel="That's everything on your list"
        />
    ), [footerState, itemHeight]);
    // const renderSectionHeader = useCallback(({ section: { title } }: { section: GroupedItem }) => (
    //     <View style={styles.section}>
    //         <Text variant="h3" style={styles.sectionTitle}>{title}</Text>
    //         {currentStep === SHOPPING_STEP.MAIN && status !== SHOPPING_STATUS.CONFIRMED && (
    //             <Text variant="bold" color={COLORS.THEME_COLOR}>Remove Items</Text>
    //         )}
    //     </View>
    // ), [currentStep, status]);
    // Only the list body swaps for a skeleton. An early return used to unmount StackHeader too,
    // which left the user with no back button and no drawer for the whole load — no way out if the
    // request was slow or failed. It also delayed the bottom bar's onLayout, so the list's first
    // paint had paddingBottom 0 and jumped once the bar measured.
    const renderList = () => (
        <SectionList
            windowSize={7}
            ref={sectionListRef}
            sections={groupedList}
            initialNumToRender={8}
            maxToRenderPerBatch={6}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            onEndReachedThreshold={0.4}
            stickySectionHeadersEnabled
            getItemLayout={getItemLayout}
            updateCellsBatchingPeriod={60}
            onEndReached={handleEndReached}
            ListFooterComponent={listFooter}
            onScrollBeginDrag={endFirstWave}
            keyboardShouldPersistTaps="handled"
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={contentContainerStyle}
            refreshControl={
                <RefreshControl
                // Only a deliberate pull spins this. Gating on `isFetching` used to make it
                // spin at the top while page N+1 was loading at the bottom.
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                />
            }
        />
    );

    const renderBody = () => {
        if (isLoading) {
            return (
                <ShoppingListSkeleton
                    compact={compact}
                    rowHeight={itemHeight}
                    headerHeight={sectionHeaderHeight}
                />
            );
        }
        return (
            <>
                <HorizontalMenu
                    data={tabs}
                    activeItem={activeCategory}
                    handleItem={handleCategoryChange}
                />
                {groupedList.length === 0 ? (
                    <EmptyState
                        icon="shopping-cart"
                        title="Your shopping list is empty"
                        subtitle="Items you add will show up here, grouped by aisle."
                    />
                ) : (
                    <KeyboardAvoidingView behavior="padding" style={styles.keyboardAvoider}>
                        {renderList()}
                    </KeyboardAvoidingView>
                )}
            </>
        );
    };

    return (
        <Screen initialized style={styles.container}>
            <StackHeader
                onBack={handleBack}
                onOpenDrawer={openDrawer}
                centerContent={headerCenter}
            />
            {includeRescueFoodsInShoppingList && separateRescueItems && (
                <ListSwitcher
                    itemType={itemType}
                    disabledOriginal={false}
                    getRescue={handleGetRescue}
                    getOriginal={handleGetOriginal}
                />
            )}

            {/* Library buttons (Video / Question) */}
            {(video || question) && (
                <View style={styles.libraryBtnContainer}>
                    {video && (
                        <PlayBtn
                            style={styles.btnOffset}
                            change={!patientVideos?.[0]?.alreadySeen}
                            disabled={patientVideos?.[0]?.alreadySeen}
                            navigationAttr={{
                                video,
                                id: patientVideos?.[0]?.id,
                                backLink: ROUTES.SHOPPING_LIST,
                                library: VIDEO_LIBRARY_TYPE.GENERAL_VIDEO,
                            }}
                        />
                    )}
                    {question && (
                        <QuestionBtn
                            style={styles.btnOffset}
                            change={!question?.alreadyAnswered}
                            disabled={question?.alreadyAnswered}
                            navigationAttr={{
                                backLink: ROUTES.SHOPPING_LIST,
                                question: {
                                    ...question,
                                    questionType: QUESTION_TYPE.GENERAL_QUESTION,
                                },
                            }}
                        />
                    )}
                </View>
            )}

            {status === SHOPPING_STATUS.SHOP_ON_MY_OWN && (
                <TouchableOpacity onPress={handlePrint} style={styles.printContainer}>
                    <Icon name="printer" color={COLORS.GREY} size={18} />
                    <Text style={styles.printText}> Print List</Text>
                </TouchableOpacity>
            )}
            {renderBody()}
            <GlassSurface
                intensity={5}
                style={styles.glassBar}
                tint={theme.dark ? 'dark' : 'light'}
                onLayout={e => setBottomBarHeight(e.nativeEvent.layout.height)}
            >
                <View style={styles.buttonControl}>
                    {isOriginalConfirmed && includeRescueFoodsInShoppingList ? (
                        <View style={styles.buttonsWrapper}>
                            <Button
                                title="Back"
                                variant="secondary"
                                onPress={handleBack}
                                disabled={isLoading}
                                style={styles.backBtn}
                                textStyle={styles.backBtnText}
                            />
                            <Button
                                title="Done"
                                variant="primary"
                                onPress={handleDone}
                                disabled={isLoading}
                                style={styles.doneBtn}
                                textStyle={styles.doneBtnText}
                            />
                        </View>
                    ) : !isConfirmed && (
                        <Button
                            title="Next"
                            variant="primary"
                            disabled={isLoading}
                            style={styles.nextBtn}
                            onPress={handleNextBtn}
                            textStyle={styles.nextBtnText}
                        />
                    )}
                </View>
            </GlassSurface>
            {(status !== SHOPPING_STATUS.SHOP_ON_MY_OWN && isCustomAlertOpen) && (
                <Modal
                    transparent
                    animationType="fade"
                    visible={isCustomAlertOpen}
                    onRequestClose={handleCloseCustomAlert}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.overlay}
                        onPress={handleCloseCustomAlert}
                    >
                        <View style={[styles.alertBox, { backgroundColor: theme.colors.surface }]}>
                            <Text style={styles.alertTitle} color={theme.colors.text}>People Eating per Meal</Text>
                            {filteredPreferences.length === 0 ? (
                                <Text style={styles.alertMessage} color={theme.colors.textSecondary}>
                                    Do you want to change the number of people eating per meal?
                                </Text>
                            ) : (
                                <View>
                                    <Text style={styles.alertMessagePreference} color={theme.colors.text}>You have:</Text>
                                    {filteredPreferences.map(preference => (
                                        <Text key={preference.id} style={styles.alertMessagePreference} color={theme.colors.text}>
                                            {`• ${preference.amount} people eating for ${preference.name}`}
                                        </Text>
                                    ))}
                                    <Text style={styles.alertMessage} color={theme.colors.textSecondary}>
                                        Do you want to change your selections?
                                    </Text>
                                </View>
                            )}
                            <View style={styles.alertActions}>
                                <TouchableOpacity
                                    onPress={handleApplyCustomAlert}
                                    style={[styles.alertBtn, styles.yesBtnBgColor]}
                                >
                                    <Text style={styles.alertBtnText}>Yes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleCloseCustomAlert}
                                    style={[styles.alertBtn, styles.noBtnBgColor]}
                                >
                                    <Text style={styles.alertBtnText}>No</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}
            <ConfirmationAlert
                cancelTxt="Cancel"
                applyTxt="Finalize"
                disabled={isLoading}
                isOpen={isFinalizeOpen}
                onSubmit={handleFinalize}
                message="This action cannot be undone."
                onClose={() => setIsFinalizeOpen(false)}
                title="Are you sure you want to finalize your shopping list?"
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
            {popoverText && !isCustomAlertOpen && (
                <ConfirmationAlert
                    hideCancelBtn
                    disabled={isLoading}
                    title={popoverText.title}
                    isOpen={open && isFocused}
                    onClose={handleCloseAlert}
                    onSubmit={handleCloseAlert}
                    message={popoverText.message}
                    applyTxt={route.params?.isSubmitted ? 'Got it!' : 'View List'}
                />
            )}
        </Screen>
    );
};

export default memo(ShoppingList);

const styles = StyleSheet.create({
    container: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    headerContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        color: COLORS.WHITE,
    },
    dateText: {
        fontSize: 14,
        color: COLORS.WHITE,
        marginTop: 2,
    },
    libraryBtnContainer: {
        flexDirection: 'row',
        padding: 8,
    },
    btnOffset: {
        marginLeft: 0,
        marginRight: 10,
    },
    printContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    printText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.THEME_COLOR,
    },
    section: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.LIGHT_GREY,
    },
    sectionTitle: {
        color: COLORS.THEME_COLOR,
    },
    emptyText: {
        marginTop: OFFSET.VERTICAL * 2,
        flexGrow: 1,
    },
    buttonControl: {
        borderTopWidth: 1,
        flexDirection: 'row',
        paddingTop: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingBottom: OFFSET.VERTICAL,
        borderTopColor: COLORS.LIGHT_GREY,
    },
    keyboardAvoider: {
        flex: 1,
    },
    nextBtn: {
        flex: 1,
        borderColor: '#00788D',
        borderWidth: 3,
        borderRadius: 50,
        backgroundColor: '#B8E6B3',
    },
    nextBtnText: {
        fontSize: 24,
        color: '#00788D',
        fontWeight: 'bold',
    },
    buttonsWrapper: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    backBtn: {
        flex: 1,
        marginRight: 8,
        backgroundColor: '#EBB3D1',
    },
    backBtnText: {
        color: COLORS.BLACK,
        fontSize: 20,
        fontWeight: 'bold',
    },
    doneBtn: {
        flex: 1,
        marginLeft: 8,
        backgroundColor: '#E3FFDE',
    },
    doneBtnText: {
        color: '#61BD4F',
        fontSize: 20,
        fontWeight: 'bold',
    },
    // Custom Alert styles (People Eating per Meal)
    overlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00000090',
    },
    alertBox: {
        padding: 20,
        width: '70%',
        borderRadius: 6,
        marginBottom: 150,
        alignItems: 'center',
    },
    alertTitle: {
        fontSize: 20,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    alertMessage: {
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
    },
    alertMessagePreference: {
        fontSize: 16,
        marginBottom: 5,
        textAlign: 'center',
    },
    alertActions: {
        width: '80%',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    alertBtn: {
        flex: 1,
        padding: 2,
        borderWidth: 3,
        borderRadius: 30,
        marginHorizontal: 10,
        borderColor: COLORS.THEME_COLOR,
    },
    alertBtnText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        color: COLORS.BLACK,
    },
    yesBtnBgColor: {
        backgroundColor: '#B8E6B3',
    },
    noBtnBgColor: {
        backgroundColor: '#EBB3D1',
    },
    glassBar: {
        left: 0,
        right: 0,
        bottom: 0,
        // paddingTop: 10,
        position: 'absolute',
    },
});
