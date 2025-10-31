// outsource dependencies
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// local dependencies
import { PrivateDrawer } from './PrivateDrawer';

const Stack = createStackNavigator();
console.log('PrivateDrawer', PrivateDrawer)
export const PrivateStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Drawer" component={PrivateDrawer} />
        </Stack.Navigator>
    );
};
