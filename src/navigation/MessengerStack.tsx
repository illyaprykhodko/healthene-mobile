// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// local dependencies
import Header from 'components/Header';
import { ROUTES } from 'constants/routes.ts';
import { MessageEntity } from 'types/common/interfaces.ts';
import MessengerList from 'screens/privateScreens/Messenger';
import AudioScreen from 'screens/privateScreens/Messenger/AudioScreen.tsx';
import CameraScreen from 'screens/privateScreens/Messenger/CameraScreen.tsx';
import ReadMessageScreen from 'screens/privateScreens/Messenger/ReadMessageScreen.tsx';
import WriteMessageScreen from 'screens/privateScreens/Messenger/WriteMessageScreen.tsx';

const Stack = createStackNavigator();
const MessengerStack = () => {
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
        <Stack.Navigator initialRouteName={ROUTES.MESSAGE_LIST}>
            <Stack.Screen name={ROUTES.MESSAGE_LIST} component={MessengerList} options={{ header: renderHeader('Messages', true) }} />
            <Stack.Screen name={ROUTES.MESSENGER_CAMERA} component={CameraScreen} options={{ header: renderHeader('Camera') }} />
            <Stack.Screen name={ROUTES.READ_MESSAGE} component={ReadMessageScreen} options={{ header: renderHeader('Messages') }} />
            <Stack.Screen name={ROUTES.MESSENGER_AUDIO} component={AudioScreen} options={{ header: renderHeader('Record Audio') }} />
            <Stack.Screen
                name={ROUTES.WRITE_MESSAGE} component={WriteMessageScreen}
                options={({ route }: {route: { params?: MessageEntity }}) => ({
                    header: (headerProps: any) => (
                        <Header
                            title={route.params?.id ? 'Message' : 'New Message'}
                            showHamburger
                            navigation={headerProps.navigation}
                            onHamburgerPress={() => drawerNavigation.openDrawer?.()}
                        />
                    ),
                })}
            />
        </Stack.Navigator>
    );
};

export default MessengerStack;

