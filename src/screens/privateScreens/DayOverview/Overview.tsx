// outsource dependencies
import moment from 'moment';
import { Calendar } from 'react-native-calendars';
import Svg, { Line, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/fontawesome5';
import Ionicons from '@react-native-vector-icons/ionicons';
import FeatherIcon from '@react-native-vector-icons/feather';
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { View, FlatList, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { COLORS } from 'constants/colors';
import { Highlight } from 'components/Highlight';
import { AnytimeMenu } from 'components/AnytimeMenu';
import { useAppDispatch, useAppSelector } from 'store';
import { RootStackParamList } from 'services/navigation';
import { DayOverviewSkeleton } from 'components/Skeleton';
import { HealthQuestion } from 'components/HealthQuestion';
import type { AnytimeMeasurementItem } from 'types/anytime';
import { PhaseItem, AddPhaseItemData } from 'types/overview';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeasurementInputModal } from 'components/AnytimeMenu/MeasurementInputModal';
import { selectDayOverview, meta, setDateEntry } from 'store/slices/dayOverviewSlice';
import { OVERVIEW_TYPE, PHASE_ITEM_STATUS, ENTITY_TYPE, SUBSTANCE_TYPE } from 'constants/spec';
import {
    Phase,
    useGetDayOverviewQuery,
    useCreatePatientPhaseMutation,
    useUpdatePatientPhaseMutation,
    useAddPhaseCustomRecipeMutation,
    useCreatePatientPhaseWithRecipeMutation,
} from 'store/api/dayOverviewApi';
import { filters } from 'services/filter';

// Temporary types
// export type PhaseType =
//   | 'MEAL'
//   | 'ANYTIME'
//   | 'QUESTION'
//   | 'SUPPLEMENT'
//   | 'MEDICATION'
//   | 'MEASUREMENT'
//   | 'ADDED_BY_PATIENT'
//   | 'PHYSICAL_ACTIVITY';

// interface PhaseItem {
//   title: string;
//   type: PhaseType;
//   sortKey?: number;
//   id: string | number;
//   phaseId?: string | number;
//   status?: 'DONE' | 'PENDING' | 'INCOMPLETE';
// }

const DOT_SIZE = 8;
const GAP_SIZE = 15;
const ICON_SIZE = 40;
const ROW_HEIGHT = 75;
const ICON_MARGIN = 20;
const TIMELINE_WIDTH = 50;
const CONNECTOR_WIDTH = 1;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TimelineSVG: React.FC<{ phases: PhaseItem[]; incompleteDay?: boolean }> = ({ phases, incompleteDay = false }) => {
    const theme = useTheme();
    const mainLineX = TIMELINE_WIDTH / 2;
    const mealIconX = TIMELINE_WIDTH + GAP_SIZE + ICON_MARGIN + ICON_SIZE / 2;
    const offsetLineX = mealIconX;
    const svgHeight = phases.length * ROW_HEIGHT;

    const isMealPhase = (type: AddPhaseItemData['type']) => type === 'MEAL';

    const timelineElements = useMemo(() => {
        const elements: React.ReactElement[] = [];

        // main vertical line - only for meal phases
        const mealPhases = phases.filter(phase => isMealPhase(phase.type));
        if (mealPhases.length > 1) {
            const firstMealIndex = phases.findIndex(phase => isMealPhase(phase.type));
            let lastMealIndex = -1;
            for (let i = phases.length - 1; i >= 0; i--) {
                if (isMealPhase(phases[i].type)) {
                    lastMealIndex = i;
                    break;
                }
            }

            // create vertical line segments
            for (let i = firstMealIndex; i < lastMealIndex; i++) {
                const currentY = i * ROW_HEIGHT + ROW_HEIGHT / 2;
                const nextY = (i + 1) * ROW_HEIGHT + ROW_HEIGHT / 2;
                const nextPhase = phases[i + 1];

                const isNextPhaseHasMeal = isMealPhase(nextPhase.type);
                const checkLineX = isNextPhaseHasMeal ? mainLineX : offsetLineX;
                const checkLineY1 = isNextPhaseHasMeal ? currentY + GAP_SIZE : currentY + 30;

                elements.push(
                    <Line
                        y1={currentY}
                        y2={currentY}
                        x1={mainLineX}
                        x2={mainLineX}
                        stroke={theme.colors.grey}
                        key={`main-line-upper-${i}`}
                        strokeWidth={CONNECTOR_WIDTH}
                    />
                );

                if (!isNextPhaseHasMeal) {
                    elements.push(
                        <Line
                            x2={checkLineX}
                            x1={checkLineX}
                            y1={checkLineY1}
                            y2={nextY - GAP_SIZE}
                            stroke={theme.colors.grey}
                            key={`main-line-lower-${i}`}
                            strokeWidth={CONNECTOR_WIDTH}
                        />
                    );
                    elements.push(
                        <Line
                            x1={offsetLineX}
                            x2={offsetLineX}
                            stroke={theme.colors.grey}
                            strokeWidth={CONNECTOR_WIDTH}
                            y2={nextY + ROW_HEIGHT * 2 - GAP_SIZE}
                            key={`main-line-lower-${Math.random()}`}
                            y1={nextY + ROW_HEIGHT + ICON_SIZE - DOT_SIZE}
                        />
                    );
                } else {
                    const isPrevPhaseHasMeal = isMealPhase(phases[i].type);
                    isPrevPhaseHasMeal
            && elements.push(
                <Line
                    x1={mainLineX}
                    x2={mainLineX}
                    y2={nextY - GAP_SIZE}
                    y1={currentY + GAP_SIZE}
                    stroke={theme.colors.grey}
                    strokeWidth={CONNECTOR_WIDTH}
                    key={`main-line-lower-${Math.random()}`}
                />
            );
                }
            }
        }

        // handle non-meal phases
        let currentNonMealStart: number | null = null;
        let nonMealDots: number[] = [];

        phases.forEach((phase, index) => {
            const y = index * ROW_HEIGHT + ROW_HEIGHT / 2;
            const isMeal = isMealPhase(phase.type);

            if (!isMeal) {
                if (currentNonMealStart === null) { currentNonMealStart = y; }
                nonMealDots.push(y);
            } else {
                if (currentNonMealStart !== null && nonMealDots.length > 0) {
                    const startY = currentNonMealStart;
                    const endY = y - ROW_HEIGHT / 2;

                    for (let i = 0; i < nonMealDots.length; i++) {
                        const dotY = nonMealDots[i];

                        if (i === 0) {
                            elements.push(
                                <Line
                                    y1={startY}
                                    x1={offsetLineX}
                                    x2={offsetLineX}
                                    y2={dotY - DOT_SIZE / 2}
                                    stroke={theme.colors.grey}
                                    strokeWidth={CONNECTOR_WIDTH}
                                    key={`non-meal-line-upper-${index}-${Math.random()}`}
                                />
                            );
                        } else {
                            const prevDotY = nonMealDots[i - 1];
                            elements.push(
                                <Line
                                    x1={offsetLineX}
                                    x2={offsetLineX}
                                    y2={dotY - GAP_SIZE}
                                    y1={prevDotY + GAP_SIZE}
                                    stroke={theme.colors.grey}
                                    strokeWidth={CONNECTOR_WIDTH}
                                    key={`non-meal-line-upper-${index}-${Math.random()}`}
                                />
                            );
                        }

                        if (i === nonMealDots.length - 1) {
                            elements.push(
                                <Line
                                    x2={offsetLineX}
                                    x1={offsetLineX}
                                    y1={dotY + GAP_SIZE}
                                    y2={endY + DOT_SIZE}
                                    stroke={theme.colors.grey}
                                    strokeWidth={CONNECTOR_WIDTH}
                                    key={`non-meal-line-lower-${index}-${Math.random()}`}
                                />
                            );
                        }
                    }
                    currentNonMealStart = null;
                    nonMealDots = [];
                }
            }
        });

        if (currentNonMealStart !== null && nonMealDots.length > 0) {
            const endY = (phases.length - 1) * ROW_HEIGHT + ROW_HEIGHT / 2;
            const startY = currentNonMealStart;
            for (let i = 0; i < nonMealDots.length; i++) {
                const dotY = nonMealDots[i];
                const isNextPhaseHasMeal = isMealPhase(phases[i + 1].type);

                if (i === 0) {
                    elements.push(
                        <Line
                            y1={startY}
                            x1={offsetLineX}
                            x2={offsetLineX}
                            y2={dotY - DOT_SIZE / 2}
                            stroke={theme.colors.grey}
                            strokeWidth={CONNECTOR_WIDTH}
                            key={`non-meal-line-end-upper-${Math.random()}`}
                        />
                    );
                } else {
                    const prevDotY = nonMealDots[i - 1];
                    !isNextPhaseHasMeal
            && elements.push(
                <Line
                    x1={offsetLineX}
                    x2={offsetLineX}
                    y2={dotY - GAP_SIZE}
                    y1={prevDotY + GAP_SIZE}
                    stroke={theme.colors.grey}
                    strokeWidth={CONNECTOR_WIDTH}
                    key={`non-meal-line-end-upper-${Math.random()}`}
                />
            );
                }

                if (i === nonMealDots.length - 1) {
                    elements.push(
                        <Line
                            y2={endY}
                            x1={offsetLineX}
                            x2={offsetLineX}
                            y1={dotY + DOT_SIZE / 2}
                            stroke={theme.colors.grey}
                            strokeWidth={CONNECTOR_WIDTH}
                            key={`non-meal-line-end-lower-${Math.random()}`}
                        />
                    );
                } else {
                    const nextDotY = nonMealDots[i + 1];
                    elements.push(
                        <Line
                            x1={offsetLineX}
                            x2={offsetLineX}
                            y1={dotY + GAP_SIZE}
                            y2={nextDotY - GAP_SIZE}
                            stroke={theme.colors.grey}
                            strokeWidth={CONNECTOR_WIDTH}
                            key={`non-meal-line-end-lower-${Math.random()}`}
                        />
                    );
                }
            }
        }

        // dots + horizontal connectors
        phases.forEach((phase, index) => {
            const y = index * ROW_HEIGHT + ROW_HEIGHT / 2;
            const isMeal = isMealPhase(phase.type);
            const dotX = isMeal ? mainLineX : offsetLineX;
            const iconX = dotX + GAP_SIZE + ICON_SIZE / 2 + ICON_MARGIN;

            const isIncomplete = incompleteDay && phase.status === 'INCOMPLETE';
            if (!isIncomplete) {
                elements.push(<Circle key={`dot-${index}`} cx={dotX} cy={y} r={DOT_SIZE / 2} fill={theme.colors.grey} />);
            }

            elements.push(
                <Line
                    y1={y}
                    y2={y}
                    strokeWidth={1}
                    x1={dotX + GAP_SIZE}
                    strokeDasharray="2,2"
                    x2={iconX - GAP_SIZE / 2}
                    stroke={theme.colors.grey}
                    key={`connector-${index}`}
                />
            );
        });

        return elements;
    }, [phases, svgHeight]);

    return (
        <Svg width={SCREEN_WIDTH} height={svgHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
            {timelineElements}
        </Svg>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.POINT * 3,
        backgroundColor: '#156F93',
    },
    content: {
        flex: 1,
        paddingBottom: OFFSET.VERTICAL,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: OFFSET.VERTICAL,
        position: 'relative',
        height: ROW_HEIGHT,
    },
    iconWrapper: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: ICON_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: TIMELINE_WIDTH + GAP_SIZE + ICON_MARGIN,
    },
    rightContent: {
        flex: 1,
        paddingLeft: 12,
    },
    graphIconContainer: {
        paddingRight: 16,
        paddingLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#7B7B7B',
        marginVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    timelineContainer: {
        position: 'relative',
        minHeight: 0,
    },
    birdOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 2,
    },
    calendarBtn: {
        position: 'absolute',
        right: 20,
        bottom: 90,
    },
    addBtn: {
        position: 'absolute',
        right: 20,
        bottom: 170,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: 12,
    },
    disabledBtn: {
        backgroundColor: '#CCCCCC',
    },
    shadowBtn: {
        shadowColor: '#000000',
        ...Platform.select({
            ios: {
                shadowOffset: { width: 3, height: 3 },
                shadowOpacity: 0.8,
                shadowRadius: 3,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    roundBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    calendarMonth: {
        backgroundColor: '#F55454',
        flex: 1,
        width: '100%',
    },
    calendarMonthText: {
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    calendarDay: {
        backgroundColor: '#FFFFFF',
        flex: 2,
        width: '100%',
        justifyContent: 'center',
    },
    calendarDayText: {
        fontWeight: 'bold',
    },
    bottomSheetBg: {
        backgroundColor: '#FFFFFF',
    },
    bottomSheetIndicator: {
        backgroundColor: '#DADADA',
        width: 40,
    },
    calendarContainer: {
        flex: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingTop: OFFSET.VERTICAL,
    },
    incompleteLabel: {
        width: 180,
        marginLeft: 5,
        marginTop: 5,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    incompleteText: {
        marginLeft: 5,
        fontWeight: '500',
        fontSize: 16,
    },
    incompleteLabelContainer: {
        position: 'absolute',
        bottom: 100,
        right: 0,
        marginRight: Platform.OS === 'ios' ? -10 : -20,
    },
    statusIndicator: {
        position: 'absolute',
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
        // Center vertically: ROW_HEIGHT/2 - iconSize/2 = 75/2 - 18/2 = 37.5 - 9 = 28.5
        top: 28,
    },
    highlightText: {
        marginLeft: 8,
        fontWeight: '500',
        color: '#4A4A4A',
    },
});

const getIconColorByType = (type: AddPhaseItemData['type']) => {
    switch (type) {
        case 'MEAL':
            return { bg: '#FFD9B3', fg: '#C56A00', name: 'utensils' as const };
        case 'ADDED_BY_PATIENT':
            return { bg: '#D4E09B', fg: '#647C2E', name: 'utensils' as const };
        case 'MEASUREMENT':
            return { bg: '#F3F3F3', fg: '#000000', name: 'ruler' as const };
        case 'SUPPLEMENT':
        case 'MEDICATION':
            return { bg: '#F3F3F3', fg: '#000000', name: 'capsules' as const };
        case 'PHYSICAL_ACTIVITY':
            return { bg: '#F9C1C3', fg: '#000000', name: 'running' as const };
        case 'QUESTION':
            return { bg: '#E3F2FD', fg: '#1976D2', name: 'question' as const };
        case 'ANYTIME':
            return { bg: '#FFF3E0', fg: '#E65100', name: 'clock' as const };
        default:
            return { bg: '#DADADA', fg: '#7B7B7B', name: 'dot-circle' as const };
    }
};

export const Overview: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const dispatch = useAppDispatch();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const { date, showCalendar, calendarDays } = useAppSelector(selectDayOverview);
    const currentDate = date || moment().format('YYYY-MM-DD');
    const [selectedMeasurement, setSelectedMeasurement] = useState<AnytimeMeasurementItem | null>(null);

    const { data, isLoading, isFetching } = useGetDayOverviewQuery(currentDate, {
        skip: !currentDate,
        refetchOnMountOrArgChange: true,
    });

    const [createPatientPhase] = useCreatePatientPhaseMutation();
    const [createPatientPhaseWithRecipe] = useCreatePatientPhaseWithRecipeMutation();
    const [updatePatientPhase] = useUpdatePatientPhaseMutation();
    const [addPhaseCustomRecipe] = useAddPhaseCustomRecipeMutation();

    const isFutureDateCheck = moment(currentDate).isAfter(moment(), 'day');

    const incompleteDay = useMemo(() => {
        const incompleteDays = data?.currentWeekIncompleteDays || [];
        return incompleteDays.some(day => day?.date === currentDate);
    }, [data?.currentWeekIncompleteDays, currentDate]);

    const toggleCalendar = useCallback((show: boolean) => {
        dispatch(meta({ showCalendar: show }));
        if (show) {
            bottomSheetRef.current?.expand();
        } else {
            bottomSheetRef.current?.close();
        }
    }, [dispatch]);

    const handleDayPress = useCallback((day: { dateString: string }) => {
        const nextDate = day.dateString;
        const isCurrent = moment(nextDate).isSame(moment(), 'day');
        const isFuture = moment(nextDate).isAfter(moment(), 'day');
        const isPast = moment(nextDate).isBefore(moment(), 'day');
        dispatch(meta({
            date: nextDate,
            isPastDate: isPast,
            showCalendar: false,
            isFutureDate: isFuture,
            isCurrentDate: isCurrent,
            calendarDays: { ...calendarDays, [nextDate]: { selected: true } },
        }));
        bottomSheetRef.current?.close();
    }, [dispatch, calendarDays]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    const handleSheetChanges = useCallback((index: number) => {
        if (index === -1) {
            dispatch(meta({ showCalendar: false }));
        }
    }, [dispatch]);

    const handleAddButtonPress = useCallback(() => {
        if (!data?.id) { return; }

        const patientPhase = data?.phases?.find(p => p.type === OVERVIEW_TYPE.ADDED_BY_PATIENT);
        const phasesCount = data?.phases?.length || 0;

        navigation.navigate(ROUTES.TREE_ADD_REPLACE_ITEM, {
            prevItem: null,
            date: currentDate,
            substanceType: 'FOOD',
            entityType: 'PATIENT_FOOD',
            onApply: async (payload: any) => {
                try {
                    const selectedItemData = payload.item || payload;
                    const selectedItem = { ...selectedItemData?.item };
                    const itemEntityType = selectedItemData?.entityType || 'FOOD';
                    const itemSubstanceType = selectedItemData?.substanceType || selectedItem?.substanceType || SUBSTANCE_TYPE.FOOD;

                    if (itemEntityType === ENTITY_TYPE.FOOD || itemEntityType === 'PATIENT_FOOD' || itemEntityType === 'PATIENT_DRINK') {
                        const defaultWeight = selectedItem.weights?.find((w: any) => w.isDefault) || selectedItem.weights?.[0];

                        const newItem: any = {
                            order: 0,
                            section: 'Added',
                            type: ENTITY_TYPE.FOOD,
                            food: { id: selectedItem.id },
                            substanceType: itemSubstanceType,
                            amount: selectedItem?.amount || 1,
                            status: PHASE_ITEM_STATUS.PENDING,
                            initialAmount: selectedItem?.initialAmount || 1,
                        };

                        // Add weight as { id } reference
                        if (defaultWeight?.id) {
                            newItem.weight = { id: defaultWeight.id };
                        }

                        if (patientPhase?.id) {
                            // Add to existing ADDED_BY_PATIENT phase - update phase with new items array
                            const existingItems = patientPhase.items || [];
                            await updatePatientPhase({
                                phaseId: patientPhase.id,
                                data: {
                                    order: phasesCount,
                                    dayOverview: { id: data.id },
                                    status: PHASE_ITEM_STATUS.PENDING,
                                    items: [...existingItems, newItem],
                                    type: OVERVIEW_TYPE.ADDED_BY_PATIENT,
                                },
                            });
                        } else {
                            // Create new ADDED_BY_PATIENT phase
                            await createPatientPhase({
                                dayOverviewId: data.id,
                                data: {
                                    items: [newItem],
                                    order: phasesCount + 1,
                                    dayOverview: { id: data.id },
                                    status: PHASE_ITEM_STATUS.PENDING,
                                    type: OVERVIEW_TYPE.ADDED_BY_PATIENT,
                                },
                            });
                        }
                    } else if (itemEntityType === ENTITY_TYPE.RECIPE || itemEntityType === 'PATIENT_RECIPES' || itemEntityType === 'RESTAURANT') {
                        const recipeItem: any = {
                            order: 0,
                            section: 'Added',
                            type: ENTITY_TYPE.RECIPE,
                            recipe: { id: selectedItem?.id },
                            amount: selectedItem?.amount || 1,
                            status: PHASE_ITEM_STATUS.PENDING,
                            initialAmount: selectedItem?.initialAmount || 1,
                        };

                        if (patientPhase?.id) {
                            // Add recipe to existing phase
                            await addPhaseCustomRecipe({
                                data: recipeItem,
                                phaseId: patientPhase.id,
                            });
                        } else {
                            // Create new phase with recipe
                            await createPatientPhaseWithRecipe({
                                dayOverviewId: data.id,
                                data: {
                                    items: [recipeItem],
                                    order: phasesCount + 1,
                                    status: PHASE_ITEM_STATUS.PENDING,
                                    type: OVERVIEW_TYPE.ADDED_BY_PATIENT,
                                },
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error adding item to patient phase:', error);
                }
            }
        });
    }, [data, currentDate, navigation, createPatientPhase, createPatientPhaseWithRecipe, updatePatientPhase, addPhaseCustomRecipe]);

    useEffect(() => {
        moment.updateLocale('en', { week: { dow: 1 } });
    }, []);


    useEffect(() => {
        if (!data) { return; }
        const calendarDays: Record<string, any> = { [currentDate]: { selected: true } };
        (data.currentWeekIncompleteDays || []).forEach(d => {
            if (d?.date) {
                calendarDays[d.date] = { selected: true, selectedColor: '#dc73de' };
            }
        });
        dispatch(meta({ calendarDays }));

        const countPhases = (data.phases || []).reduce((sum, p) => {
            if (p.type === 'MEASUREMENT') { return sum + (p.items?.length || 0); }
            return sum + 1;
        }, 0);
        dispatch(setDateEntry({
            date: currentDate,
            entry: {
                countPhases,
                overview: data as any,
                anytimePhaseId: data.anytimePhaseId
            }
        }));
    }, [data, currentDate, dispatch]);

    const phases: PhaseItem[] = useMemo(() => {
        if (!data?.phases) { return []; }
        const rows: PhaseItem[] = [];

        data.phases.forEach((p: Phase) => {
            if (p.type === 'MEASUREMENT') {
                const items = [...(p.items || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                items.forEach(item => {
                    rows.push({
                        id: item.id,
                        phaseId: p.id,
                        phase: { id: p.id },
                        type: 'MEASUREMENT',
                        order: item.order ?? 0,
                        rating: item.rating ?? 0,
                        recipe: item.recipe ?? null,
                        section: item.section ?? '',
                        serving: item.serving ?? null,
                        modified: item.modified ?? false,
                        title: item.measurement?.name || 'Measurement',
                        peopleEatingNumber: item.peopleEatingNumber ?? 1,
                        sortKey: (p.order ?? 0) + (item.order ?? 0) / 100,
                        status: item.status as 'DONE' | 'PENDING' | 'INCOMPLETE',
                        patientFoodCategoryQuestion: item.patientFoodCategoryQuestion ?? null,
                        patientFoodCategoryAttachment: item.patientFoodCategoryAttachment ?? null,
                        recipeOilyFishProteinReplaced: item.recipeOilyFishProteinReplaced ?? false,
                    });
                });
            } else if (
                ['MEAL', 'MEDICATION', 'SUPPLEMENT', 'PHYSICAL_ACTIVITY', 'ADDED_BY_PATIENT'].includes(p.type)
            ) {
                rows.push({
                    id: p.id,
                    phase: p,
                    rating: 0,
                    section: '',
                    recipe: null,
                    serving: null,
                    modified: false,
                    order: p.order ?? 0,
                    phaseId: p.id ?? null,
                    sortKey: p.order ?? 0,
                    peopleEatingNumber: 1,
                    patientFoodCategoryQuestion: null,
                    patientFoodCategoryAttachment: null,
                    recipeOilyFishProteinReplaced: false,
                    type: p.type as AddPhaseItemData['type'],
                    status: p.status as 'DONE' | 'PENDING' | 'INCOMPLETE',
                    title: p.meal?.name || p.name || (p.type === 'PHYSICAL_ACTIVITY' ? 'Exercise' : p.type.toLowerCase()),
                });
            }
        });

        return rows.sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0));
    }, [data]);

    const isMealPhase = (type: AddPhaseItemData['type']) => type === 'MEAL';

    const handlePhasePress = (phase: PhaseItem) => {
        if (phase.type === 'MEASUREMENT') {
            const measurementPhase = data?.phases?.find(p => p.type === 'MEASUREMENT');
            const measurementItem = measurementPhase?.items?.find((item: any) => item.id === phase.id);
            if (measurementItem) {
                const measurementType = measurementItem.measurement?.type;
                if (measurementType === 'WEIGHT' && phase.status !== 'DONE') {
                    (navigation as any).navigate('WeightMeasurement', {
                        measurementPhaseItem: measurementItem,
                        date: currentDate,
                    });
                    return;
                }
                if (phase.status === 'DONE') {
                    (navigation as any).navigate('SaveValue', {
                        measurementType: measurementItem.measurement?.type,
                        measurementName: measurementItem.measurement?.name,
                        measurementPhaseItem: measurementItem,
                        date: currentDate,
                    });
                    return;
                }
                const anytimeMeasurement: AnytimeMeasurementItem = {
                    type: 'MEASUREMENT',
                    id: measurementItem.id,
                    phaseId: measurementPhase!.id,
                    measurement: measurementItem.measurement,
                    status: measurementItem.status || 'PENDING',
                };
                setSelectedMeasurement(anytimeMeasurement);
            }
            return;
        }

        if (phase.type === 'ANYTIME' && phase.phaseId) {
            (navigation as any).navigate('Edit', { phaseId: phase.phaseId, date: currentDate });
        } else if (phase.type === 'PHYSICAL_ACTIVITY') {
            const physicalActivityPhase = data?.phases?.find(p => p.type === 'PHYSICAL_ACTIVITY');

            (navigation as any).navigate('ExerciseCategories', {
                list: [],
                deepCounter: 0,
                date: currentDate,
                parentNavigation: navigation,
                onClose: () => navigation.goBack(),
                deepPhaseId: physicalActivityPhase?.id,
                exercisePhaseStatus: physicalActivityPhase?.status,
                onRefresh: () => {
                    dispatch(setDateEntry({
                        date: currentDate,
                        entry: { needsRefresh: true }
                    }));
                }
            });
        } else {
            (navigation as any).navigate('Edit', { phaseId: phase.id, date: currentDate });
        }
    };

    if (isLoading) {
        return (
            <Screen initialized style={styles.container}>
                <DayOverviewSkeleton />
                {/* <View style={styles.content}>
                    <Text variant="h3" style={{ marginTop: 12, marginBottom: 8, color: theme.colors.text }}>
            Loading...
                    </Text>
                </View> */}
            </Screen>
        );
    }

    return (
        <Screen initialized style={styles.container}>
            <View style={styles.content}>
                {/* Health Question Section */}
                <HealthQuestion date={currentDate} isFutureDate={isFutureDateCheck} />

                <Text style={styles.title}>My Daily Plan</Text>

                <View style={styles.timelineContainer}>
                    <FlatList
                        data={phases}
                        style={{ marginBottom: 35 }}
                        keyExtractor={item => String(item.id)}
                        ListHeaderComponent={<TimelineSVG phases={phases} incompleteDay={incompleteDay} />}
                        renderItem={({ item }) => {
                            const { bg, fg, name } = getIconColorByType(item.type);
                            const isMeal = isMealPhase(item.type);
                            const iconMarginLeft = isMeal
                                ? TIMELINE_WIDTH + GAP_SIZE + ICON_MARGIN
                                : TIMELINE_WIDTH + GAP_SIZE + ICON_MARGIN + ICON_SIZE + GAP_SIZE + ICON_MARGIN;

                            const isIncomplete = item.status === PHASE_ITEM_STATUS.INCOMPLETE;
                            const isDone = item.status === PHASE_ITEM_STATUS.DONE;
                            const shouldHighlight = incompleteDay && isIncomplete;
                            const showArrowIcon = shouldHighlight && (item.type === 'MEAL' || item.type === 'ADDED_BY_PATIENT');

                            const displayTitle = item.title === 'added_by_patient' ? 'Added Foods' : filters.humanize(item.title);

                            const renderStatusIndicator = () => {
                                if (isDone) {
                                    return (
                                        <Icon iconStyle="solid" name="check-circle" color={COLORS.GREEN} size={18} />
                                    );
                                }
                                if (incompleteDay && isIncomplete) {
                                    return (
                                        <FeatherIcon name="info" size={18} color={COLORS.BROWN} />
                                    );
                                }
                                return null;
                            };

                            // Status indicator left position - exactly where the dot would be
                            // TIMELINE_WIDTH/2 = 25 for MEAL, offsetLineX = 105 for non-MEAL
                            // Subtract half of icon size (18/2 = 9) to center it
                            const statusLeftPosition = isMeal ? 16 : 96;

                            if (shouldHighlight) {
                                return (
                                    <TouchableOpacity
                                        key={String(item.id)}
                                        style={styles.row}
                                        onPress={() => handlePhasePress(item)}
                                    >
                                        <View style={[styles.statusIndicator, { left: statusLeftPosition }]}>
                                            {renderStatusIndicator()}
                                        </View>
                                        <View style={{ marginLeft: iconMarginLeft }}>
                                            <Highlight color={COLORS.LIGHT_PINK}>
                                                {showArrowIcon ? (
                                                    <Ionicons
                                                        name="chevron-forward-circle-outline"
                                                        color={COLORS.DARK_GREY}
                                                        size={38}
                                                    />
                                                ) : (
                                                    <View style={[styles.iconWrapper, { backgroundColor: bg, marginLeft: 0 }]}>
                                                        <Icon iconStyle="solid" name={name} color={fg} size={18} />
                                                    </View>
                                                )}
                                                <Text variant="h4" style={styles.highlightText}>
                                                    {displayTitle}
                                                </Text>
                                            </Highlight>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }

                            // Normal item (non-highlighted)
                            return (
                                <TouchableOpacity
                                    key={String(item.id)}
                                    style={styles.row}
                                    onPress={() => handlePhasePress(item)}
                                >
                                    {isDone && (
                                        <View style={[styles.statusIndicator, { left: statusLeftPosition }]}>
                                            {renderStatusIndicator()}
                                        </View>
                                    )}
                                    <View style={[styles.iconWrapper, { backgroundColor: bg, marginLeft: iconMarginLeft }]}>
                                        <Icon iconStyle="solid" name={name} color={fg} size={18} />
                                    </View>
                                    <View style={styles.rightContent}>
                                        <Text variant="h4" style={{ color: theme.colors.text }}>
                                            {displayTitle}
                                        </Text>
                                        {/* <Text variant="h5">
                                            Status: {item.status || 'Unknown'}
                                        </Text> */}
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </View>

            <AnytimeMenu
                date={currentDate}
                disabled={isFetching || isLoading}
            />

            {!showCalendar && data?.id && !isFutureDateCheck && (
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleAddButtonPress}
                    disabled={isFetching || isLoading}
                    style={[
                        styles.addBtn,
                        styles.roundBtn,
                        styles.shadowBtn,
                        (isFetching || isLoading) && styles.disabledBtn,
                    ]}
                >
                    <FeatherIcon name="plus" color="#FFFFFF" size={22} />
                    <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
            )}

            {/* Incomplete Day Label */}
            {Boolean(incompleteDay) && (
                <View style={styles.incompleteLabelContainer}>
                    <Highlight color={COLORS.DARKER_PINK}>
                        <View style={styles.incompleteLabel}>
                            <Text
                                style={styles.incompleteText}
                                color={COLORS.DARKENED_GRAY}
                                textAlign="left"
                            >
                                Please
                            </Text>
                            <Text
                                textAlign="left"
                                color={COLORS.DARKENED_GRAY}
                                style={[styles.incompleteText, { marginTop: Platform.OS === 'ios' ? -5 : 0 }]}
                            >
                                complete
                            </Text>
                        </View>
                    </Highlight>
                </View>
            )}

            {/* Floating Calendar Button */}
            {!showCalendar && (
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleCalendar(true)}
                    style={[
                        styles.calendarBtn,
                        styles.shadowBtn,
                        styles.roundBtn,
                    ]}
                >
                    <View style={[
                        styles.roundBtn,
                        { backgroundColor: incompleteDay ? '#dc73de' : '#2978A0', overflow: 'hidden' }
                    ]}>
                        <View style={styles.calendarMonth}>
                            <Text
                                textAlign="center"
                                style={styles.calendarMonthText}
                            >
                                {moment(currentDate).format('MMM')}
                            </Text>
                        </View>
                        <View style={styles.calendarDay}>
                            <Text
                                variant="h3"
                                textAlign="center"
                                style={styles.calendarDayText}
                            >
                                {moment(currentDate).format('DD')}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            )}

            {/* Calendar BottomSheet */}
            <BottomSheet
                index={-1}
                enablePanDownToClose
                ref={bottomSheetRef}
                snapPoints={['60%']}
                onChange={handleSheetChanges}
                backdropComponent={renderBackdrop}
                backgroundStyle={styles.bottomSheetBg}
                handleIndicatorStyle={styles.bottomSheetIndicator}
            >
                <BottomSheetView style={styles.calendarContainer}>
                    <Calendar
                        current={currentDate}
                        markedDates={calendarDays}
                        onDayPress={handleDayPress}
                        theme={{
                            dotColor: '#2978A0',
                            textDayFontSize: 16,
                            textMonthFontSize: 18,
                            arrowColor: '#2978A0',
                            dayTextColor: '#2d4150',
                            textDayFontWeight: '400',
                            textDayHeaderFontSize: 14,
                            monthTextColor: '#2d4150',
                            todayTextColor: '#2978A0',
                            backgroundColor: '#ffffff',
                            textMonthFontWeight: '600',
                            selectedDotColor: '#ffffff',
                            textDisabledColor: '#d9e1e8',
                            calendarBackground: '#ffffff',
                            textDayHeaderFontWeight: '500',
                            selectedDayTextColor: '#ffffff',
                            textSectionTitleColor: '#7B7B7B',
                            selectedDayBackgroundColor: '#2978A0',
                        }}
                    />
                </BottomSheetView>
            </BottomSheet>

            {selectedMeasurement && (
                <MeasurementInputModal
                    disabled={isFetching}
                    item={selectedMeasurement}
                    visible={!!selectedMeasurement}
                    onClose={() => setSelectedMeasurement(null)}
                />
            )}
        </Screen>
    );
};

export default Overview;
