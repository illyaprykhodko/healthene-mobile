// outsource dependencies
import moment from 'moment';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { StyleSheet, View, SectionList, TouchableOpacity, Modal } from 'react-native';
import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { Button } from 'components/Button';
import { useAppDispatch, useAppSelector } from 'store';
import { SHOPPING_STEP, SHOPPING_STATUS, SHOPPING_ITEM_TYPE, SHOPPING_CONFIRMED_ITEM_TYPE } from 'constants/spec';
import {
    setItemType,
    selectShopping,
    setCurrentStep,
    setIsListTouched,
    setShoppingStatus,
    setActiveCategory,
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
        separateRescueItems,
        isMealQuestionAsked,
    } = useAppSelector(selectShopping);

    const includeRescueFoodsInShoppingList = useAppSelector(state => state.app?.user?.includeRescueFoodsInShoppingList);
    const submittedShoppingList = useAppSelector(state => (state.app?.user as any)?.submittedShoppingList) ?? false;

    const [open, setOpen] = useState(true);
    const [page, setPage] = useState(0);

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

    // const [localListData, setLocalListData]
    // = useState<{ content: any[], totalPages: number, totalElements: number, pageNumber: number}>({ content: [], totalPages: 0, totalElements: 0, pageNumber: 0 });
    const { data: listData, isLoading: isListLoading, isFetching, refetch } = useGetShoppingListQuery({
        categories: activeCategory?.id ? [activeCategory.id] : [],
        withExcluded: excluded,
        itemType: separateRescueItems ? itemType : null,
        page,
        size: 20,
    });

    const [updateItem] = useUpdateShoppingItemMutation();
    const [confirmShopOnMyOwn] = useConfirmShopOnMyOwnMutation();

    const isLoading = isCategoriesLoading || isListLoading;

    useEffect(() => {
        if (statusData) {
            dispatch(setShoppingStatus({
                id: statusData.id,
                status: statusData.status,
                confirmedItemsType: statusData.confirmedItemsType,
                separateRescueItems: statusData.separateRescueItems,
            }));
        }
    }, [statusData, dispatch]);

    useEffect(() => {
        if (datesData) {
            dispatch(setShoppingListDates({
                from: moment(datesData.startDate).format('MMM DD'),
                to: moment(datesData.endDate).format('DD'),
            }));
        }
    }, [datesData, dispatch]);

    const tabs = useMemo(() => {
        const categories = categoriesData || [];
        return [{ name: 'All' }, ...categories];
    }, [categoriesData]);

    const groupedList: GroupedItem[] = useMemo(() => {
        const items = listData?.content || [];
        const grouped: Record<string, any[]> = {};

        items.forEach((item: any) => {
            const categoryName = item.shoppingCartCategory?.name || 'Other';
            if (!grouped[categoryName]) {
                grouped[categoryName] = [];
            }
            grouped[categoryName].push(item);
        });

        return Object.entries(grouped).map(([title, data]) => ({
            title,
            data,
        }));
    }, [listData]);

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
                dispatch(setCurrentStep(SHOPPING_STEP.STORE));
                navigation.navigate(ROUTES.CHOOSE_GROCERY_STORE);
            }
        } else {
            dispatch(setCurrentStep(SHOPPING_STEP.STORE));
            navigation.navigate(ROUTES.CHOOSE_GROCERY_STORE);
        }
    }, [navigation, currentStep, stockList, isListTouched, dispatch, refetch]);

    const handleBack = useCallback(() => {
        if (isListTouched && stockList.length === 0 && currentStep === SHOPPING_STEP.CHECK) {
            dispatch(setCurrentStep(SHOPPING_STEP.MAIN));
        } else if (status === SHOPPING_STATUS.CONFIRMED || status === SHOPPING_STATUS.SHOP_ON_MY_OWN) {
            navigation.navigate(ROUTES.DAY_OVERVIEW);
        } else {
            navigation.goBack();
        }
    }, [navigation, isListTouched, stockList, currentStep, status, dispatch]);

    const handleDone = useCallback(async () => {
        try {
            await confirmShopOnMyOwn({}).unwrap();
            dispatch(setCurrentStep(SHOPPING_STEP.MAIN));
        } catch (error) {
            console.error('Error confirming:', error);
        }
    }, [confirmShopOnMyOwn, dispatch]);

    const handlePrint = useCallback(() => {
        const endDate = moment().endOf('week').format('YYYY-MM-DD');
        const startDate = moment().startOf('week').format('YYYY-MM-DD');
        navigation.navigate(ROUTES.SHOPPING_PDF, { date: { endDate, startDate } });
    }, [navigation]);

    const handleCloseAlert = useCallback(() => setOpen(false), []);

    const handleCloseCustomAlert = useCallback(() => {
        dispatch(setIsCustomAlertOpen(false));
    }, [dispatch]);

    const handleApplyCustomAlert = useCallback(() => {
        dispatch(setIsCustomAlertOpen(false));
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
            dispatch(setIsMealQuestionAsked(true));
            dispatch(setIsCustomAlertOpen(true));
        }
    }, [isNeedToAskQuestion, dispatch]);

    const handleGetRescue = useCallback(() => {
        dispatch(setItemType(SHOPPING_ITEM_TYPE.RESCUE));
        dispatch(setActiveCategory({ name: 'All' }));
        setPage(0);
    }, [dispatch]);

    const handleGetOriginal = useCallback(() => {
        dispatch(setItemType(SHOPPING_ITEM_TYPE.ORIGINAL));
        dispatch(setActiveCategory({ name: 'All' }));
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

    const renderSectionHeader = useCallback(({ section: { title } }: { section: GroupedItem }) => (
        <View style={styles.section}>
            <Text variant="h3" style={styles.sectionTitle}>{title}</Text>
            {currentStep === SHOPPING_STEP.MAIN && status !== SHOPPING_STATUS.CONFIRMED && (
                <Text variant="bold" color={COLORS.THEME_COLOR}>Remove Items</Text>
            )}
        </View>
    ), [currentStep, status]);
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
                <SectionList
                    sections={groupedList}
                    stickySectionHeadersEnabled
                    renderSectionHeader={renderSectionHeader}
                    keyExtractor={(item, index) => `${item.id}_${index}`}
                    renderItem={({ item }) => (
                        <ShoppingItem
                            item={item}
                            status={status}
                            disabled={isLoading}
                            isConfirmed={isConfirmed}
                            onUpdate={handleUpdateItem}
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

            {isCustomAlertOpen && (
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
                            <Text style={styles.alertMessage}>
                                Do you want to change the number of people eating per meal?
                            </Text>
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
        fontSize: 16,
        marginBottom: 20,
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
        color: COLORS.DARK_GREY,
    },
    yesBtnBgColor: {
        backgroundColor: '#B8E6B3',
    },
    noBtnBgColor: {
        backgroundColor: '#EBB3D1',
    },
});
