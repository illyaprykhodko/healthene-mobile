// outsource dependencies
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// local dependencies
import Header from 'components/Header';
import { SignIn } from 'screens/SignIn';
import { ROUTES } from 'constants/routes';
import { ForgotPasswordScreen } from 'screens/ForgotPassword';
import { TermsAndConditions } from 'screens/TermsAndConditions';

const Stack = createStackNavigator();

const renderHeader = (title: string) => (headerProps: any) => (
    <Header
        title={title}
        navigation={headerProps.navigation}
    />
);

export const PublicStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name={ROUTES.SIGN_IN} component={SignIn} />
            <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
            <Stack.Screen
                component={TermsAndConditions}
                name={ROUTES.TERMS_AND_CONDITIONS}
                options={{ header: renderHeader('Term and Conditions') }}
            />
        </Stack.Navigator>
    );
};
