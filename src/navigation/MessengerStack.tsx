// outsource dependencies
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// local dependencies
import { ROUTES } from 'constants/routes.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import BackButton from 'components/BackButton.tsx';
import MessengerList from 'screens/privateScreens/Messenger';
import WriteMessageScreen from 'screens/privateScreens/Messenger/WriteMessageScreen.tsx';

const Stack = createStackNavigator();
const MessengerStack = () => {
    const theme = useTheme();
    return (
        <Stack.Navigator
            screenOptions={({ navigation }) => ({
                headerShown: true,
                drawerPosition: 'right',
                gestureDirection: 'horizontal-inverted',
                headerLeft: () => (
                    <BackButton navigation={navigation} theme={theme} />
                ),
                headerStyle: {
                    backgroundColor: theme.colors.primary,
                },
                headerTintColor: theme.colors.white,
                headerLeftContainerStyle: {
                    paddingLeft: OFFSET.HORIZONTAL,
                },
                headerTitleStyle: {
                    fontWeight: '600'
                },
            })}
        >
            <Stack.Screen options={{ title: 'Messages' }} name={ROUTES.MESSAGE_LIST} component={MessengerList} />
            <Stack.Screen options={{ title: 'Message' }} name={ROUTES.WRITE_MESSAGE_SCREEN} component={WriteMessageScreen} />
        </Stack.Navigator>
    );
};

export default MessengerStack;

