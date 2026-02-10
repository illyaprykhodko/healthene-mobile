// outsource dependencies
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// local dependencies
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { ROUTES } from 'constants/routes.ts';
import BackButton from 'components/BackButton.tsx';
import FoodAllergies from 'screens/AccountSettingsScreens/FoodAllergies';
import { AddressScreen } from 'screens/AccountSettingsScreens/AddressScreen';
import FoodPreferences from 'screens/AccountSettingsScreens/FoodPreferences';
import AccountSettings from 'screens/AccountSettingsScreens/AccountSettings';
import SettingsScreen from 'screens/AccountSettingsScreens/SettingsScreen.tsx';
import ChangePasswordScreen from 'screens/AccountSettingsScreens/ChangePasswordScreen.tsx';
import { BiometricSettingsScreen } from 'screens/AccountSettingsScreens/BiometricSettingsScreen';
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
                headerTitleStyle: {
                    fontWeight: '600'
                },
                headerTitleAlign: 'center',
                headerLeftContainerStyle: {
                    paddingLeft: OFFSET.HORIZONTAL,
                },
            })}
        >
            <Stack.Screen
                name={ROUTES.SETTINGS}
                component={SettingsScreen}
                options={{ title: 'Settings' }}
            />
            <Stack.Screen
                name={ROUTES.ADDRESS}
                component={AddressScreen}
                options={{ title: 'My Addresses' }}
            />
            <Stack.Screen
                name={ROUTES.CHANGE_PASSWORD}
                component={ChangePasswordScreen}
                options={{ title: 'Change Password' }}
            />
            <Stack.Screen
                name={ROUTES.PERSONAL_INFORMATION}
                component={PersonalInformationScreen}
                options={{ title: 'Personal Information' }}
            />
            <Stack.Screen
                component={AccountSettings}
                name={ROUTES.ACCOUNT_SETTINGS}
                options={{ title: 'Account Settings' }}
            />
            <Stack.Screen
                name={ROUTES.BIOMETRIC_SETTINGS}
                component={BiometricSettingsScreen}
                options={{ title: 'Biometric Authentication' }}
            />
            <Stack.Screen
                component={FoodPreferences}
                name={ROUTES.FOOD_PREFERENCES}
                options={{ title: 'Food Preferences' }}
            />
            <Stack.Screen
                component={FoodAllergies}
                name={ROUTES.FOOD_ALLERGIES}
                options={{ title: 'Food Allergies' }}
            />
        </Stack.Navigator>
    );
};
