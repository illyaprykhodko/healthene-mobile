// outsource dependencies
import moment from 'moment';
import React, { useMemo } from 'react';
import Svg, { Line, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { View, FlatList, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
// local dependencies
import Text from '../../../components/Text';
import { useAppSelector } from '../../../store';
import Screen from '../../../components/Screen';
import { useTheme } from '../../../hooks/useTheme';
import { COLORS } from '../../../constants/colors';
import { selectDayOverview } from '../../../store/slices/dayOverviewSlice';
import { useGetDayOverviewQuery, Phase } from '../../../store/api/dayOverviewApi';

// Temporary types
export type PhaseType = 'MEAL' | 'MEASUREMENT' | 'SUPPLEMENT' | 'MEDICATION' | 'ADDED_BY_PATIENT' | 'PHYSICAL_ACTIVITY';

interface PhaseItem {
    title: string;
    type: PhaseType;
    id: string | number;
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
                // console.log('phases type', phases[i].type);
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
                // upper segment (from previous gap to current dot)
                elements.push(
                    <Line
                        y1={currentY}
                        y2={currentY}
                        x1={mainLineX}
                        // y1={currentY - GAP_SIZE}
                        x2={mainLineX}
                        // y2={currentY - DOT_SIZE / 2}
                        stroke={COLORS.GREY}
                        key={`main-line-upper-${i}`}
                        strokeWidth={CONNECTOR_WIDTH}
                    />
                );
                
                // lower segment (from current dot to next gap)
                if (!isNextPhaseHasMeal) {
                    elements.push(
                        <Line
                            key={`main-line-lower-${i}`}
                            // x1={mainLineX}
                            x1={checkLineX}
                            y1={checkLineY1}
                            y2={nextY - GAP_SIZE}
                            // y1={currentY + DOT_SIZE / 2}
                            x2={checkLineX}
                            // x2={mainLineX}
                            // y2={nextY - GAP_SIZE}
                            stroke={COLORS.GREY}
                            strokeWidth={CONNECTOR_WIDTH}
                        />
                    );
                    elements.push(
                        <Line
                            key={`main-line-lower-${i}`}
                            // x1={offsetLineX}
                            x1={offsetLineX}
                            // y1={currentY + 137}
                            y1={nextY + ROW_HEIGHT + ICON_SIZE - DOT_SIZE}
                            y2={nextY + ROW_HEIGHT * 2 - GAP_SIZE}
                            // y2={nextY + 30}
                            x2={offsetLineX}
                            stroke={COLORS.GREY}
                            strokeWidth={CONNECTOR_WIDTH}
                        />
                    );
                } else {
                    const isPrevPhaseHasMeal = isMealPhase(phases[i].type);
                    // elements.push(
                    //     <Line
                    //         key={`main-line-lower-${i}`}
                    //         x1={offsetLineX}
                    //         y1={currentY + 137}
                    //         y2={nextY + 30}
                    //         x2={offsetLineX}
                    //         stroke={COLORS.GREY}
                    //         strokeWidth={CONNECTOR_WIDTH}
                    //     />
                    // );
                    // !isNextPhaseHasMeal && elements.push(
                    //     <Line
                    //         key={`main-line-lower-${i}`}
                    //         x1={offsetLineX}
                    //         y1={currentY + 137}
                    //         y2={nextY + 30}
                    //         x2={offsetLineX}
                    //         stroke={COLORS.GREY}
                    //         strokeWidth={CONNECTOR_WIDTH}
                    //     />
                    // );
                    // elements.push(
                    //     <Line
                    //         key={`main-line-lower-${i}`}
                    //         x1={offsetLineX}
                    //         y1={currentY + 137}
                    //         y2={nextY + 30}
                    //         x2={offsetLineX}
                    //         stroke={COLORS.GREY}
                    //         strokeWidth={CONNECTOR_WIDTH}
                    //     />
                    // );
                    // }
                    //(i + 1 !== lastMealIndex) &&
                    isPrevPhaseHasMeal && elements.push(
                        <Line
                            key={`main-line-lower-${i}`}
                            x1={mainLineX}
                            y1={currentY + GAP_SIZE}
                            y2={nextY - GAP_SIZE}
                            // y1={currentY + DOT_SIZE / 2}
                            x2={mainLineX}
                            // y2={nextY - GAP_SIZE}
                            stroke={COLORS.GREY}
                            strokeWidth={CONNECTOR_WIDTH}
                        />
                    );
                }
            }
        }
        
        // handle non-meal phases - create isolated segments with gaps
        let currentNonMealStart: number | null = null;
        let nonMealDots: number[] = [];
        
        phases.forEach((phase, index) => {
            const y = index * ROW_HEIGHT + ROW_HEIGHT / 2;
            const isMeal = isMealPhase(phase.type);
            
            if (!isMeal) {
                // Start or continue non-meal segment
                if (currentNonMealStart === null) {
                    currentNonMealStart = y;
                }
                nonMealDots.push(y);
            } else {
                // end non-meal segment
                if (currentNonMealStart !== null && nonMealDots.length > 0) {
                    // create isolated vertical line for non-meal phases with gaps around dots
                    const startY = currentNonMealStart;
                    const endY = y - ROW_HEIGHT / 2;
                    
                    // create segments between dots with gaps
                    for (let i = 0; i < nonMealDots.length; i++) {
                        const dotY = nonMealDots[i];
                        
                        // upper segment (from previous gap to current dot)
                        if (i === 0) {
                            // first dot - from start to dot
                            elements.push(
                                <Line
                                    y1={startY}
                                    x1={offsetLineX}
                                    x2={offsetLineX}
                                    stroke={COLORS.GREY}
                                    y2={dotY - DOT_SIZE / 2}
                                    strokeWidth={CONNECTOR_WIDTH}
                                    key={`non-meal-line-upper-${index}-${i}`}
                                />
                            );
                        } else {
                            // from previous dot gap to current dot
                            const prevDotY = nonMealDots[i - 1];
                            elements.push(
                                <Line
                                    x1={offsetLineX}
                                    x2={offsetLineX}
                                    y2={dotY - GAP_SIZE}
                                    stroke={COLORS.GREY}
                                    y1={prevDotY + GAP_SIZE}
                                    strokeWidth={CONNECTOR_WIDTH}
                                    key={`non-meal-line-upper-${index}-${i}`}
                                />
                            );
                        }
                        
                        // lower segment (from current dot to next gap)
                        if (i === nonMealDots.length - 1) {
                            // last dot - from dot to end
                            elements.push(
                                <Line
                                    x2={offsetLineX}
                                    x1={offsetLineX}
                                    // y1={dotY + DOT_SIZE / 2}
                                    y1={dotY + GAP_SIZE}
                                    // y2={endY}
                                    y2={endY + DOT_SIZE}
                                    stroke={COLORS.GREY}
                                    strokeWidth={CONNECTOR_WIDTH}
                                    key={`non-meal-line-lower-${index}-${i}`}
                                />
                            );
                        } else {
                            // from current dot to next dot gap
                            const nextDotY = nonMealDots[i + 1];
                            elements.push(
                                // <Line
                                //     key={`non-meal-line-lower-${index}-${i}`}
                                //     x1={offsetLineX}
                                //     y1={dotY + DOT_SIZE / 2}
                                //     x2={offsetLineX}
                                //     y2={nextDotY - DOT_SIZE / 2}
                                //     stroke={COLORS.GREY}
                                //     strokeWidth={CONNECTOR_WIDTH}
                                // />
                            );
                        }
                    }
                    // console.log('elements', elements);
                    currentNonMealStart = null;
                    nonMealDots = [];
                }
            }
        });
        
        // handle case where non-meal phases continue to the end
        if (currentNonMealStart !== null && nonMealDots.length > 0) {
            const endY = (phases.length - 1) * ROW_HEIGHT + ROW_HEIGHT / 2;
            const startY = currentNonMealStart;
            // create segments
            for (let i = 0; i < nonMealDots.length; i++) {
                const dotY = nonMealDots[i];
                const isNextPhaseHasMeal = isMealPhase(phases[i + 1].type);
                // upper segment (from previous gap to current dot)
                if (i === 0) {
                    // first dot - from start to dot
                    elements.push(
                        <Line
                            key={`non-meal-line-end-upper-${i}`}
                            x1={offsetLineX}
                            y1={startY}
                            x2={offsetLineX}
                            y2={dotY - DOT_SIZE / 2}
                            stroke={COLORS.GREY}
                            strokeWidth={CONNECTOR_WIDTH}
                        />
                    );
                } else {
                    // From previous dot gap to current dot
                    const prevDotY = nonMealDots[i - 1];
                    !isNextPhaseHasMeal && elements.push(
                        <Line
                            x1={offsetLineX}
                            x2={offsetLineX}
                            y2={dotY - GAP_SIZE}
                            stroke={COLORS.GREY}
                            y1={prevDotY + GAP_SIZE}
                            strokeWidth={CONNECTOR_WIDTH}
                            key={`non-meal-line-end-upper-${i}`}
                        />
                    );
                }
                
                // Lower segment (from current dot to next gap)
                if (i === nonMealDots.length - 1) {
                    // Last dot - from dot to end
                    elements.push(
                        <Line
                            key={`non-meal-line-end-lower-${i}`}
                            x1={offsetLineX}
                            y1={dotY + DOT_SIZE / 2}
                            x2={offsetLineX}
                            y2={endY}
                            stroke={COLORS.GREY}
                            strokeWidth={CONNECTOR_WIDTH}
                        />
                    );
                } else {
                    // From current dot to next dot gap
                    const nextDotY = nonMealDots[i + 1];
                    elements.push(
                        <Line
                            key={`non-meal-line-end-lower-${i}`}
                            x1={offsetLineX}
                            // y1={dotY + 55}
                            y1={dotY + GAP_SIZE}
                            // y1={checkLineY1}
                            x2={offsetLineX}
                            y2={nextDotY - GAP_SIZE}
                            // y2={nextDotY - DOT_SIZE / 2}
                            stroke={COLORS.GREY}
                            strokeWidth={CONNECTOR_WIDTH}
                        />
                    );
                }
            }
        }
        
        // dots and horizontal connectors
        phases.forEach((phase, index) => {
            const y = index * ROW_HEIGHT + ROW_HEIGHT / 2;
            const isMeal = isMealPhase(phase.type);
            const dotX = isMeal ? mainLineX : offsetLineX;
            const iconX = dotX + GAP_SIZE + ICON_SIZE / 2 + ICON_MARGIN;

            elements.push(
                <Circle
                    key={`dot-${index}`}
                    cx={dotX}
                    cy={y}
                    r={DOT_SIZE / 2}
                    fill={COLORS.GREY}
                />
            );

            elements.push(
                <Line
                    key={`connector-${index}`}
                    x1={dotX + GAP_SIZE}
                    y1={y}
                    x2={iconX - GAP_SIZE / 2}
                    y2={y}
                    stroke={COLORS.GREY}
                    strokeWidth={1}
                    strokeDasharray="2,2"
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
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
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
        color: COLORS.DARK_GREY,
        marginVertical: 16,
    },
    timelineContainer: {
        position: 'relative',
        minHeight: 0,
    },
});

const getIconColorByType = (type: PhaseType) => {
    switch (type) {
        case 'MEAL':
            return { bg: '#FFD9B3', fg: '#C56A00', name: 'utensils' as const };
        case 'ADDED_BY_PATIENT':
            return { bg: '#D4E09B', fg: '#647C2E', name: 'plus' as const };
        case 'MEASUREMENT':
            return { bg: COLORS.LIGHT_GREY, fg: COLORS.BLACK, name: 'ruler' as const };
        case 'SUPPLEMENT':
        case 'MEDICATION':
            return { bg: COLORS.LIGHT_GREY, fg: COLORS.BLACK, name: 'capsules' as const };
        case 'PHYSICAL_ACTIVITY':
            return { bg: '#F9C1C3', fg: COLORS.BLACK, name: 'running' as const };
        default:
            return { bg: COLORS.LIGHTER_GREY, fg: COLORS.DARK_GREY, name: 'dot-circle' as const };
    }
};

export const Overview: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation();
    const { date } = useAppSelector(selectDayOverview);
    const currentDate = date || moment().format('YYYY-MM-DD');

    // Skip query if no date available
    const { data, isLoading, error } = useGetDayOverviewQuery(currentDate, {
        skip: !currentDate,
        refetchOnMountOrArgChange: true
    });

    const phases: PhaseItem[] = useMemo(() => {
        if (!data?.phases) { return []; }
        return data.phases.map((p: Phase) => ({
            id: p.id,
            type: p.type as PhaseType,
            title: p.meal?.name || p.measurement?.measurement?.name || p.name || 'Item',
            status: p.status as 'DONE' | 'PENDING' | 'INCOMPLETE',
        }));
    }, [data]);

    const isMealPhase = (type: PhaseType) => type === 'MEAL';

    const handlePhasePress = (phase: PhaseItem) => {
        (navigation as any).navigate('Edit', {
            phaseId: phase.id,
            date: currentDate
        });
    };

    if (isLoading) {
        return (
            <Screen initialized={true} style={styles.container}>
                <View style={styles.content}>
                    <Text variant="h3" style={{ marginTop: 12, marginBottom: 8, color: theme.colors.text }}>
                        Loading...
                    </Text>
                </View>
            </Screen>
        );
    }

    return (
        <Screen initialized={true} style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>
                    My Daily Plan
                </Text>

                <View style={styles.timelineContainer}>
                    <FlatList
                        data={phases}
                        // scrollEnabled={false}
                        keyExtractor={item => String(item.id)}
                        ListHeaderComponent={<TimelineSVG phases={phases} />}
                        renderItem={({ item, index }) => {
                            const { bg, fg, name } = getIconColorByType(item.type);
                            const isMeal = isMealPhase(item.type);
                            const iconMarginLeft = isMeal
                                ? TIMELINE_WIDTH + GAP_SIZE + ICON_MARGIN
                                : TIMELINE_WIDTH + GAP_SIZE + ICON_MARGIN + ICON_SIZE + GAP_SIZE + ICON_MARGIN;

                            return (
                                <TouchableOpacity
                                    key={String(item.id)}
                                    style={styles.row}
                                    onPress={() => handlePhasePress(item)}
                                >
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
        </Screen>
    );
};

export default Overview;
