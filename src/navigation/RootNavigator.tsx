import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../services/navigation/types';
import { ROUTES, PUBLIC_ROUTES, PRIVATE_ROUTES } from '../constants/routes';
import { navigationRef } from '../services/navigation';
import { SignIn } from 'screens/SignIn';
import { ForgotPasswordScreen } from 'screens/ForgotPassword';

// Import screens
// import SignInScreen from '@screens/SignIn';
// import SignUpScreen from '../screens/SignUp';
// import ForgotPasswordScreen from '../screens/ForgotPassword';
// import HomeScreen from '../screens/Home';
// import ProfileScreen from '../screens/Profile';
// import SettingsScreen from '../screens/Settings';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator () {
    const isAuthenticated = useSelector((state: any) => state.app.auth);

    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                {!isAuthenticated ? (
                // Public screens
                    <>
                        <Stack.Screen name={ROUTES.SIGN_IN} component={SignIn} />
                        {/* <Stack.Screen name={ROUTES.SIGN_UP} component={SignUpScreen} /> */}
                        <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
                    </>
                ) : (
                // Private screens
                    <>
                        {/* <Stack.Screen name={ROUTES.HOME} component={HomeScreen} />
            <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
            <Stack.Screen name={ROUTES.SETTINGS} component={SettingsScreen} /> */}
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
