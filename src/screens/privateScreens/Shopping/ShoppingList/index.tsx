// outsource dependencies
import moment from 'moment';
import Icon from '@react-native-vector-icons/feather';
import { StyleSheet, View, TouchableOpacity, Modal } from 'react-native';
import { KeyboardAwareSectionList } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation, useRoute, useIsFocused, StackActions } from '@react-navigation/native';
import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import BackBtn from 'components/BackBtn';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { Button } from 'components/Button';
import { useAppDispatch, useAppSelector } from 'store';
import { PlayBtn, QuestionBtn } from 'components/LibraryButtons';
import { useGetCurrentLibraryElementsQuery } from 'store/api/questionApi';
import { SHOPPING_STEP, SHOPPING_STATUS, SHOPPING_ITEM_TYPE, SHOPPING_CONFIRMED_ITEM_TYPE, DESTINATIONS, QUESTION_TYPE, VIDEO_LIBRARY_TYPE } from 'constants/spec';
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
    // TEMP: needed while we route "shop on my own" through PUT /shopping-list; revert once backend re-adds /shop-on-my-own
    useUpdateShoppingListStatusMutation,
} from 'store/api/shoppingApi';
import ShoppingItem from './ShoppingItem';
import ListSwitcher from 'components/ListSwitcher';
import HorizontalMenu from 'components/HorizontalMenu';
import ConfirmationAlert from 'components/ConfirmationAlert';
import { ShoppingListSkeleton } from 'components/Skeleton/ShoppingListSkeleton';

interface GroupedItem {
    title: string;
    data: any[];
}

const ALL_CATEGORY: { name: string; id?: number | null } = { name: 'All' };
const ADDITIONAL_CATEGORY_NAME = 'Additional';

const ShoppingList: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const dispatch = useAppDispatch();
    const isFocused = useIsFocused();

    const {
        status,
        itemType,
        currentStep,
        isListTouched,
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
    const pendingBackActionRef = useRef<any | null>(null);
    const allowBackRef = useRef(false);
    const sectionListRef = useRef<any>(null);

    // Queries
    const { data: statusData } = useGetShoppingListStatusQuery();
    const { data: datesData } = useGetShoppingListDatesQuery();
    const { data: stockData } = useGetStockListQuery({
        shoppingCartCategoryId: undefined,
        page: 0,
        size: 20,
    });
    const stockList = stockData?.content || [];
    const excluded = currentStep === SHOPPING_STEP.MAIN || currentStep === SHOPPING_STEP.CHECK;
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
        page,
        size: 20,
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

    const isLoading = isCategoriesLoading || isListLoading;

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
                from: moment(datesData.startDate).format('MMM DD'),
                to: moment(datesData.endDate).format('DD'),
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
        sectionListRef.current.scrollToLocation({
            sectionIndex: location.sectionIndex,
            itemIndex: location.itemIndex,
            viewPosition: 0.35,
            viewOffset: 120,
            animated: true,
        });
    }, [itemPositionById]);

    const isOriginalConfirmed = useMemo(() => (
        confirmedItemsType === SHOPPING_CONFIRMED_ITEM_TYPE.ORIGINAL
        && (status === SHOPPING_STATUS.CONFIRMED || status === SHOPPING_STATUS.SHOP_ON_MY_OWN)
    ), [status, confirmedItemsType]);

    const isConfirmed = useMemo(() => (
        (status === SHOPPING_STATUS.CONFIRMED && itemType === confirmedItemsType)
        || confirmedItemsType === SHOPPING_CONFIRMED_ITEM_TYPE.ALL
        || (status === SHOPPING_STATUS.SHOP_ON_MY_OWN && itemType === confirmedItemsType)
    ), [status, itemType, confirmedItemsType]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <View style={styles.headerContainer}>
                    <Text variant="bold" style={styles.headerTitle}>Shopping list</Text>
                    {shoppingListDates && (
                        <Text variant="bold" style={styles.dateText}>
                            {shoppingListDates.from} - {shoppingListDates.to}
                        </Text>
                    )}
                </View>
            ),
        });
    }, [shoppingListDates, navigation]);

    const handleCategoryChange = useCallback((item: any) => {
        dispatch(setActiveCategory(item.activeItem || item));
        setPage(0);
    }, [dispatch]);

    const handleUpdateItem = useCallback(async (item: any) => {
        try {
            dispatch(setIsListTouched(true));
            await updateItem([item]).unwrap();
        } catch (error) {
            console.error('Error updating item:', error);
        }
    }, [updateItem, dispatch]);

    const handleNextBtn = useCallback(() => {
        if (currentStep === SHOPPING_STEP.MAIN || currentStep === SHOPPING_STEP.MEAL) {
            if (stockList.length > 0) {
                setOpen(false);
                dispatch(setCurrentStep(SHOPPING_STEP.STOCK));
                navigation.navigate(ROUTES.STOCK_LIST);
            } else if (isListTouched) {
                dispatch(setCurrentStep(SHOPPING_STEP.CHECK));
                refetch();
            } else {
                setIsFinalizeOpen(true);
            }
        } else {
            setIsFinalizeOpen(true);
        }
    }, [navigation, currentStep, stockList, isListTouched, dispatch, refetch]);

    const handleBack = useCallback(() => {
        if (isListTouched && stockList.length === 0 && currentStep === SHOPPING_STEP.CHECK) {
            dispatch(setCurrentStep(SHOPPING_STEP.MAIN));
            return;
        }
        if (
            status === SHOPPING_STATUS.PENDING
            && !isFinalizeAlertOpen
            && currentStep !== SHOPPING_STEP.CHECK
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
    }, [navigation, isListTouched, stockList, currentStep, status, dispatch, isFinalizeAlertOpen]);

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => <BackBtn onPress={handleBack} />,
        });
    }, [navigation, handleBack]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
            if (allowBackRef.current) {
                allowBackRef.current = false;
                return;
            }
            if (
                status === SHOPPING_STATUS.PENDING
                && currentStep !== SHOPPING_STEP.CHECK
            ) {
                event.preventDefault();
                pendingBackActionRef.current = event.data.action;
                dispatch(updateShoppingMeta({ isFinalizeAlertOpen: true, isTryToOpenSideMenu: false }));
            }
        });
        return unsubscribe;
    }, [navigation, status, currentStep, dispatch]);

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
        const endDate = moment().endOf('week').format('YYYY-MM-DD');
        const startDate = moment().startOf('week').format('YYYY-MM-DD');
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
        if (currentStep === SHOPPING_STEP.CHECK) {
            return {
                title: 'Final Check',
                message: shoppingListDates
                    ? `Review your ${shoppingListDates.from}-${shoppingListDates.to} list one last time.`
                    : 'Review your list one last time.',
            };
        }
        if (isShopOnMyOwn && status === SHOPPING_STATUS.SHOP_ON_MY_OWN) {
            return { title: 'Shopping List', message: 'You can now shop on your own.' };
        }
        if (isSubmitted && status === SHOPPING_STATUS.CONFIRMED) {
            return { title: 'Your order has been submitted', message: 'We will reach out soon to confirm.' };
        }
        return null;
    }, [currentStep, shoppingListDates, status, route.params]);

    const renderSectionHeader = useCallback(({ section }: any) => (
        <View style={styles.section}>
            <Text variant="h3" style={styles.sectionTitle}>{section?.title}</Text>
        </View>
    ), []);
    // const renderSectionHeader = useCallback(({ section: { title } }: { section: GroupedItem }) => (
    //     <View style={styles.section}>
    //         <Text variant="h3" style={styles.sectionTitle}>{title}</Text>
    //         {currentStep === SHOPPING_STEP.MAIN && status !== SHOPPING_STATUS.CONFIRMED && (
    //             <Text variant="bold" color={COLORS.THEME_COLOR}>Remove Items</Text>
    //         )}
    //     </View>
    // ), [currentStep, status]);
    if (isLoading) {
        return <ShoppingListSkeleton />;
    }

    return (
        <Screen initialized={!isLoading} style={styles.container}>
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
            <HorizontalMenu
                data={tabs}
                disabled={isLoading}
                activeItem={activeCategory}
                handleItem={handleCategoryChange}
            />
            {groupedList.length === 0 ? (
                <Text textAlign="center" color={COLORS.GREY} style={styles.emptyText}>
                    No shopping list was found
                </Text>
            ) : (
                <KeyboardAwareSectionList
                    enableOnAndroid
                    ref={sectionListRef}
                    sections={groupedList}
                    extraScrollHeight={120}
                    keyboardOpeningTime={0}
                    stickySectionHeadersEnabled
                    keyboardShouldPersistTaps="handled"
                    renderSectionHeader={renderSectionHeader}
                    keyExtractor={(item, index) => `${item.id}_${index}`}
                    renderItem={({ item }) => (
                        <ShoppingItem
                            item={item}
                            status={status}
                            disabled={isLoading}
                            isConfirmed={isConfirmed}
                            onUpdate={handleUpdateItem}
                            onAmountFocus={handleAmountFocus}
                        />
                    )}
                    onEndReached={() => {
                        if (listData && !isFetching && page + 1 < listData.totalPages) {
                            setPage(p => p + 1);
                        }
                    }}
                    onEndReachedThreshold={0.25}
                />
            )}
            <View style={styles.buttonControl}>
                {isOriginalConfirmed && includeRescueFoodsInShoppingList ? (
                    <View style={styles.buttonsWrapper}>
                        <Button
                            title="Back"
                            variant="secondary"
                            onPress={handleBack}
                            style={styles.backBtn}
                            textStyle={styles.backBtnText}
                        />
                        <Button
                            title="Done"
                            variant="primary"
                            onPress={handleDone}
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
                        <View style={styles.alertBox}>
                            <Text style={styles.alertTitle}>People Eating per Meal</Text>
                            {filteredPreferences.length === 0 ? (
                                <Text style={styles.alertMessage}>
                                    Do you want to change the number of people eating per meal?
                                </Text>
                            ) : (
                                <View>
                                    <Text style={styles.alertMessagePreference}>You have:</Text>
                                    {filteredPreferences.map(preference => (
                                        <Text key={preference.id} style={styles.alertMessagePreference}>
                                            {`• ${preference.amount} people eating for ${preference.name}`}
                                        </Text>
                                    ))}
                                    <Text style={styles.alertMessage}>
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
                variant="legacy"
                title="Oops!"
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
        backgroundColor: '#E8F4FC',
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
        backgroundColor: '#fff',
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
});
