// outsource dependencies
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// local dependencies
import MessengerList from 'screens/privateScreens/Messenger';

const Stack = createStackNavigator();
const MessengerStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="MessengerList" component={MessengerList} />
        </Stack.Navigator>
    );
};

export default MessengerStack;

