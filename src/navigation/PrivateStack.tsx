// outsource dependencies
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// local dependencies
import { ROUTES } from 'constants/routes.ts';
import { PrivateDrawer } from './PrivateDrawer';
import { AccountSettingsStack } from 'navigation/AccountSettingsStack.tsx';

const Stack = createStackNavigator();

export const PrivateStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Drawer" component={PrivateDrawer} />
            <Stack.Screen name={ROUTES.SETTINGS} component={AccountSettingsStack} />
        </Stack.Navigator>
    );
};
