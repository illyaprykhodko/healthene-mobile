// outsource dependencies
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import BackButton from 'components/BackButton';
import { Hamburger } from 'components/Hamburger';
import { FavoritesScreen, CuisineListScreen } from 'screens/privateScreens/CuisineDistribution';

const Stack = createNativeStackNavigator();

const CuisineDistributionStack: React.FC = () => {
    const theme = useTheme();

    return (
        <Stack.Navigator
            initialRouteName={ROUTES.CUISINE_DISTRIBUTION_FAVORITES}
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
                name={ROUTES.CUISINE_DISTRIBUTION_FAVORITES}
                component={FavoritesScreen}
                options={{
                    title: 'International Cuisine',
                }}
            />
            <Stack.Screen
                name={ROUTES.CUISINE_DISTRIBUTION_LIST}
                component={CuisineListScreen}
                options={{
                    title: 'International Cuisine',
                }}
            />
        </Stack.Navigator>
    );
};

export default CuisineDistributionStack;

