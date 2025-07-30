// outsource dependencies
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// local dependencies
import { ROUTES } from '../constants/routes';
import HomeScreen from 'screens/privateScreens/Home';

const Stack = createStackNavigator();

export const PrivateStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name={ROUTES.HOME} component={HomeScreen} />
        </Stack.Navigator>
    );
};
