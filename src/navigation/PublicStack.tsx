// outsource dependencies
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// local dependencies
import { SignIn } from 'screens/SignIn';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import BackButton from 'components/BackButton.tsx';
import { ForgotPasswordScreen } from 'screens/ForgotPassword';
import { TermsAndConditions } from 'screens/TermsAndConditions';

const Stack = createStackNavigator();

export const PublicStack = () => {
    const theme = useTheme();
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
                options={({ navigation }) => ({
                    headerShown: true,
                    title: 'Term and Conditions',
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
            />
        </Stack.Navigator>
    );
};
