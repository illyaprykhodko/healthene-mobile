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
import AudioScreen from 'screens/privateScreens/Messenger/AudioScreen.tsx';
import CameraScreen from 'screens/privateScreens/Messenger/CameraScreen.tsx';
import ReadMessageScreen from 'screens/privateScreens/Messenger/ReadMessageScreen.tsx';
import WriteMessageScreen from 'screens/privateScreens/Messenger/WriteMessageScreen.tsx';
import HealthProfile from 'screens/privateScreens/HealthProfile';

const Stack = createStackNavigator();
const healthProfileStack = () => {
    const theme = useTheme();
    return (
        <Stack.Navigator
            initialRouteName={ROUTES.HEALTH_PROFILE}
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
            <Stack.Screen name={ROUTES.HEALTH_PROFILE} component={HealthProfile} />
        </Stack.Navigator>
    );
};

export default healthProfileStack;

