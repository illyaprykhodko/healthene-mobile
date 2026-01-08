// outsource dependencies
import Icon from 'react-native-vector-icons/Fontisto';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View, TouchableOpacity, FlatList } from 'react-native';
import React, { memo, useCallback, useLayoutEffect, useMemo, useState } from 'react';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import BackBtn from 'components/BackBtn';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { Button } from 'components/Button';
import DefImage from 'components/DefImage';
import { useAppDispatch, useAppSelector } from 'store';
import { SHOPPING_STEP, SHOPPING_STATUS, SHOPPING_CONFIRMED_ITEM_TYPE } from 'constants/spec';
import {
    selectShopping,
    setCurrentStep,
    setSelectedStore,
    setShoppingStatus,
    selectSelectedStore,
} from 'store/slices/shoppingSlice';
import {
    GroceryStoreItem,
    useGetStockListQuery,
    useGetGroceryStoresQuery,
    useConfirmShopOnMyOwnMutation,
    useGetIncompleteGroceryStoresQuery,
    useUpdateShoppingListStatusMutation,
} from 'store/api/shoppingApi';
import ConfirmationAlert from 'components/ConfirmationAlert';

const SHOP_ON_MY_OWN_ID = 'SHOP_ON_MY_OWN';

// Location types for addresses
export const LOCATION_TYPES = {
    OTHER: 'OTHER',
    NEAREST_TO_MY_HOME: 'NEAREST_TO_MY_HOME',
};

const ChooseGroceryStore: React.FC = () => {
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();

    const [showFinalizeAlert, setShowFinalizeAlert] = useState(false);

    const selectedStore = useAppSelector(selectSelectedStore);
    const { isListTouched, isStockTouched, id: shoppingListId, separateRescueItems, confirmedItemsType } = useAppSelector(selectShopping);
    const includeRescueFoodsInShoppingList = useAppSelector(state => state.app?.user?.includeRescueFoodsInShoppingList);

    const { data: storesData, isLoading: isLoadingStores } = useGetGroceryStoresQuery();
    const { data: incompleteStoresData, isLoading: isLoadingIncomplete } = useGetIncompleteGroceryStoresQuery();
    const { data: stockData } = useGetStockListQuery({ page: 0, size: 20 });
    const stockList = stockData?.content || [];

    const [confirmShopOnMyOwn, { isLoading: isConfirmingShopOnMyOwn }] = useConfirmShopOnMyOwnMutation();
    const [updateShoppingListStatus, { isLoading: isUpdatingStatus }] = useUpdateShoppingListStatusMutation();
    const isLoading = isLoadingStores || isLoadingIncomplete;
    const isConfirming = isConfirmingShopOnMyOwn || isUpdatingStatus;

    // Combine stores: regular + incomplete + "Shop on my own" option
    const stores = useMemo(() => {
        const regularStores = storesData || [];
        const incompleteStores = incompleteStoresData || [];
        const combinedStores = incompleteStores.length
            ? [...regularStores, ...incompleteStores]
            : regularStores;

        return [
            ...combinedStores,
            {
                groceryStore: {
                    id: SHOP_ON_MY_OWN_ID,
                    name: 'I will shop on my own.',
                    image: undefined,
                },
            } as GroceryStoreItem,
        ];
    }, [storesData, incompleteStoresData]);

    const isShopOnMyOwn = selectedStore?.groceryStore?.id === SHOP_ON_MY_OWN_ID;

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => <BackBtn onPress={handleGoBack} />,
        });
    }, [navigation]);

    // Go back logic matching original // TODO: refactor this
    const handleGoBack = useCallback(() => {
        if (!stockList.length) {
            if (isListTouched) {
                dispatch(setCurrentStep(SHOPPING_STEP.CHECK));
            } else {
                dispatch(setCurrentStep(SHOPPING_STEP.MAIN));
            }
        } else {
            if (isListTouched || isStockTouched) {
                dispatch(setCurrentStep(SHOPPING_STEP.CHECK));
            } else {
                dispatch(setCurrentStep(SHOPPING_STEP.STOCK));
            }
        }
        navigation.goBack();
    }, [navigation, dispatch, stockList, isListTouched, isStockTouched]);

    const handleSelectStore = useCallback((item: GroceryStoreItem) => {
        dispatch(setSelectedStore(item));
    }, [dispatch]);

    const handleNextBtn = useCallback(async () => {
        if (!selectedStore) { return; }

        dispatch(setCurrentStep(SHOPPING_STEP.CONFIRMED));

        if (isShopOnMyOwn) {
            setShowFinalizeAlert(true);
            return;
        }

        if (selectedStore.storeLocationType) {
            navigation.navigate(ROUTES.CONFIRM_SHOPPING, { selectedItem: selectedStore });
        } else {
            navigation.navigate(ROUTES.CHOOSE_ADDRESS);
        }
    }, [selectedStore, isShopOnMyOwn, dispatch, navigation]);

    const handleFinalizeConfirm = useCallback(async () => {
        try {
            const allItems = includeRescueFoodsInShoppingList;
            const mainCondition = confirmedItemsType === SHOPPING_CONFIRMED_ITEM_TYPE.NONE;
            const newConfirmedItemsType = allItems
                ? SHOPPING_CONFIRMED_ITEM_TYPE.ALL
                : mainCondition
                    ? SHOPPING_CONFIRMED_ITEM_TYPE.ORIGINAL
                    : SHOPPING_CONFIRMED_ITEM_TYPE.ALL;

            if (shoppingListId) {
                await updateShoppingListStatus({
                    id: shoppingListId,
                    status: SHOPPING_STATUS.SHOP_ON_MY_OWN,
                    separateRescueItems,
                    confirmedItemsType: newConfirmedItemsType,
                }).unwrap();
            }

            dispatch(setShoppingStatus({
                status: SHOPPING_STATUS.SHOP_ON_MY_OWN,
                confirmedItemsType: newConfirmedItemsType,
            }));
            dispatch(setCurrentStep(SHOPPING_STEP.CONFIRMED));
            navigation.navigate(ROUTES.SHOPPING_LIST, { isShopOnMyOwn: true });
        } catch (error) {
            console.error('Error confirming shop on my own:', error);
        }
        setShowFinalizeAlert(false);
    }, [
        dispatch,
        navigation,
        shoppingListId,
        confirmedItemsType,
        confirmShopOnMyOwn,
        separateRescueItems,
        updateShoppingListStatus,
        includeRescueFoodsInShoppingList,
    ]);

    const handleChangeStoreLocation = useCallback(() => {
        navigation.navigate(ROUTES.CHOOSE_ADDRESS);
    }, [navigation]);

    const disabled = isLoading || isConfirming;

    const renderItem = useCallback(({ item }: { item: GroceryStoreItem }) => {
        const isSelected = selectedStore?.groceryStore?.id === item.groceryStore?.id;
        const isItemShopOnMyOwn = item.groceryStore?.id === SHOP_ON_MY_OWN_ID;

        const currentAddress = isSelected && selectedStore?.storeLocationType
            ? selectedStore?.addresses?.find(
                (addr: any) => addr.storeLocationType === selectedStore?.storeLocationType
            )
            : null;

        const hasAddress = currentAddress?.address || currentAddress?.city || currentAddress?.state;

        const showChangeLocation = isSelected && !isItemShopOnMyOwn && (item?.addresses?.length ?? 0) > 0;

        return (
            <TouchableOpacity
                onPress={() => handleSelectStore(item)}
                disabled={disabled}
                style={[styles.storeItem, isSelected && styles.storeItemSelected]}
            >
                <View style={styles.info}>
                    <View style={styles.titleContainer}>
                        {!isItemShopOnMyOwn && item.groceryStore?.image?.url ? (
                            <DefImage
                                src={item.groceryStore.image.url}
                                style={styles.storeImage}
                            />
                        ) : null}
                        <Text variant="h3" style={styles.storeName}>
                            {item.groceryStore?.name}
                        </Text>
                    </View>

                    {showChangeLocation && (
                        <View style={styles.locationContainer}>
                            {hasAddress && (
                                <Text variant="h5" style={styles.addressText}>
                                    {currentAddress?.address}, {currentAddress?.city}, {currentAddress?.state}
                                </Text>
                            )}
                            <TouchableOpacity onPress={handleChangeStoreLocation}>
                                <Text color={COLORS.BLUE} style={styles.changeLocationText}>
                                    Change Store Location
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <TouchableOpacity onPress={() => handleSelectStore(item)} disabled={disabled}>
                    <Icon
                        name={isSelected ? 'radio-btn-active' : 'radio-btn-passive'}
                        color={isSelected ? COLORS.BLACK : COLORS.GREY}
                        size={24}
                    />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    }, [selectedStore, disabled, handleSelectStore, handleChangeStoreLocation]);

    return (
        <Screen initialized={!isLoading} style={styles.container}>
            <View style={styles.title}>
                <Text variant="h2">Choose Grocery Store</Text>
            </View>

            <View style={styles.list}>
                <FlatList
                    data={stores}
                    renderItem={renderItem}
                    keyExtractor={item => String(item.groceryStore?.id)}
                />
            </View>

            <View style={styles.buttonControl}>
                <Button
                    title="Back"
                    variant="secondary"
                    disabled={disabled}
                    onPress={handleGoBack}
                    style={styles.backBtn}
                    textStyle={styles.backBtnText}
                />
                <Button
                    title="Next"
                    variant="primary"
                    style={styles.nextBtn}
                    onPress={handleNextBtn}
                    textStyle={styles.nextBtnText}
                    disabled={disabled || !selectedStore}
                />
            </View>

            <ConfirmationAlert
                cancelTxt="Cancel"
                applyTxt="Finalize"
                disabled={isConfirming}
                isOpen={showFinalizeAlert}
                onSubmit={handleFinalizeConfirm}
                message="This action cannot be undone."
                onClose={() => setShowFinalizeAlert(false)}
                title="Are you sure you want to finalize your shopping list?"
            />
        </Screen>
    );
};

export default memo(ChooseGroceryStore);

const styles = StyleSheet.create({
    container: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    title: {
        padding: 20,
        backgroundColor: '#D9D9D9',
    },
    list: {
        flex: 1,
    },
    storeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.LIGHT_GREY,
    },
    storeItemSelected: {
        backgroundColor: '#E0FFD1',
    },
    info: {
        width: '90%',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    storeImage: {
        width: 50,
        height: 30,
        marginRight: 10,
    },
    storeName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    locationContainer: {
        marginTop: 10,
        marginLeft: 7,
    },
    addressText: {
        fontSize: 14,
    },
    changeLocationText: {
        paddingTop: 10,
    },
    buttonControl: {
        flexDirection: 'row',
        width: '100%',
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
        borderTopWidth: 1,
        borderTopColor: COLORS.LIGHT_GREY,
    },
    backBtn: {
        flex: 1,
        marginRight: 8,
        backgroundColor: '#EBB3D1',
        borderColor: COLORS.BLACK,
        borderRadius: 30,
    },
    backBtnText: {
        color: COLORS.BLACK,
        fontSize: 24,
        fontWeight: 'bold',
    },
    nextBtn: {
        flex: 1,
        marginLeft: 8,
        backgroundColor: '#B8E6B3',
        borderColor: '#00788D',
        borderRadius: 30,
    },
    nextBtnText: {
        color: '#00788D',
        fontSize: 24,
        fontWeight: 'bold',
    },
});
