// outsource dependencies
import React from 'react';
import { enableScreens } from 'react-native-screens';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DefaultTheme, DarkTheme, Theme as NavTheme } from '@react-navigation/native';
// local dependencies
import { navigationIntegration } from '../../App';
import { PUBLIC, PRIVATE } from 'constants/routes';
import { SplashScreen } from 'components/SplashScreen';
import { useThemeContext } from 'providers/ThemeProvider';
import { RootStackParamList, navigationRef } from 'services/navigation';
// hooks
import { useAuth } from 'hooks/useAuth';
import { RootState, useAppSelector } from 'store';
// navigation
import { linking } from './linking';
import { PublicStack } from './PublicStack';
import { PrivateStack } from './PrivateStack';

enableScreens();
const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator () {
    const { isLoading } = useAuth();
    const { theme, isDark } = useThemeContext();
    const isAuthenticated = useAppSelector((state: RootState) => state.app.auth);

    // Drive React Navigation's container theme from our palette so transition
    // backgrounds match (no white flash in dark mode).
    const navTheme: NavTheme = {
        ...(isDark ? DarkTheme : DefaultTheme),
        colors: {
            ...(isDark ? DarkTheme : DefaultTheme).colors,
            text: theme.colors.text,
            card: theme.colors.surface,
            border: theme.colors.border,
            primary: theme.colors.primary,
            background: theme.colors.background,
        },
    };

    if (isLoading) {
        return <SplashScreen onFinish={() => {}} />;
    }

    return (
        <NavigationContainer
            theme={navTheme}
            linking={linking}
            ref={navigationRef}
            onReady={() => {
                navigationIntegration.registerNavigationContainer(navigationRef);
            }}
        >
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                {isAuthenticated ? (
                    <Stack.Screen name={PRIVATE} component={PrivateStack} />
                ) : (
                    <Stack.Screen name={PUBLIC} component={PublicStack} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
