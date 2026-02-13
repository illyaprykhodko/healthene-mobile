// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import Header from 'components/Header';
import { ROUTES } from 'constants/routes';
import { FavoritesScreen, CuisineListScreen } from 'screens/privateScreens/CuisineDistribution';

const Stack = createNativeStackNavigator();

const CuisineDistributionStack: React.FC = () => {
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
        <Stack.Navigator initialRouteName={ROUTES.CUISINE_DISTRIBUTION_FAVORITES}>
            <Stack.Screen
                component={FavoritesScreen}
                name={ROUTES.CUISINE_DISTRIBUTION_FAVORITES}
                options={{ header: renderHeader('International Cuisine', true) }}
            />
            <Stack.Screen
                component={CuisineListScreen}
                name={ROUTES.CUISINE_DISTRIBUTION_LIST}
                options={{ header: renderHeader('International Cuisine') }}
            />
        </Stack.Navigator>
    );
};

export default CuisineDistributionStack;
