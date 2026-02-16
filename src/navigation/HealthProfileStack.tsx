// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import BackBtn from 'components/BackBtn';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { Hamburger } from 'components/Hamburger';
import {
    StatsScreen,
    MainInfoScreen,
    MedicationsScreen,
    MedicalProblemsScreen,
    MedicationAllergiesScreen,
} from 'screens/privateScreens/HealthProfile';

const Stack = createNativeStackNavigator();

const HealthProfileStack: React.FC = () => {
    const theme = useTheme();
    const drawerNavigation = useNavigation<any>();

    return (
        <Stack.Navigator
            initialRouteName={ROUTES.HEALTH_PROFILE_MAIN}
            screenOptions={({ navigation }) => ({
                headerShown: true,
                headerStyle: {
                    backgroundColor: theme.colors.primary,
                },
                headerTintColor: theme.colors.white,
                headerTitleStyle: {
                    fontWeight: '600',
                },
                headerTitleAlign: 'center',
                headerLeft: () => (
                    <BackBtn onPress={() => navigation.goBack()} color={theme.colors.white} />
                ),
                headerRight: () => (
                    <Hamburger onPress={() => drawerNavigation.openDrawer?.()} />
                ),
            })}
        >
            <Stack.Screen
                component={MainInfoScreen}
                name={ROUTES.HEALTH_PROFILE_MAIN}
                options={{
                    title: 'My Health Profile',
                }}
            />
            <Stack.Screen
                component={StatsScreen}
                name={ROUTES.HEALTH_PROFILE_STATS}
                options={{
                    title: 'My Stats',
                }}
            />
            <Stack.Screen
                component={MedicationsScreen}
                name={ROUTES.HEALTH_PROFILE_MEDICATIONS}
                options={{
                    title: 'Medications',
                }}
            />
            <Stack.Screen
                component={MedicalProblemsScreen}
                name={ROUTES.HEALTH_PROFILE_MEDICAL_PROBLEMS}
                options={{
                    title: 'Medical Problem',
                }}
            />
            <Stack.Screen
                component={MedicationAllergiesScreen}
                name={ROUTES.HEALTH_PROFILE_MEDICATION_ALLERGIES}
                options={{
                    title: 'Medication Allergies',
                }}
            />
        </Stack.Navigator>
    );
};

export default HealthProfileStack;
