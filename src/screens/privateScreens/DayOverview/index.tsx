// outsource dependencies
import React from 'react';
import dayjs from 'services/date';
import { useNavigation } from '@react-navigation/native';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import Text from 'components/Text';
import { config } from 'constants';
import { Overview } from './Overview';
import BackBtn from 'components/BackBtn';
import { VideoScreen } from '../Library';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import AddReplaceItem from './AddReplaceItem';
import { Hamburger } from 'components/Hamburger';
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
import { ExerciseCategories, ExerciseDetails, ExerciseEdit, WalkingActivity } from './Exercise';
import {
    GamblingGiftCardDenominationsScreen,
    GamblingGiftCardConfirmationScreen,
    GamblingGiftCardSuccessScreen,
    GamblingGiftCardOrdersScreen,
    GamblingGameSelectionScreen,
    GamblingGiftCardListScreen,
    GamblingSlotMachineScreen,
    GamblingCashOutScreen,
    GamblingLobbyScreen,
    GamblingBankScreen,
} from '../Gambling';

const Stack = createNativeStackNavigator();

const DayOverviewStack: React.FC = () => {
    const navigation = useNavigation<RootStackParamList>();
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const dispatch = useAppDispatch();
    const { date, expectAnswer } = useAppSelector(selectDayOverview);
    const currentDate = date || dayjs().format('YYYY-MM-DD');

    const handleDateChange = (nextDate: string) => {
        const isCurrent = dayjs(nextDate).isSame(dayjs(), 'day');
        const isFuture = dayjs(nextDate).isAfter(dayjs(), 'day');
        const isPast = dayjs(nextDate).isBefore(dayjs(), 'day');
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

    const renderCustomHeader = (options?: {
        title?: string;
        disabled?: boolean;
        showBackButton?: boolean;
        showDateButtons?: boolean;
    }) => (headerProps: any) => (
        <View style={[
            styles.customHeader,
            {
                backgroundColor: theme.colors.headerBg,
                paddingTop: Platform.OS === 'android' ? insets.top + OFFSET.VERTICAL : insets.top
            }
        ]}>
            <View style={[styles.headerSide, styles.headerSideLeft]}>
                <BackBtn onPress={(headerProps.options as any)?.onBackPress || (() => headerProps.navigation.goBack())} color={theme.colors.headerText}/>
            </View>
            {options?.title
                ? <View style={styles.headerCenter}>
                    <Text variant="h3" style={{ color: theme.colors.headerText }}>
                        {options.title}
                    </Text>
                </View>
                : <View style={styles.headerCenter}>
                    <TimeSwitcher
                        date={currentDate}
                        disabled={options?.disabled ?? true}
                        isHideLeftBtn={!options?.showDateButtons}
                        isHideRightBtn={!options?.showDateButtons}
                        init={({ date: nextDate }) => handleDateChange(nextDate)}
                    />
                </View>}
            <View style={[styles.headerSide, styles.headerSideRight]}>
                <Hamburger onPress={() => (navigation as any).openDrawer?.()} />
            </View>
        </View>
    );

    return (
        <Stack.Navigator
            initialRouteName="DayOverview"
            screenOptions={() => ({
                headerRight: () => (
                    <Hamburger onPress={() => (navigation as any).openDrawer?.()} style={styles.menuButton} />
                ),
            })}>
            <Stack.Screen
                name="DayOverview"
                component={Overview}
                options={() => ({
                    title: 'Day Overview',
                    header: renderCustomHeader({ showDateButtons: true, disabled: Boolean(expectAnswer) }),
                })}
            />
            <Stack.Screen
                name="Item"
                component={Item}
                options={{
                    title: 'Recipe',
                    header: renderCustomHeader(),
                }}
            />
            <Stack.Screen
                name="Edit"
                component={Edit}
                options={() => ({
                    title: 'Edit',
                    header: renderCustomHeader({ showDateButtons: true, disabled: Boolean(expectAnswer) }),
                })}
            />
            <Stack.Screen
                name="AddReplaceItem"
                component={AddReplaceItem}
                options={{ title: 'Select Item', header: renderCustomHeader() }}
            />
            <Stack.Screen
                name="AddReplaceRecipe"
                component={AddReplaceRecipe}
                options={{ title: 'Select Recipe', header: renderCustomHeader() }}
            />
            <Stack.Screen
                name="TreeAddReplaceItem"
                component={TreeAddReplaceItem}
                options={{ title: 'Select Item', header: renderCustomHeader() }}
            />
            <Stack.Screen
                name="EditFood"
                component={EditFood}
                options={{ title: 'Edit Food', header: renderCustomHeader() }}
            />
            <Stack.Screen
                name="ModifyIngredient"
                component={ModifyIngredient}
                options={{ title: 'Ingredients', header: renderCustomHeader() }}
            />
            <Stack.Screen
                name="ModifyTypeIngredient"
                component={ModifyTypeIngredient}
                options={{ title: 'Modify', header: renderCustomHeader() }}
            />
            <Stack.Screen
                name="UPCScan"
                component={UPCScan}
                options={{ title: 'Scan UPC Code', header: renderCustomHeader({ title: 'Scan UPC Code' }) }}
            />
            <Stack.Screen
                name="ExerciseCategories"
                component={ExerciseCategories}
                options={{ title: 'Exercise', header: renderCustomHeader() }}
            />
            <Stack.Screen
                name="ExerciseDetails"
                component={ExerciseDetails}
                options={{ title: 'Exercise Details', header: renderCustomHeader() }}
            />
            <Stack.Screen
                name="EditExercise"
                component={ExerciseEdit}
                options={{ title: 'Edit Exercise', header: renderCustomHeader() }}
            />
            <Stack.Screen
                name="WalkingActivity"
                component={WalkingActivity}
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="SaveValue"
                component={SaveValueScreen}
                options={{ title: 'Measurement', header: renderCustomHeader() }}
            />
            <Stack.Screen
                name="MeasurementChart"
                component={MeasurementChartScreen}
                options={{ title: 'Measurement', header: renderCustomHeader() }}
            />

            <Stack.Screen
                name="AllRecordedData"
                component={AllRecordedDataScreen}
                options={{ title: 'All Recorded Data', header: renderCustomHeader() }}
            />

            {/* WEIGHT-SPECIFIC SCREENS: Smart Scale and Manual Input */}
            <Stack.Screen
                name="WeightMeasurement"
                component={WeightMeasurementScreen}
                options={{
                    headerTitleStyle: { fontSize: 18 },
                    header: renderCustomHeader({ title: 'Measurement' }),
                }}
            />

            <Stack.Screen
                name="SmartScale"
                component={SmartScaleScreen}
                options={{
                    headerTitleStyle: { fontSize: 18 },
                    header: renderCustomHeader({ title: 'Smart Scale' }),
                }}
            />
            <Stack.Screen
                name="Replacement"
                component={ReplacementScreen}
                options={{
                    headerTitleStyle: { fontSize: 18 },
                    header: renderCustomHeader({ title: 'Select Replacement' }),
                }}
            />

            <Stack.Screen
                name="ReplaceItems"
                component={ReplaceItemsScreen}
                options={({ route }) => ({
                    headerTitleStyle: { fontSize: 18 },
                    header: renderCustomHeader({ title: (route.params as any)?.title || 'Replacement Options' }),
                })}
            />

            {config.features.gamblingEnabled && (
                <>
                    <Stack.Screen
                        name={ROUTES.GAMBLING_HOME}
                        component={GamblingLobbyScreen}
                        options={{
                            title: 'Games',
                            header: renderCustomHeader({ title: 'Games' }),
                        }}
                    />
                    <Stack.Screen
                        name={ROUTES.GAMBLING_GAMES}
                        component={GamblingGameSelectionScreen}
                        options={{
                            title: 'Games',
                            header: renderCustomHeader({ title: 'Games' }),
                        }}
                    />
                    <Stack.Screen
                        name={ROUTES.GAMBLING_SLOT_MACHINE}
                        component={GamblingSlotMachineScreen}
                        options={{
                            animation: 'fade',
                            headerShown: false,
                            presentation: 'transparentModal',
                            contentStyle: { backgroundColor: 'transparent' },
                        }}
                    />
                    <Stack.Screen
                        name={ROUTES.GAMBLING_CASH_OUT}
                        component={GamblingCashOutScreen}
                        options={{
                            title: 'Cash Out',
                            header: renderCustomHeader({ title: 'Cash Out' }),
                        }}
                    />
                    <Stack.Screen
                        name={ROUTES.GAMBLING_BANK}
                        component={GamblingBankScreen}
                        options={{
                            title: 'Bank',
                            header: renderCustomHeader({ title: '$ Bank' }),
                        }}
                    />
                    <Stack.Screen
                        name={ROUTES.GAMBLING_GIFT_CARD_LIST}
                        component={GamblingGiftCardListScreen}
                        options={{
                            title: 'Redeem Points',
                            header: renderCustomHeader({ title: 'Redeem Points' }),
                        }}
                    />
                    <Stack.Screen
                        name={ROUTES.GAMBLING_GIFT_CARD_DENOMINATIONS}
                        component={GamblingGiftCardDenominationsScreen}
                        options={{
                            title: 'Redeem Points',
                            header: renderCustomHeader({ title: 'Redeem Points' }),
                        }}
                    />
                    <Stack.Screen
                        name={ROUTES.GAMBLING_GIFT_CARD_CONFIRMATION}
                        component={GamblingGiftCardConfirmationScreen}
                        options={{
                            title: 'Redeem Points',
                            header: renderCustomHeader({ title: 'Redeem Points' }),
                        }}
                    />
                    <Stack.Screen
                        name={ROUTES.GAMBLING_GIFT_CARD_SUCCESS}
                        component={GamblingGiftCardSuccessScreen}
                        options={{
                            title: 'Redeem Points',
                            header: renderCustomHeader({ title: 'Redeem Points' }),
                        }}
                    />
                    <Stack.Screen
                        name={ROUTES.GAMBLING_GIFT_CARD_ORDERS}
                        component={GamblingGiftCardOrdersScreen}
                        options={{
                            title: 'My Gift Cards',
                            header: renderCustomHeader({ title: 'My Gift Cards' }),
                        }}
                    />
                </>
            )}

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
                options={{
                    title: 'Questions',
                    header: renderCustomHeader(),
                }}
            />
            <Stack.Screen
                name={ROUTES.QUESTION_LIST}
                component={QuestionListScreen}
                options={{
                    title: 'Questions',
                    header: renderCustomHeader(),
                }}
            />
            <Stack.Screen
                name={ROUTES.VIDEO}
                component={VideoScreen}
                options={{
                    title: 'Video',
                    header: renderCustomHeader(),
                }}
            />
        </Stack.Navigator>
    );
};

export default DayOverviewStack;

const styles = StyleSheet.create({
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: OFFSET.VERTICAL,
        justifyContent: 'space-between',
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    headerSide: {
        minWidth: 60,
        justifyContent: 'center',
    },
    headerSideLeft: {
        alignItems: 'flex-start',
    },
    headerSideRight: {
        alignItems: 'flex-end',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
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
