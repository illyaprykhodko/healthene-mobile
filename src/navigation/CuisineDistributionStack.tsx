// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import BackBtn from 'components/BackBtn';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { Hamburger } from 'components/Hamburger';
import { FavoritesScreen, CuisineListScreen } from 'screens/privateScreens/CuisineDistribution';

const Stack = createNativeStackNavigator();

const CuisineDistributionStack: React.FC = () => {
    const theme = useTheme();
    const drawerNavigation = useNavigation<any>();

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
                headerTitleAlign: 'center',
                headerLeft: () => (
                    <BackBtn onPress={() => navigation.goBack()} color={theme.colors.white} />
                ),
                headerRight: () => (
                    <Hamburger onPress={() => drawerNavigation.openDrawer?.()} />
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
