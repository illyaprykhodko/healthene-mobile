// outsource dependencies
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// local dependencies
import { useTheme } from 'hooks/useTheme.ts';
import SettingsScreen from 'screens/AccountSettingsScreens/SettingsScreen.tsx';
import BackButton from 'components/BackButton.tsx';
import { OFFSET } from 'constants/offset.ts';

const Stack = createStackNavigator();

export const AccountSettingsStack = () => {
    const theme = useTheme();
    return (
        <Stack.Navigator
            screenOptions={({ navigation }) => ({
                headerShown: true,
                headerLeft: () => (
                    <BackButton navigation={navigation} theme={theme} />
                ),
                headerTintColor: theme.colors.white,
                headerStyle: {
                    backgroundColor: theme.colors.primary,
                },
                headerLeftContainerStyle: {
                    paddingLeft: OFFSET.HORIZONTAL,
                },
                headerTitleStyle: {
                    fontWeight: '600'
                },
            })}
        >
            <Stack.Screen
                name="SettingsScreen"
                options={{
                    title: 'Account Settings',
                }}
                component={SettingsScreen}
            />
        </Stack.Navigator>
    );
};
