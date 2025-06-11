import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ROUTES } from '../constants/routes';
import { SignIn } from '../screens/SignIn';
import { SignUp } from '../screens/SignUp';
// import { ForgotPasswordScreen } from '../screens/ForgotPassword';

// Temporary placeholder for SignUp screen
const SignUpScreen = () => null;

const Stack = createStackNavigator();

export const PublicStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name={ROUTES.SIGN_IN} component={SignIn} />
            {/* <Stack.Screen name={ROUTES.SIGN_UP} component={SignUp} /> */}
            {/* <Stack.Screen
        name={ROUTES.FORGOT_PASSWORD}
        component={ForgotPasswordScreen}
        options={{ title: 'Forgot Password' }}
      /> */}
        </Stack.Navigator>
    );
};
