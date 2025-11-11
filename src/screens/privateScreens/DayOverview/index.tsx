// outsource dependencies
import React from 'react';
import moment from 'moment';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import Item from './Item';
import Edit from './Edit';
import UPCScan from './UPCScan';
import { Overview } from './Overview';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import AddReplaceItem from './AddReplaceItem';
import BackButton from 'components/BackButton';
import { Hamburger } from 'components/Hamburger';
import SaveValueScreen from '../SaveValueScreen';
import SmartScaleScreen from '../SmartScaleScreen';
import TimeSwitcher from 'components/TimeSwitcher';
import { useAppDispatch, useAppSelector } from 'store';
import { RootStackParamList } from 'services/navigation';
import AllRecordedDataScreen from '../AllRecordedDataScreen';
import MeasurementChartScreen from '../MeasurementChartScreen';
import WeightMeasurementScreen from '../WeightMeasurementScreen';
import { ReplacementScreen, ReplaceItemsScreen } from './Replacement';
import { selectDayOverview, meta } from 'store/slices/dayOverviewSlice';
import { ExerciseCategories, ExerciseDetails, ExerciseEdit } from './Exercise';

const Stack = createNativeStackNavigator();

const DayOverviewStack: React.FC = () => {
    const navigation = useNavigation<RootStackParamList>();
    const theme = useTheme();

    const dispatch = useAppDispatch();
    const { date, expectAnswer } = useAppSelector(selectDayOverview);
    const currentDate = date || moment().format('YYYY-MM-DD');

    return (
        <Stack.Navigator initialRouteName="DayOverview" screenOptions={() => ({
            // title: currentDate,
            headerStyle: {
                backgroundColor: theme.colors.primary,
            },
            headerTintColor: theme.colors.white,
            headerTitleStyle: {
                fontWeight: '600',
            },
            headerRight: () => (
                <Hamburger onPress={() => (navigation as any).openDrawer?.()} style={styles.menuButton} />
            ),
        })}>
            <Stack.Screen
                name="DayOverview"
                component={Overview}
                options={() => ({ title: 'Day Overview', headerTitle: () => (
                    <TimeSwitcher
                        date={currentDate}
                        isHideLeftBtn={false}
                        isHideRightBtn={false}
                        disabled={Boolean(expectAnswer)}
                        init={({ date: nextDate }) => {
                            const isCurrent = moment(nextDate).isSame(moment(), 'day');
                            const isFuture = moment(nextDate).isAfter(moment(), 'day');
                            const isPast = moment(nextDate).isBefore(moment(), 'day');
                            dispatch(
                                meta({
                                    date: nextDate,
                                    isPastDate: isPast,
                                    isFutureDate: isFuture,
                                    isCurrentDate: isCurrent,
                                    calendarDays: { [nextDate]: { selected: true } },
                                })
                            );
                        }}
                    />
                ),
                headerLeft: () => (
                    <BackButton navigation={navigation} theme={theme} />
                ), })}
            />
            <Stack.Screen
                name="Item"
                component={Item}
                options={{
                    title: 'Item Details',
                }}
            />
            <Stack.Screen
                name="Edit"
                component={Edit}
                options={() => ({
                    title: 'Edit',
                    headerTitle: () => (
                        <TimeSwitcher
                            date={currentDate}
                            isHideLeftBtn={false}
                            isHideRightBtn={false}
                            disabled={Boolean(expectAnswer)}
                            init={({ date: nextDate }) => {
                                const isCurrent = moment(nextDate).isSame(moment(), 'day');
                                const isFuture = moment(nextDate).isAfter(moment(), 'day');
                                const isPast = moment(nextDate).isBefore(moment(), 'day');
                                dispatch(
                                    meta({
                                        date: nextDate,
                                        isPastDate: isPast,
                                        isFutureDate: isFuture,
                                        isCurrentDate: isCurrent,
                                        calendarDays: { [nextDate]: { selected: true } },
                                    })
                                );
                            }}
                        />
                    )
                })}
            />
            <Stack.Screen
                name="AddReplaceItem"
                component={AddReplaceItem}
                options={({ route, navigation }) => ({
                    title: 'Select Item',
                    headerTitle: () =>
                        <TimeSwitcher
                            disabled
                            isHideLeftBtn
                            isHideRightBtn
                            init={() => {}}
                            date={currentDate}
                        />
                })}
            />
            <Stack.Screen
                name="UPCScan"
                component={UPCScan}
                options={{ title: 'Scan UPC Code' }}
            />
            <Stack.Screen name="ExerciseCategories" component={ExerciseCategories} options={{ title: 'Exercise', headerTitle: () =>
                <TimeSwitcher
                    disabled
                    isHideLeftBtn
                    isHideRightBtn
                    init={() => {}}
                    date={currentDate}
                /> }} />
            <Stack.Screen name="ExerciseDetails" component={ExerciseDetails} options={{ title: 'Exercise Details', headerTitle: () =>
                <TimeSwitcher
                    disabled
                    isHideLeftBtn
                    isHideRightBtn
                    init={() => {}}
                    date={currentDate}
                /> }} />
            <Stack.Screen name="EditExercise" component={ExerciseEdit} options={{ title: 'Edit Exercise', headerTitle: () =>
                <TimeSwitcher
                    disabled
                    isHideLeftBtn
                    isHideRightBtn
                    init={() => {}}
                    date={currentDate}
                /> }} />

            <Stack.Screen
                name="SaveValue"
                component={SaveValueScreen}
                options={({ route }) => ({
                    title: (route.params as any)?.measurementName || 'Measurement',
                    headerTitle: () => (
                        <TimeSwitcher
                            disabled
                            isHideLeftBtn
                            isHideRightBtn
                            init={() => {}}
                            date={currentDate}
                        />
                    ),
                })}
            />

            <Stack.Screen
                name="MeasurementChart"
                component={MeasurementChartScreen}
                options={({ route }) => ({
                    title: (route.params as any)?.measurementName || 'Measurement',
                    headerTitle: () => (
                        <TimeSwitcher
                            disabled
                            isHideLeftBtn
                            isHideRightBtn
                            init={() => {}}
                            date={currentDate}
                        />
                    ),
                })}
            />

            <Stack.Screen
                name="AllRecordedData"
                component={AllRecordedDataScreen}
                options={{
                    title: 'All Recorded Data',
                    headerTitle: () => (
                        <TimeSwitcher
                            disabled
                            isHideLeftBtn
                            isHideRightBtn
                            init={() => {}}
                            date={currentDate}
                        />
                    ),
                }}
            />

            {/* WEIGHT-SPECIFIC SCREENS: Smart Scale and Manual Input */}
            <Stack.Screen
                name="WeightMeasurement"
                component={WeightMeasurementScreen}
                options={{
                    title: 'Measurement',
                    headerTitleStyle: { fontSize: 18 },
                }}
            />
            
            <Stack.Screen
                name="SmartScale"
                component={SmartScaleScreen}
                options={{
                    title: 'Smart Scale',
                    headerTitleStyle: { fontSize: 18 },
                }}
            />
            <Stack.Screen
                name="Replacement"
                component={ReplacementScreen}
                options={{
                    title: 'Select Replacement',
                    headerTitleStyle: { fontSize: 18 },
                }}
            />
            
            <Stack.Screen
                name="ReplaceItems"
                component={ReplaceItemsScreen}
                options={({ route }) => ({
                    title: (route.params as any)?.title || 'Replacement Options',
                    headerTitleStyle: { fontSize: 18 },
                })}
            />
        </Stack.Navigator>
    );
};

export default DayOverviewStack;

const styles = StyleSheet.create({
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backText: {
        fontSize: 16,
        marginLeft: OFFSET.HORIZONTAL / 2,
        fontWeight: '600',
    },
    menuButton: {
        marginRight: OFFSET.HORIZONTAL / 2,
    },
});
