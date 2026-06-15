// outsource dependencies
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// local dependencies
import { ROUTES } from 'constants/routes.ts';
import StackHeader from 'components/StackHeader';
import FoodAllergies from 'screens/AccountSettingsScreens/FoodAllergies';
import { AddressScreen } from 'screens/AccountSettingsScreens/AddressScreen';
import FoodPreferences from 'screens/AccountSettingsScreens/FoodPreferences';
import AccountSettings from 'screens/AccountSettingsScreens/AccountSettings';
import SettingsScreen from 'screens/AccountSettingsScreens/SettingsScreen.tsx';
import AppearanceScreen from 'screens/AccountSettingsScreens/AppearanceScreen';
import NotificationsScreen from 'screens/AccountSettingsScreens/NotificationsScreen';
import AnimationSettingsScreen from 'screens/AccountSettingsScreens/AnimationSettings';
import ChangePasswordScreen from 'screens/AccountSettingsScreens/ChangePasswordScreen.tsx';
import { BiometricSettingsScreen } from 'screens/AccountSettingsScreens/BiometricSettingsScreen';
import { PersonalInformationScreen } from 'screens/AccountSettingsScreens/PersonalInformationScreen.tsx';

const Stack = createStackNavigator();

const renderHeader = (headerProps: any) => (
    <StackHeader
        title={headerProps.options.title}
        showBack={!!headerProps.back}
        onBack={() => headerProps.navigation.goBack()}
    />
);

export const AccountSettingsStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: true,
                header: renderHeader,
            }}
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
                name={ROUTES.NOTIFICATIONS}
                component={NotificationsScreen}
                options={{ title: 'Notification settings' }}
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
            <Stack.Screen
                name={ROUTES.ANIMATION_SETTINGS}
                component={AnimationSettingsScreen}
                options={{ title: 'Animation Settings' }}
            />
            <Stack.Screen
                name={ROUTES.APPEARANCE_SETTINGS}
                component={AppearanceScreen}
                options={{ title: 'Appearance' }}
            />
        </Stack.Navigator>
    );
};
