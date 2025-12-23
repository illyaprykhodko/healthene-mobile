// outsource dependencies
import React from 'react';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// local dependencies
import { PUBLIC, PRIVATE } from 'constants/routes';
import { SplashScreen } from 'components/SplashScreen';
import { RootStackParamList, navigationRef } from 'services/navigation';
// hooks
import { useAuth } from 'hooks/useAuth';
import { RootState, useAppSelector } from 'store';
// navigation
import { PublicStack } from './PublicStack';
import { PrivateStack } from './PrivateStack';

enableScreens();
const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator () {
    const { isLoading } = useAuth();
    const isAuthenticated = useAppSelector((state: RootState) => state.app.auth);

    if (isLoading) {
        return <SplashScreen onFinish={() => {}} />;
    }

    return (
        <NavigationContainer ref={navigationRef}>
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
