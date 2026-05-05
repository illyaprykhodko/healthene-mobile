// outsource dependencies
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import Text from 'components/Text';
import BackBtn from 'components/BackBtn';
import { useTheme } from 'hooks/useTheme';
import { ROUTES } from 'constants/routes';
import { OFFSET } from 'constants/offset';
// import { TextLogo } from 'components/TextLogo';
import { Hamburger } from 'components/Hamburger';
import MyResultsScreen from 'screens/privateScreens/MyResultsScreen';
import AllRecordedDataScreen from 'screens/privateScreens/AllRecordedDataScreen';
import MeasurementChartScreen from 'screens/privateScreens/MeasurementChartScreen';

const Stack = createNativeStackNavigator();

const MyResultsStack: React.FC = () => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const renderCustomHeader = (options?: {
        showBackButton?: boolean;
    }) => (headerProps: any) => (
        <View style={[styles.customHeader, { paddingTop: insets.top + OFFSET.POINT, backgroundColor: theme.colors.primary }]}>
            <View style={[styles.headerSide, styles.headerSideLeft]}>
                {/* {options?.showBackButton !== false && headerProps.back ? ( */}
                <BackBtn
                    label="Back"
                    color={theme.colors.white}
                    // label={headerProps.back?.title}
                    onPress={() => headerProps.navigation.goBack()}
                />
                {/* ) : null} */}
            </View>

            <View style={styles.headerCenter}>
                {/* <TextLogo color={theme.colors.white} /> */}
                {/* {headerProps.options.title} */}
                <Text variant="h4" style={{ color: theme.colors.white }}>
                    {headerProps.options.title}
                </Text>
            </View>

            <View style={[styles.headerSide, styles.headerSideRight]}>
                <Hamburger onPress={() => headerProps.navigation.openDrawer()} />
            </View>
        </View>
    );

    return (
        <Stack.Navigator>
            <Stack.Screen
                name="MyResultsList"
                component={MyResultsScreen}
                options={{
                    title: 'My Results',
                    header: renderCustomHeader({ showBackButton: false }),
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

const styles = StyleSheet.create({
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingBottom: OFFSET.POINT * 3,
    },
    headerSide: {
        flex: 1,
    },
    headerSideLeft: {
        alignItems: 'flex-start',
    },
    headerSideRight: {
        alignItems: 'flex-end',
    },
    headerCenter: {
        flex: 2,
        alignItems: 'center',
    },
});

