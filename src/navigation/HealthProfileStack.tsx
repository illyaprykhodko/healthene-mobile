// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import Header from 'components/Header';
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
    const drawerNavigation = useNavigation<any>();

    const renderHeader = (title: string, isRootScreen = false) => (headerProps: any) => (
        <Header
            title={title}
            showHamburger
            isRootScreen={isRootScreen}
            navigation={headerProps.navigation}
            onHamburgerPress={() => drawerNavigation.openDrawer?.()}
        />
    );

    return (
        <Stack.Navigator initialRouteName={ROUTES.HEALTH_PROFILE_MAIN}>
            <Stack.Screen
                component={MainInfoScreen}
                name={ROUTES.HEALTH_PROFILE_MAIN}
                options={{ header: renderHeader('My Health Profile', true) }}
            />
            <Stack.Screen
                component={StatsScreen}
                name={ROUTES.HEALTH_PROFILE_STATS}
                options={{ header: renderHeader('My Stats') }}
            />
            <Stack.Screen
                component={MedicationsScreen}
                name={ROUTES.HEALTH_PROFILE_MEDICATIONS}
                options={{ header: renderHeader('Medications') }}
            />
            <Stack.Screen
                component={MedicalProblemsScreen}
                name={ROUTES.HEALTH_PROFILE_MEDICAL_PROBLEMS}
                options={{ header: renderHeader('Medical Problem') }}
            />
            <Stack.Screen
                component={MedicationAllergiesScreen}
                name={ROUTES.HEALTH_PROFILE_MEDICATION_ALLERGIES}
                options={{ header: renderHeader('Medication Allergies') }}
            />
        </Stack.Navigator>
    );
};

export default HealthProfileStack;
