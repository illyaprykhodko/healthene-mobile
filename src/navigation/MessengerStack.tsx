// outsource dependencies
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// local dependencies
import { ROUTES } from 'constants/routes.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import BackButton from 'components/BackButton.tsx';
import { MessageEntity } from 'types/common/interfaces.ts';
import MessengerList from 'screens/privateScreens/Messenger';
import CameraScreen from 'screens/privateScreens/Messenger/CameraScreen.tsx';
import ReadMessageScreen from 'screens/privateScreens/Messenger/ReadMessageScreen.tsx';
import WriteMessageScreen from 'screens/privateScreens/Messenger/WriteMessageScreen.tsx';

const Stack = createStackNavigator();
const MessengerStack = () => {
    const theme = useTheme();
    return (
        <Stack.Navigator
            initialRouteName={ROUTES.MESSAGE_LIST}
            screenOptions={({ navigation }) => ({
                headerShown: true,
                drawerPosition: 'right',
                gestureDirection: 'horizontal-inverted',
                headerLeft: () => <BackButton navigation={navigation} theme={theme} />,
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
            <Stack.Screen options={{ title: 'Camera' }} name={ROUTES.CAMERA_SCREEN} component={CameraScreen} />
            <Stack.Screen options={{ title: 'Messages' }} name={ROUTES.MESSAGE_LIST} component={MessengerList} />
            <Stack.Screen options={{ title: 'Messages' }} name={ROUTES.READ_MESSAGE_SCREEN} component={ReadMessageScreen} />
            <Stack.Screen
                name={ROUTES.WRITE_MESSAGE_SCREEN} component={WriteMessageScreen}
                options={({ route }: {route: { params?: MessageEntity }}) => ({ title: route.params?.id ? 'Message' : 'New Message' })}
            />
        </Stack.Navigator>
    );
};

export default MessengerStack;

