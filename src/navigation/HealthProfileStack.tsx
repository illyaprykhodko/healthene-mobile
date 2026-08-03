// outsource dependencies
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import { ROUTES } from 'constants/routes';
import {
    StatsScreen,
    MainInfoScreen,
    MedicationsScreen,
    MedicalProblemsScreen,
    MedicationAllergiesScreen,
} from 'screens/privateScreens/HealthProfile';

const Stack = createNativeStackNavigator();

const HealthProfileStack: React.FC = () => {
    return (
        <Stack.Navigator
            initialRouteName={ROUTES.HEALTH_PROFILE_MAIN}
            screenOptions={{ headerShown: false }}
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
