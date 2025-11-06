// outsource dependencies
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// local dependencies
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
            <Stack.Screen name="AccountSettings" component={AccountSettingsStack} />
        </Stack.Navigator>
    );
};
