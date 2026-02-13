// outsource dependencies
import React, { useEffect, memo } from 'react';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// local dependencies
import StockList from './StockList';
import ShoppingPDF from './ShoppingPDF';
import Header from 'components/Header';
import { ROUTES } from 'constants/routes';
import ShoppingList from './ShoppingList';
import ChooseAddress from './ChooseAddress';
import ConfirmShopping from './ConfirmShopping';
import { SHOPPING_STATUS } from 'constants/spec';
import ChooseGroceryStore from './ChooseGroceryStore';
import { useAppDispatch, useAppSelector } from 'store';
import ShoppingPreferences from './ShoppingPreferences';
import { resetShopping } from 'store/slices/shoppingSlice';
import { VideoScreen } from 'screens/privateScreens/Library';
import { QuestionScreen } from 'screens/privateScreens/Question';
import { useGetShoppingListStatusQuery } from 'store/api/shoppingApi';

const Stack = createNativeStackNavigator();

interface ShoppingProps {
    route?: any;
}

const Shopping: React.FC<ShoppingProps> = ({ route }) => {
    const dispatch = useAppDispatch();
    const isFocused = useIsFocused();
    const drawerNavigation = useNavigation<any>();
    const submittedShoppingList = useAppSelector(state => state.app?.user?.submittedShoppingList);

    const { data: statusData, isLoading } = useGetShoppingListStatusQuery(undefined, {
        skip: !isFocused,
    });

    useEffect(() => {
        if (!isFocused) {
            dispatch(resetShopping());
        }
    }, [isFocused, dispatch]);

    // Determine initial route based on status
    const getInitialRoute = () => {
        if (submittedShoppingList || (statusData?.status && statusData.status !== SHOPPING_STATUS.PENDING)) {
            return ROUTES.SHOPPING_LIST;
        }
        return ROUTES.SHOPPING_PREFERENCES;
    };

    const renderHeader = (title: string, isRootScreen = false) => (headerProps: any) => (
        <Header
            title={title}
            showHamburger
            isRootScreen={isRootScreen}
            navigation={headerProps.navigation}
            onHamburgerPress={() => drawerNavigation.openDrawer?.()}
        />
    );

    if (isLoading) {
        return null;
    }

    return (
        <Stack.Navigator initialRouteName={getInitialRoute()}>
            <Stack.Screen
                component={ShoppingList}
                name={ROUTES.SHOPPING_LIST}
                initialParams={route?.params}
                options={{ header: renderHeader('Shopping List', true) }}
            />
            <Stack.Screen
                component={ShoppingPDF}
                name={ROUTES.SHOPPING_PDF}
                options={{ header: renderHeader('Download File') }}
            />
            <Stack.Screen
                component={StockList}
                name={ROUTES.STOCK_LIST}
                options={{ header: renderHeader('Stock List') }}
            />
            <Stack.Screen
                component={ShoppingPreferences}
                name={ROUTES.SHOPPING_PREFERENCES}
                options={{ header: renderHeader('Shopping Preferences', true) }}
            />
            <Stack.Screen
                component={ChooseGroceryStore}
                name={ROUTES.CHOOSE_GROCERY_STORE}
                options={{ header: renderHeader('Shopping List') }}
            />
            <Stack.Screen
                component={ChooseAddress}
                name={ROUTES.CHOOSE_ADDRESS}
                options={{ header: renderHeader('Shopping List') }}
            />
            <Stack.Screen
                component={ConfirmShopping}
                name={ROUTES.CONFIRM_SHOPPING}
                options={{ header: renderHeader('Shopping List') }}
            />
            <Stack.Screen
                name={ROUTES.QUESTION}
                component={QuestionScreen}
                options={{
                    headerShown: false,
                    gestureEnabled: false,
                }}
            />
            <Stack.Screen
                name={ROUTES.VIDEO}
                component={VideoScreen}
                options={{ header: renderHeader('Video') }}
            />
        </Stack.Navigator>
    );
};

export default memo(Shopping);
