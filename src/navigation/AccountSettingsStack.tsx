// outsource dependencies
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// local dependencies
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { ROUTES } from 'constants/routes.ts';
import BackButton from 'components/BackButton.tsx';
import { AddressScreen } from 'screens/AccountSettingsScreens/AddressScreen';
import FoodPreferences from 'screens/AccountSettingsScreens/FoodPreferences';
import SettingsScreen from 'screens/AccountSettingsScreens/SettingsScreen.tsx';
import { PersonalInformationScreen } from 'screens/AccountSettingsScreens/PersonalInformationScreen.tsx';

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
                component={SettingsScreen}
                name={ROUTES.ACCOUNT_SETTINGS}
                options={{ title: 'Account Settings' }}
            />
            <Stack.Screen
                name={ROUTES.ADDRESS}
                component={AddressScreen}
                options={{ title: 'My Addresses' }}
            />
            <Stack.Screen
                name={ROUTES.PERSONAL_INFORMATION}
                component={PersonalInformationScreen}
                options={{ title: 'Personal Information' }}
            />
            <Stack.Screen
                component={FoodPreferences}
                name={ROUTES.FOOD_PREFERENCES}
                options={{ title: 'Food Preferences' }}
            />
        </Stack.Navigator>
    );
};
