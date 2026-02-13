// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import Header from 'components/Header';
import { ROUTES } from 'constants/routes';
import { RootStackParamList } from 'services/navigation';
import { MealsListScreen, PreferencesListScreen } from 'screens/privateScreens/MealPreferences';

const Stack = createNativeStackNavigator<RootStackParamList>();

const MealPreferencesStack: React.FC = () => {
    const drawerNavigation = useNavigation<any>();

    const renderHeader = (title: string, isRootScreen = false) => (headerProps: any) => (
        <Header
            title={title}
            showHamburger
            isRootScreen={isRootScreen}
            navigation={headerProps.navigation}
            onHamburgerPress={() => drawerNavigation.openDrawer?.()}
        />
    );

    return (
        <Stack.Navigator initialRouteName={ROUTES.MEAL_PREFERENCES_MEALS_LIST}>
            <Stack.Screen
                component={MealsListScreen}
                name={ROUTES.MEAL_PREFERENCES_MEALS_LIST}
                options={{ header: renderHeader('Meal Preferences', true) }}
            />
            <Stack.Screen
                component={PreferencesListScreen}
                name={ROUTES.MEAL_PREFERENCES_LIST}
                options={({ route }) => ({
                    header: (headerProps: any) => (
                        <Header
                            title={route.params?.item?.name || 'Meal Preferences'}
                            showHamburger
                            navigation={headerProps.navigation}
                            onHamburgerPress={() => drawerNavigation.openDrawer?.()}
                        />
                    ),
                })}
            />
        </Stack.Navigator>
    );
};

export default MealPreferencesStack;
