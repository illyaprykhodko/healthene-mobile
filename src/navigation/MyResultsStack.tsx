// outsource dependencies
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import { ROUTES } from 'constants/routes';
import StackHeader from 'components/StackHeader';
import MyResultsScreen from 'screens/privateScreens/MyResultsScreen';
import AllRecordedDataScreen from 'screens/privateScreens/AllRecordedDataScreen';
import MeasurementChartScreen from 'screens/privateScreens/MeasurementChartScreen';

const Stack = createNativeStackNavigator();

const renderCustomHeader = (options?: { showBackButton?: boolean }) =>
    (headerProps: any) => (
        <StackHeader
            title={headerProps.options.title}
            showBack={options?.showBackButton !== false}
            onBack={() => headerProps.navigation.goBack()}
            onOpenDrawer={() => headerProps.navigation.openDrawer()}
        />
    );

const MyResultsStack: React.FC = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="MyResultsList"
                component={MyResultsScreen}
                options={{
                    title: 'My Results',
                    header: renderCustomHeader({ showBackButton: true }),
                }}
            />
            <Stack.Screen
                name={ROUTES.MEASUREMENT_CHART}
                component={MeasurementChartScreen}
                options={{
                    title: 'Measurement',
                    header: renderCustomHeader(),
                }}
            />
            <Stack.Screen
                name="AllRecordedData"
                component={AllRecordedDataScreen}
                options={{
                    title: 'All Recorded Data',
                    header: renderCustomHeader(),
                }}
            />
        </Stack.Navigator>
    );
};

export default MyResultsStack;

