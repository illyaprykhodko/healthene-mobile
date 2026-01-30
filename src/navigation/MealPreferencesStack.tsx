// outsource dependencies
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import BackButton from 'components/BackButton';
import { Hamburger } from 'components/Hamburger';
import { RootStackParamList } from 'services/navigation';
import { MealsListScreen, PreferencesListScreen } from 'screens/privateScreens/MealPreferences';

const Stack = createNativeStackNavigator<RootStackParamList>();
// const Stack = createNativeStackNavigator();

const MealPreferencesStack: React.FC = () => {
    const theme = useTheme();

    return (
        <Stack.Navigator
            initialRouteName={ROUTES.MEAL_PREFERENCES_MEALS_LIST}
            screenOptions={({ navigation }) => ({
                headerShown: true,
                headerStyle: {
                    backgroundColor: theme.colors.primary,
                },
                headerTintColor: theme.colors.white,
                headerTitleStyle: {
                    fontWeight: '600',
                },
                headerLeftContainerStyle: {
                    paddingLeft: OFFSET.HORIZONTAL,
                },
                headerRightContainerStyle: {
                    paddingRight: OFFSET.HORIZONTAL,
                },
                headerLeft: () => (
                    <BackButton navigation={navigation} theme={theme} />
                ),
                headerRight: () => (
                    <Hamburger onPress={() => (navigation as any).openDrawer?.()} /> // TODO: fix this
                ),
            })}
        >
            <Stack.Screen
                component={MealsListScreen}
                name={ROUTES.MEAL_PREFERENCES_MEALS_LIST}
                options={{
                    title: 'Meal Preferences',
                }}
            />
            <Stack.Screen
                component={PreferencesListScreen}
                name={ROUTES.MEAL_PREFERENCES_LIST}
                options={({ route }) => ({
                    title: route.params?.item?.name || 'Meal Preferences',
                })}
            />
        </Stack.Navigator>
    );
};

export default MealPreferencesStack;
