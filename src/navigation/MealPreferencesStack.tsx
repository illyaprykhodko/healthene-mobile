// outsource dependencies
import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import { ROUTES } from 'constants/routes';
import { RootStackParamList } from 'services/navigation';
import {
    useReviewAlert,
    MealsListScreen,
    ReviewAlertProvider,
    PreferencesListScreen,
} from 'screens/privateScreens/MealPreferences';

const Stack = createNativeStackNavigator<RootStackParamList>();

const MealPreferencesNavigator: React.FC = () => {
    const { resetSession } = useReviewAlert();

    useFocusEffect(
        useCallback(() => () => resetSession(), [resetSession])
    );

    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={ROUTES.MEAL_PREFERENCES_MEALS_LIST}
        >
            <Stack.Screen
                component={MealsListScreen}
                name={ROUTES.MEAL_PREFERENCES_MEALS_LIST}
            />
            <Stack.Screen
                component={PreferencesListScreen}
                name={ROUTES.MEAL_PREFERENCES_LIST}
            />
        </Stack.Navigator>
    );
};

const MealPreferencesStack: React.FC = () => (
    <ReviewAlertProvider>
        <MealPreferencesNavigator />
    </ReviewAlertProvider>
);

export default MealPreferencesStack;
