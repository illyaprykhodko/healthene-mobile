// outsource dependencies
import React, { useEffect, memo } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// local dependencies
import StockList from './StockList';
import ShoppingPDF from './ShoppingPDF';
import BackBtn from 'components/BackBtn';
import { ROUTES } from 'constants/routes';
import { COLORS } from 'constants/colors';
import ShoppingList from './ShoppingList';
import ChooseAddress from './ChooseAddress';
import ConfirmShopping from './ConfirmShopping';
import { Hamburger } from 'components/Hamburger';
import { SHOPPING_STATUS } from 'constants/spec';
import ChooseGroceryStore from './ChooseGroceryStore';
import { useAppDispatch, useAppSelector } from 'store';
import ShoppingPreferences from './ShoppingPreferences';
import { VideoScreen } from 'screens/privateScreens/Library';
import { QuestionScreen } from 'screens/privateScreens/Question';
import { useGetShoppingListStatusQuery } from 'store/api/shoppingApi';
import { resetShopping, selectShopping } from 'store/slices/shoppingSlice';

const Stack = createNativeStackNavigator();

const screenOptions = {
    headerStyle: { backgroundColor: COLORS.THEME_COLOR },
    headerTintColor: COLORS.WHITE,
    headerTitleStyle: { fontWeight: '600' as const },
    headerTitleAlign: 'center' as const,
};

interface ShoppingProps {
    route?: any;
}

const Shopping: React.FC<ShoppingProps> = ({ route }) => {
    const dispatch = useAppDispatch();
    const isFocused = useIsFocused();
    const { initialized, status } = useAppSelector(selectShopping);
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

    if (isLoading) {
        return null;
    }

    return (
        <Stack.Navigator
            initialRouteName={getInitialRoute()}
            screenOptions={({ navigation }) => ({
                ...screenOptions,
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                headerRight: () => <Hamburger onPress={() => (navigation as any).openDrawer?.()} />,
                headerLeft: () => <BackBtn onPress={() => navigation.goBack()} />,
            })}
        >
            <Stack.Screen
                component={ShoppingList}
                name={ROUTES.SHOPPING_LIST}
                initialParams={route?.params}
                options={{
                    title: 'Shopping List',
                    headerBackVisible: false,
                }}
            />
            <Stack.Screen
                component={ShoppingPDF}
                name={ROUTES.SHOPPING_PDF}
                options={{
                    title: 'Download File',
                    headerTitleStyle: { fontSize: 18 },
                }}
            />
            <Stack.Screen
                component={StockList}
                name={ROUTES.STOCK_LIST}
                options={{
                    title: 'Stock List',
                    headerTitleStyle: { fontSize: 18 },
                }}
            />
            <Stack.Screen
                component={ShoppingPreferences}
                name={ROUTES.SHOPPING_PREFERENCES}
                options={{
                    title: 'Shopping Preferences',
                    headerTitleStyle: { fontSize: 18 },
                }}
            />
            <Stack.Screen
                component={ChooseGroceryStore}
                name={ROUTES.CHOOSE_GROCERY_STORE}
                options={{
                    title: 'Shopping List',
                    headerTitleStyle: { fontSize: 18 },
                }}
            />
            <Stack.Screen
                component={ChooseAddress}
                name={ROUTES.CHOOSE_ADDRESS}
                options={{
                    title: 'Shopping List',
                    headerTitleStyle: { fontSize: 18 },
                }}
            />
            <Stack.Screen
                component={ConfirmShopping}
                name={ROUTES.CONFIRM_SHOPPING}
                options={{
                    title: 'Shopping List',
                    headerTitleStyle: { fontSize: 18 },
                }}
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
                options={{
                    title: 'Video',
                    headerTitleStyle: { fontSize: 18 },
                }}
            />
        </Stack.Navigator>
    );
};

export default memo(Shopping);
