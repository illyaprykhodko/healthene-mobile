// outsource dependencies
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// local dependencies
import CommunicationScreen from 'screens/privateScreens/CommunicationScreen';

const Stack = createStackNavigator();
const CommunicationStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="CommunicationList" component={CommunicationScreen} />
        </Stack.Navigator>
    );
};

export default CommunicationStack;

