// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// local dependencies
import BackBtn from 'components/BackBtn';
import { ROUTES } from 'constants/routes.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { Hamburger } from 'components/Hamburger';
import { MessageEntity } from 'types/common/interfaces.ts';
import MessengerList from 'screens/privateScreens/Messenger';
import AudioScreen from 'screens/privateScreens/Messenger/AudioScreen.tsx';
import CameraScreen from 'screens/privateScreens/Messenger/CameraScreen.tsx';
import ReadMessageScreen from 'screens/privateScreens/Messenger/ReadMessageScreen.tsx';
import WriteMessageScreen from 'screens/privateScreens/Messenger/WriteMessageScreen.tsx';
import SelectRecipientScreen from 'screens/privateScreens/Messenger/SelectRecipientScreen.tsx';

const Stack = createStackNavigator();
const MessengerStack = () => {
    const theme = useTheme();
    const drawerNavigation = useNavigation<any>();

    return (
        <Stack.Navigator
            initialRouteName={ROUTES.MESSAGE_LIST}
            screenOptions={({ navigation }) => ({
                headerShown: true,
                drawerPosition: 'right',
                gestureDirection: 'horizontal-inverted',
                headerLeft: () => <BackBtn onPress={() => navigation.goBack()} color={theme.colors.white} />,
                headerRight: () => <Hamburger style={{ marginRight: OFFSET.HORIZONTAL }} onPress={() => drawerNavigation.openDrawer?.()} />,
                headerStyle: {
                    backgroundColor: theme.colors.headerBg,
                },
                headerTintColor: theme.colors.headerText,
                headerTitleStyle: {
                    fontWeight: '600'
                },
                headerTitleAlign: 'center',
                headerLeftContainerStyle: {
                    minWidth: 70,
                },
                headerRightContainerStyle: {
                    minWidth: 70,
                },
            })}
        >
            <Stack.Screen options={{ title: 'Messages' }} name={ROUTES.MESSAGE_LIST} component={MessengerList} />
            <Stack.Screen options={{ title: 'Camera' }} name={ROUTES.MESSENGER_CAMERA} component={CameraScreen} />
            <Stack.Screen options={{ title: 'Messages' }} name={ROUTES.READ_MESSAGE} component={ReadMessageScreen} />
            <Stack.Screen options={{ title: 'Record Audio' }} name={ROUTES.MESSENGER_AUDIO} component={AudioScreen} />
            <Stack.Screen
                name={ROUTES.WRITE_MESSAGE}
                component={WriteMessageScreen}
                options={({ route }: {route: { params?: MessageEntity }}) => ({ title: route.params?.id ? 'Message' : 'New Message' })}
            />
            <Stack.Screen
                name={ROUTES.SELECT_RECIPIENT}
                component={SelectRecipientScreen}
                options={{ title: 'Select Recipient' }}
            />
        </Stack.Navigator>
    );
};

export default MessengerStack;

