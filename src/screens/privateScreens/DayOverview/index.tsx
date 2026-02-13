// outsource dependencies
import React from 'react';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import {
    QuestionScreen,
    QuestionListScreen,
    QuestionCategoryScreen,
} from '../Question';
import Item from './Item';
import Edit from './Edit';
import UPCScan from './UPCScan';
import EditFood from './EditFood';
import Header from 'components/Header';
import { Overview } from './Overview';
import { VideoScreen } from '../Library';
import { ROUTES } from 'constants/routes';
import AddReplaceItem from './AddReplaceItem';
import SaveValueScreen from '../SaveValueScreen';
import AddReplaceRecipe from './AddReplaceRecipe';
import SmartScaleScreen from '../SmartScaleScreen';
import TimeSwitcher from 'components/TimeSwitcher';
import TreeAddReplaceItem from './TreeAddReplaceItem';
import ModifyIngredient from './Item/ModifyIngredient';
import { useAppDispatch, useAppSelector } from 'store';
import { RootStackParamList } from 'services/navigation';
import ModifyTypeIngredient from './ModifyTypeIngredient';
import AllRecordedDataScreen from '../AllRecordedDataScreen';
import MeasurementChartScreen from '../MeasurementChartScreen';
import WeightMeasurementScreen from '../WeightMeasurementScreen';
import { ReplacementScreen, ReplaceItemsScreen } from './Replacement';
import { selectDayOverview, meta } from 'store/slices/dayOverviewSlice';
import { ExerciseCategories, ExerciseDetails, ExerciseEdit } from './Exercise';

const Stack = createNativeStackNavigator();

const DayOverviewStack: React.FC = () => {
    const navigation = useNavigation<RootStackParamList>();

    const dispatch = useAppDispatch();
    const { date, expectAnswer } = useAppSelector(selectDayOverview);
    const currentDate = date || moment().format('YYYY-MM-DD');

    const handleDateChange = (nextDate: string) => {
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
    };

    const renderHeader = (title: string, isRootScreen = false) => (headerProps: any) => (
        <Header
            title={title}
            showHamburger
            isRootScreen={isRootScreen}
            navigation={headerProps.navigation}
            onHamburgerPress={() => (navigation as any).openDrawer?.()}
        />
    );

    const renderHeaderWithTimeSwitcher = (options?: {
        disabled?: boolean;
        isRootScreen?: boolean;
        showDateButtons?: boolean;
    }) => (headerProps: any) => (
        <Header
            showHamburger
            isRootScreen={options?.isRootScreen}
            navigation={headerProps.navigation}
            onHamburgerPress={() => (navigation as any).openDrawer?.()}
            centerComponent={
                <TimeSwitcher
                    date={currentDate}
                    disabled={options?.disabled ?? true}
                    isHideLeftBtn={!options?.showDateButtons}
                    isHideRightBtn={!options?.showDateButtons}
                    init={({ date: nextDate }) => handleDateChange(nextDate)}
                />
            }
        />
    );

    return (
        <Stack.Navigator initialRouteName="DayOverview">
            <Stack.Screen
                name="DayOverview"
                component={Overview}
                options={() => ({
                    header: renderHeaderWithTimeSwitcher({ showDateButtons: true, disabled: Boolean(expectAnswer), isRootScreen: true }),
                })}
            />
            <Stack.Screen
                name="Item"
                component={Item}
                options={{ header: renderHeader('Recipe') }}
            />
            <Stack.Screen
                name="Edit"
                component={Edit}
                options={() => ({
                    header: renderHeaderWithTimeSwitcher({ showDateButtons: true, disabled: Boolean(expectAnswer) }),
                })}
            />
            <Stack.Screen
                name="AddReplaceItem"
                component={AddReplaceItem}
                options={{ header: renderHeader('Select Item') }}
            />
            <Stack.Screen
                name="AddReplaceRecipe"
                component={AddReplaceRecipe}
                options={{ header: renderHeader('Select Recipe') }}
            />
            <Stack.Screen
                name="TreeAddReplaceItem"
                component={TreeAddReplaceItem}
                options={{ header: renderHeader('Select Item') }}
            />
            <Stack.Screen
                name="EditFood"
                component={EditFood}
                options={{ header: renderHeader('Edit Food') }}
            />
            <Stack.Screen
                name="ModifyIngredient"
                component={ModifyIngredient}
                options={{ header: renderHeader('Ingredients') }}
            />
            <Stack.Screen
                name="ModifyTypeIngredient"
                component={ModifyTypeIngredient}
                options={{ header: renderHeader('Modify') }}
            />
            <Stack.Screen
                name="UPCScan"
                component={UPCScan}
                options={{ header: renderHeader('Scan UPC Code') }}
            />
            <Stack.Screen
                name="ExerciseCategories"
                component={ExerciseCategories}
                options={{ header: renderHeader('Exercise') }}
            />
            <Stack.Screen
                name="ExerciseDetails"
                component={ExerciseDetails}
                options={{ header: renderHeader('Exercise Details') }}
            />
            <Stack.Screen
                name="EditExercise"
                component={ExerciseEdit}
                options={{ header: renderHeader('Edit Exercise') }}
            />

            <Stack.Screen
                name="SaveValue"
                component={SaveValueScreen}
                options={{ header: renderHeader('Measurement') }}
            />
            <Stack.Screen
                name="MeasurementChart"
                component={MeasurementChartScreen}
                options={{ header: renderHeader('Measurement') }}
            />

            <Stack.Screen
                name="AllRecordedData"
                component={AllRecordedDataScreen}
                options={{ header: renderHeader('All Recorded Data') }}
            />

            {/* WEIGHT-SPECIFIC SCREENS: Smart Scale and Manual Input */}
            <Stack.Screen
                name="WeightMeasurement"
                component={WeightMeasurementScreen}
                options={{ header: renderHeader('Measurement') }}
            />
            
            <Stack.Screen
                name="SmartScale"
                component={SmartScaleScreen}
                options={{ header: renderHeader('Smart Scale') }}
            />
            <Stack.Screen
                name="Replacement"
                component={ReplacementScreen}
                options={{ header: renderHeader('Select Replacement') }}
            />
            
            <Stack.Screen
                name="ReplaceItems"
                component={ReplaceItemsScreen}
                options={({ route }) => ({
                    header: renderHeader((route.params as any)?.title || 'Replacement Options'),
                })}
            />

            {/* Question Screens */}
            <Stack.Screen
                name={ROUTES.QUESTION}
                component={QuestionScreen}
                options={{
                    headerShown: false,
                    gestureEnabled: false,
                }}
            />
            <Stack.Screen
                name={ROUTES.QUESTION_CATEGORY}
                component={QuestionCategoryScreen}
                options={{ header: renderHeader('Questions') }}
            />
            <Stack.Screen
                name={ROUTES.QUESTION_LIST}
                component={QuestionListScreen}
                options={{ header: renderHeader('Questions') }}
            />
            <Stack.Screen
                name={ROUTES.VIDEO}
                component={VideoScreen}
                options={{ header: renderHeader('Video') }}
            />
        </Stack.Navigator>
    );
};

export default DayOverviewStack;
