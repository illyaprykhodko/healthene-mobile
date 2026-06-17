// outsource dependencies
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// local dependencies
import { SignIn } from 'screens/SignIn';
import { ROUTES } from 'constants/routes';
import StackHeader from 'components/StackHeader';
import { ForgotPasswordScreen } from 'screens/ForgotPassword';
import { TermsAndConditions } from 'screens/TermsAndConditions';

const Stack = createStackNavigator();

const renderHeader = (headerProps: any) => (
    <StackHeader
        backLabel={null}
        showBack={!!headerProps.back}
        title={headerProps.options.title}
        onBack={() => headerProps.navigation.goBack()}
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
                options={{
                    headerShown: true,
                    header: renderHeader,
                    title: 'Term and Conditions',
                }}
            />
        </Stack.Navigator>
    );
};
