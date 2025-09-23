// outsource dependencies
import moment from 'moment';
import React, { useEffect, useMemo } from 'react';
import Svg, { Line, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { View, FlatList, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
// local dependencies
import Text from '../../../components/Text';
import Screen from '../../../components/Screen';
import { useTheme } from '../../../hooks/useTheme';
import { OFFSET } from '../../../constants/offset';
import { AnytimeMenu } from '../../../components/AnytimeMenu';
import { useAppDispatch, useAppSelector } from '../../../store';
import { useGetDayOverviewQuery, Phase } from '../../../store/api/dayOverviewApi';
import { selectDayOverview, meta, setDateEntry } from '../../../store/slices/dayOverviewSlice';

// Temporary types
export type PhaseType =
  | 'MEAL'
  | 'ANYTIME'
  | 'QUESTION'
  | 'SUPPLEMENT'
  | 'MEDICATION'
  | 'MEASUREMENT'
  | 'ADDED_BY_PATIENT'
  | 'PHYSICAL_ACTIVITY';

interface PhaseItem {
  title: string;
  type: PhaseType;
  sortKey?: number;
  id: string | number;
  phaseId?: string | number;
  status?: 'DONE' | 'PENDING' | 'INCOMPLETE';
}

const DOT_SIZE = 8;
const GAP_SIZE = 15;
const ICON_SIZE = 40;
const ROW_HEIGHT = 75;
const ICON_MARGIN = 20;
const TIMELINE_WIDTH = 50;
const CONNECTOR_WIDTH = 1;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TimelineSVG: React.FC<{ phases: PhaseItem[] }> = ({ phases }) => {
    const theme = useTheme();
    const mainLineX = TIMELINE_WIDTH / 2;
    const mealIconX = TIMELINE_WIDTH + GAP_SIZE + ICON_MARGIN + ICON_SIZE / 2;
    const offsetLineX = mealIconX;
    const svgHeight = phases.length * ROW_HEIGHT;

    const isMealPhase = (type: PhaseType) => type === 'MEAL';

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

            elements.push(<Circle key={`dot-${index}`} cx={dotX} cy={y} r={DOT_SIZE / 2} fill={theme.colors.grey} />);
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
});

const getIconColorByType = (type: PhaseType) => {
    switch (type) {
        case 'MEAL':
            return { bg: '#FFD9B3', fg: '#C56A00', name: 'utensils' as const };
        case 'ADDED_BY_PATIENT':
            return { bg: '#D4E09B', fg: '#647C2E', name: 'plus' as const };
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
    const navigation = useNavigation();
    const dispatch = useAppDispatch();
    const { date, expectAnswer } = useAppSelector(selectDayOverview);
    const currentDate = date || moment().format('YYYY-MM-DD');

    const { data, isLoading, isFetching } = useGetDayOverviewQuery(currentDate, {
        skip: !currentDate,
        refetchOnMountOrArgChange: true,
    });

    useEffect(() => {
        moment.updateLocale('en', { week: { dow: 1 } });
    }, []);

    useEffect(() => {
        dispatch(meta({ expectAnswer: Boolean(isFetching) }));
    }, [isFetching, dispatch]);

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
                        type: 'MEASUREMENT',
                        title: item.measurement?.name || 'Measurement',
                        sortKey: (p.order ?? 0) + (item.order ?? 0) / 100,
                        status: item.status as 'DONE' | 'PENDING' | 'INCOMPLETE',
                    });
                });
            } else if (
                ['MEAL', 'MEDICATION', 'SUPPLEMENT', 'PHYSICAL_ACTIVITY', 'ADDED_BY_PATIENT'].includes(p.type)
            ) {
                rows.push({
                    id: p.id,
                    sortKey: p.order ?? 0,
                    type: p.type as PhaseType,
                    status: p.status as 'DONE' | 'PENDING' | 'INCOMPLETE',
                    title: p.meal?.name || p.name || (p.type === 'PHYSICAL_ACTIVITY' ? 'Exercise' : p.type.toLowerCase()),
                });
            }
        });

        return rows.sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0));
    }, [data]);

    const isMealPhase = (type: PhaseType) => type === 'MEAL';

    const handlePhasePress = (phase: PhaseItem) => {
        if ((phase.type === 'MEASUREMENT' || phase.type === 'ANYTIME') && phase.phaseId) {
            (navigation as any).navigate('Edit', { phaseId: phase.phaseId, date: currentDate });
        } else if (phase.type === 'PHYSICAL_ACTIVITY') {
            // Find the physical activity phase for status tracking
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
                    // Refetch day overview data to update UI
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
                <View style={styles.content}>
                    <Text variant="h3" style={{ marginTop: 12, marginBottom: 8, color: theme.colors.text }}>
            Loading...
                    </Text>
                </View>
            </Screen>
        );
    }

    return (
        <Screen initialized style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>My Daily Plan</Text>

                <View style={styles.timelineContainer}>
                    <FlatList
                        data={phases}
                        keyExtractor={item => String(item.id)}
                        ListHeaderComponent={<TimelineSVG phases={phases} />}
                        renderItem={({ item }) => {
                            const { bg, fg, name } = getIconColorByType(item.type);
                            const isMeal = isMealPhase(item.type);
                            const iconMarginLeft = isMeal
                                ? TIMELINE_WIDTH + GAP_SIZE + ICON_MARGIN
                                : TIMELINE_WIDTH + GAP_SIZE + ICON_MARGIN + ICON_SIZE + GAP_SIZE + ICON_MARGIN;

                            return (
                                <TouchableOpacity key={String(item.id)} style={styles.row} onPress={() => handlePhasePress(item)}>
                                    <View style={[styles.iconWrapper, { backgroundColor: bg, marginLeft: iconMarginLeft }]}>
                                        <Icon name={name} color={fg} size={18} />
                                    </View>
                                    <View style={styles.rightContent}>
                                        <Text variant="h4" style={{ color: theme.colors.text }}>
                                            {item.title}
                                        </Text>
                                        <Text style={{ color: theme.colors.text, fontSize: 12, marginTop: 4 }}>
                      Status: {item.status || 'Unknown'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </View>

            {/* Anytime Menu */}
            <AnytimeMenu
                date={currentDate}
                disabled={Boolean(expectAnswer) || isLoading}
            />
        </Screen>
    );
};

export default Overview;
