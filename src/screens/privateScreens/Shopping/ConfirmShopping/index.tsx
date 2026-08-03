// outsource dependencies
import { StyleSheet, View } from 'react-native';
import React, { memo, useCallback, useMemo } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { Button } from 'components/Button';
import DefImage from 'components/DefImage';
import StackHeader from 'components/StackHeader';
import { useAppDispatch, useAppSelector } from 'store';
import { useShoppingDrawer } from '../useShoppingDrawer';
import { SHOPPING_STEP, SHOPPING_STATUS, SHOPPING_CONFIRMED_ITEM_TYPE } from 'constants/spec';
import { setCurrentStep, selectShopping, setShoppingStatus } from 'store/slices/shoppingSlice';
import {
    useUpdateGroceryStoreMutation,
    useUpdateShoppingListStatusMutation,
} from 'store/api/shoppingApi';

const ConfirmShopping: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const dispatch = useAppDispatch();
    const openDrawer = useShoppingDrawer();

    const selectedItem = route.params?.selectedItem;
    const {
        id: shoppingListId,
        confirmedItemsType,
        separateRescueItems,
    } = useAppSelector(selectShopping);
    const includeRescueFoodsInShoppingList = useAppSelector(state => state.app?.user?.includeRescueFoodsInShoppingList);

    const [updateShoppingListStatus, { isLoading: isUpdatingStatus }] = useUpdateShoppingListStatusMutation();
    const [updateGroceryStore, { isLoading: isUpdatingStore }] = useUpdateGroceryStoreMutation();

    const isLoading = isUpdatingStatus || isUpdatingStore;

    const addressInfo = useMemo(() => {
        if (!selectedItem?.storeLocationType || !selectedItem?.addresses) {
            return null;
        }
        const store = selectedItem.addresses.find(
            (addr: any) => addr.storeLocationType === selectedItem.storeLocationType
        );
        if (!store) { return null; }
        return `${store.address}, ${store.city}, ${store.state}`;
    }, [selectedItem]);

    const handleGoBack = useCallback(() => {
        dispatch(setCurrentStep(SHOPPING_STEP.STORE));
        navigation.goBack();
    }, [navigation, dispatch]);

    const handleSubmit = useCallback(async () => {
        try {
            // Determine confirmedItemsType based on user preference
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
                    separateRescueItems,
                    status: SHOPPING_STATUS.CONFIRMED,
                    confirmedItemsType: newConfirmedItemsType,
                }).unwrap();
            }
            await updateGroceryStore(selectedItem).unwrap();
            dispatch(setShoppingStatus({
                status: SHOPPING_STATUS.CONFIRMED,
                confirmedItemsType: newConfirmedItemsType,
            }));
            dispatch(setCurrentStep(SHOPPING_STEP.MAIN));

            navigation.navigate(ROUTES.SHOPPING_LIST, { isSubmitted: true });
        } catch (error) {
            console.error('Error submitting order:', error);
        }
    }, [
        dispatch,
        navigation,
        selectedItem,
        shoppingListId,
        confirmedItemsType,
        updateGroceryStore,
        separateRescueItems,
        updateShoppingListStatus,
        includeRescueFoodsInShoppingList,
    ]);

    return (
        <Screen initialized style={styles.container}>
            <StackHeader
                title="Shopping List"
                onBack={handleGoBack}
                onOpenDrawer={openDrawer}
            />
            <View style={styles.content}>
                <View style={styles.title}>
                    <Text textAlign="center" variant="h1" style={styles.titleText}>
                        Review and submit your order.
                    </Text>
                </View>

                {selectedItem?.groceryStore?.image?.url && (
                    <DefImage
                        style={styles.storeImage}
                        src={selectedItem.groceryStore.image.url}
                    />
                )}

                <Text variant="h2" style={styles.storeName}>
                    {selectedItem?.groceryStore?.name}
                </Text>

                {addressInfo && (
                    <Text textAlign="center" variant="h3" style={styles.address}>
                        {addressInfo}
                    </Text>
                )}

                <View style={styles.warning}>
                    <Text textAlign="center" variant="h2">
                        Before you proceed, ensure that you have reviewed and confirmed all items on your list.
                        Once you submit the order, it cannot be undone.
                    </Text>
                </View>
            </View>

            <View style={styles.buttonControl}>
                <Button
                    title="Back"
                    variant="secondary"
                    disabled={isLoading}
                    onPress={handleGoBack}
                    style={styles.backBtn}
                    textStyle={styles.backBtnText}
                />
                <Button
                    title="Submit"
                    variant="primary"
                    onPress={handleSubmit}
                    style={styles.submitBtn}
                    textStyle={styles.submitBtnText}
                    disabled={isLoading || !selectedItem}
                />
            </View>
        </Screen>
    );
};

export default memo(ConfirmShopping);

const styles = StyleSheet.create({
    container: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    content: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        padding: 20,
    },
    titleText: {
        fontSize: 36,
    },
    storeImage: {
        width: '50%',
        height: 150,
        alignSelf: 'center',
    },
    storeName: {
        color: COLORS.DARK_GREY,
        alignSelf: 'center',
        fontSize: 24,
    },
    address: {
        color: COLORS.DARK_GREY,
        paddingHorizontal: 20,
        fontSize: 16,
        marginTop: 5,
    },
    warning: {
        marginTop: 20,
        padding: 20,
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
        borderRadius: 30,
        backgroundColor: '#EBB3D1',
        borderColor: COLORS.BLACK,
    },
    backBtnText: {
        color: COLORS.BLACK,
        fontSize: 24,
        fontWeight: 'bold',
    },
    submitBtn: {
        flex: 1,
        marginLeft: 8,
        borderRadius: 30,
        backgroundColor: '#B8E6B3',
        borderColor: '#00788D',
    },
    submitBtnText: {
        color: '#00788D',
        fontSize: 24,
        fontWeight: 'bold',
    },
});
