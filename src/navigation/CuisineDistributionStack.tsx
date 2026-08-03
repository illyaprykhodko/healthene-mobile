// outsource dependencies
import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import { ROUTES } from 'constants/routes';
import {
    useReviewAlert,
    FavoritesScreen,
    CuisineListScreen,
    ReviewAlertProvider,
} from 'screens/privateScreens/CuisineDistribution';

const Stack = createNativeStackNavigator();

const CuisineDistributionNavigator: React.FC = () => {
    const { resetSession } = useReviewAlert();

    useFocusEffect(
        useCallback(() => () => resetSession(), [resetSession])
    );

    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={ROUTES.CUISINE_DISTRIBUTION_FAVORITES}
        >
            <Stack.Screen
                component={FavoritesScreen}
                name={ROUTES.CUISINE_DISTRIBUTION_FAVORITES}
            />
            <Stack.Screen
                component={CuisineListScreen}
                name={ROUTES.CUISINE_DISTRIBUTION_LIST}
            />
        </Stack.Navigator>
    );
};

const CuisineDistributionStack: React.FC = () => (
    <ReviewAlertProvider>
        <CuisineDistributionNavigator />
    </ReviewAlertProvider>
);

export default CuisineDistributionStack;
