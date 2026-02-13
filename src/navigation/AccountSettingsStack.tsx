// outsource dependencies
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// local dependencies
import Header from 'components/Header';
import { ROUTES } from 'constants/routes.ts';
import FoodAllergies from 'screens/AccountSettingsScreens/FoodAllergies';
import { AddressScreen } from 'screens/AccountSettingsScreens/AddressScreen';
import FoodPreferences from 'screens/AccountSettingsScreens/FoodPreferences';
import AccountSettings from 'screens/AccountSettingsScreens/AccountSettings';
import SettingsScreen from 'screens/AccountSettingsScreens/SettingsScreen.tsx';
import ChangePasswordScreen from 'screens/AccountSettingsScreens/ChangePasswordScreen.tsx';
import { BiometricSettingsScreen } from 'screens/AccountSettingsScreens/BiometricSettingsScreen';
import { PersonalInformationScreen } from 'screens/AccountSettingsScreens/PersonalInformationScreen.tsx';

const Stack = createStackNavigator();

const renderHeader = (title: string) => (headerProps: any) => (
    <Header
        title={title}
        navigation={headerProps.navigation}
    />
);

export const AccountSettingsStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name={ROUTES.SETTINGS}
                component={SettingsScreen}
                options={{ header: renderHeader('Settings') }}
            />
            <Stack.Screen
                name={ROUTES.ADDRESS}
                component={AddressScreen}
                options={{ header: renderHeader('My Addresses') }}
            />
            <Stack.Screen
                name={ROUTES.CHANGE_PASSWORD}
                component={ChangePasswordScreen}
                options={{ header: renderHeader('Change Password') }}
            />
            <Stack.Screen
                name={ROUTES.PERSONAL_INFORMATION}
                component={PersonalInformationScreen}
                options={{ header: renderHeader('Personal Information') }}
            />
            <Stack.Screen
                component={AccountSettings}
                name={ROUTES.ACCOUNT_SETTINGS}
                options={{ header: renderHeader('Account Settings') }}
            />
            <Stack.Screen
                name={ROUTES.BIOMETRIC_SETTINGS}
                component={BiometricSettingsScreen}
                options={{ header: renderHeader('Biometric Authentication') }}
            />
            <Stack.Screen
                component={FoodPreferences}
                name={ROUTES.FOOD_PREFERENCES}
                options={{ header: renderHeader('Food Preferences') }}
            />
            <Stack.Screen
                component={FoodAllergies}
                name={ROUTES.FOOD_ALLERGIES}
                options={{ header: renderHeader('Food Allergies') }}
            />
        </Stack.Navigator>
    );
};
