// outsource dependencies
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import Header from 'components/Header';
import { ROUTES } from 'constants/routes';
import MyResultsScreen from 'screens/privateScreens/MyResultsScreen';
import AllRecordedDataScreen from 'screens/privateScreens/AllRecordedDataScreen';
import MeasurementChartScreen from 'screens/privateScreens/MeasurementChartScreen';

const Stack = createNativeStackNavigator();

const MyResultsStack: React.FC = () => {
    const renderHeader = (title: string, isRootScreen = false) => (headerProps: any) => (
        <Header
            title={title}
            showHamburger
            isRootScreen={isRootScreen}
            navigation={headerProps.navigation}
            onHamburgerPress={() => headerProps.navigation.openDrawer()}
        />
    );

    return (
        <Stack.Navigator>
            <Stack.Screen
                name="MyResultsList"
                component={MyResultsScreen}
                options={{
                    header: renderHeader('My Results', true),
                }}
            />
            <Stack.Screen
                name={ROUTES.MEASUREMENT_CHART}
                component={MeasurementChartScreen}
                options={{
                    header: renderHeader('Measurement'),
                }}
            />
            <Stack.Screen
                name="AllRecordedData"
                component={AllRecordedDataScreen}
                options={{
                    header: renderHeader('All Recorded Data'),
                }}
            />
        </Stack.Navigator>
    );
};

export default MyResultsStack;

