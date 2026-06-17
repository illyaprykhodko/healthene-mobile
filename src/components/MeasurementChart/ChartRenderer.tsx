
// outsource dependencies
import {
    G,
    Svg,
    Rect,
    Line,
    Path,
    Circle,
    Text as TextSVG,
} from 'react-native-svg';
import React, {
    memo,
    useMemo,
    useState,
    useEffect,
    useMemo as useReactMemo,
} from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    LayoutChangeEvent,
} from 'react-native';

// local dependencies
import { useThemeContext } from 'providers/ThemeProvider';
import BloodPressureCurrent from './BloodPressureCurrent';
import {
    CENTERED_VALUE_PERIODS,
    type MeasurementTab,
} from 'constants/measurement-chart';
import {
    getDateRangeText,
    calculateInterval,
    getHorizontalLabels,
    getHorizontalLabelPositions,
} from './chart-helpers';

import Animated, {
    withTiming,
    useSharedValue,
    useAnimatedProps,
} from 'react-native-reanimated';
  
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const { width, height } = Dimensions.get('window');
// const column = width / 12;
const column = width / 12;
const graphWidth = column * 9.5;
const paddingShift = 15;
const paddingTopChart = 0;
const horizontalLabelsShift = 20;
const chartHeight = height - 635;

// tooltip box constants
const TOOLTIP_W = 150;
const TOOLTIP_H = 105;
const TOOLTIP_TOP = 10;

// inner padding for chart "plot area"
const paddingX = 20;
const paddingY = 16;

const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(v, max));

/** Helper type for screen coordinates */
type ScreenPoint = { x: number; y: number };

/**
 * Returns control points for Bezier smoothing between p1 -> p2
 * Based on Catmull-Rom to Bezier conversion with a tension factor
 */
const getControlPoints = (
    p0: ScreenPoint,
    p1: ScreenPoint,
    p2: ScreenPoint,
    tension = 0.2
): [ScreenPoint, ScreenPoint] => {
    const d01 = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
    const d12 = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;

    const fa = (tension * d01) / (d01 + d12);
    const fb = (tension * d12) / (d01 + d12);

    const c1: ScreenPoint = {
        x: p1.x - fa * (p2.x - p0.x),
        y: p1.y - fa * (p2.y - p0.y),
    };
    const c2: ScreenPoint = {
        x: p1.x + fb * (p2.x - p0.x),
        y: p1.y + fb * (p2.y - p0.y),
    };

    return [c1, c2];
};

/**
 * Builds a smooth SVG path (Bezier) from screen points
 */
const buildSmoothPath = (pts: ScreenPoint[]): string | null => {
    if (!pts.length) { return null; }
    if (pts.length === 1) {
        const p = pts[0];
        return `M ${p.x} ${p.y}`;
    }
    if (pts.length === 2) {
        const [p0, p1] = pts;
        return `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y}`;
    }

    let d = `M ${pts[0].x} ${pts[0].y}`;

    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = i === 0 ? pts[0] : pts[i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = i + 2 < pts.length ? pts[i + 2] : pts[pts.length - 1];

        const [, cp1] = getControlPoints(p0, p1, p2);
        const [cp2] = getControlPoints(p1, p2, p3);

        d += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
    }

    return d;
};

const shouldShowXLabel = (
    index: number,
    total: number,
    maxLabels: number
): boolean => {
    if (total <= maxLabels) { return true; }
    const step = Math.ceil(total / maxLabels);
    const distFromEnd = (total - 1) - index;
    return distFromEnd % step === 0;
};

interface ChartRendererProps {
    tooltip?: any;
    points: any[];
    restPoints?: any[];
    activeTab: MeasurementTab;
    isBloodPressure?: boolean;
    onPointPress?: (point: any) => void;
    currentValue?: {
        unit: string;
        value: number;
        systolic?: number;
        diastolic?: number;
        isBloodPressure?: boolean;
    };
}

const ChartRenderer: React.FC<ChartRendererProps> = ({
    points,
    tooltip,
    activeTab,
    currentValue,
    onPointPress,
    restPoints = [],
    isBloodPressure = false,
}) => {
    const { theme } = useThemeContext();
    const [containerW, setContainerW] = useState<number>(0);

    const handleLayout = (e: LayoutChangeEvent) => {
        setContainerW(e.nativeEvent.layout.width);
    };

    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = 0;
        progress.value = withTiming(1, { duration: 2000 });
    }, [
        points,
        restPoints,
        activeTab
    ]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDasharray: [1000],
        strokeDashoffset: 1000 - 1000 * progress.value,
    }));
    const pointAnimatedProps = useAnimatedProps(() => ({
        opacity: progress.value,
        r: 6 * progress.value, // from 0 to 6
    }));
      
    const innerPointAnimatedProps = useAnimatedProps(() => ({
        opacity: progress.value,
        r: 2 * progress.value, // from 0 to 2
    }));
    const hasData = points && points.length > 0;

    // --- VALUE RANGE WITH AUTO MARGINS ---
    const allValues = hasData
        ? [...points.map(p => p.y), ...restPoints.map(p => p.y)]
        : [];
    const dataMinValue = hasData ? Math.min(...allValues) : 0;
    const dataMaxValue = hasData ? Math.max(...allValues) : 0;

    const minValue = hasData ? Math.floor(dataMinValue) - 5 : 0;
    let maxValue = hasData ? Math.ceil(dataMaxValue) + 5 : 100;

    if (maxValue === minValue) {
        maxValue = minValue + 1;
    }
    const range = maxValue - minValue;

    const verticalLabels = calculateInterval([minValue, maxValue]);

    const horizontalLabels = getHorizontalLabels(
        activeTab.name,
        activeTab.options.endDate,
        activeTab.count
    );

    const labelDataPositions = getHorizontalLabelPositions(
        activeTab.name,
        activeTab.count
    );

    const isCentered = CENTERED_VALUE_PERIODS.includes(activeTab.name);

    // Inner drawing area
    const innerWidth = graphWidth - paddingX * 2;
    const innerHeight = chartHeight - paddingY * 2;

    const division = innerWidth / activeTab.count;

    const getCx = (xIndex: number) =>
        paddingX
        + (isCentered
            ? division * xIndex - division / 2
            : division * xIndex);

    const getCy = (value: number) =>
        paddingY + ((maxValue - value) * innerHeight) / range;

    const styles = useMemo(() => createStyles(theme), [theme]);

    const dateRange = getDateRangeText(
        activeTab.name,
        activeTab.options.startDate,
        activeTab.options.endDate
    );

    const bpDisplayValue = useReactMemo(() => {
        if (!tooltip) {
            return null;
        }

        const pairValue
            = tooltip.pairY
            ?? tooltip?.additional?.y
            ?? tooltip?.additional?.lastValue
            ?? null;

        if (isBloodPressure && pairValue !== null) {
            if (tooltip.isDiastolic) {
                return `${Math.round(pairValue)}/${Math.round(tooltip.y)}`;
            }
            return `${Math.round(tooltip.y)}/${Math.round(pairValue)}`;
        }

        return `${Math.round(tooltip.y)}`;
    }, [tooltip, isBloodPressure]);

    const tooltipLeft = useReactMemo(() => {
        if (!tooltip) {
            return 0;
        }
        const rawX = (tooltip.cx ?? 0) - TOOLTIP_W / 2;
        return clamp(rawX, 0, Math.max(0, containerW - TOOLTIP_W));
    }, [tooltip, containerW]);

    const validPrimaryPoints = useMemo(
        () => points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y)),
        [points]
    );

    const validSecondaryPoints = useMemo(
        () => restPoints.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y)),
        [restPoints]
    );

    const systolicPath = useMemo(() => {
        if (!hasData || !validPrimaryPoints.length) { return null; }
        const pts: ScreenPoint[] = validPrimaryPoints
            .map(p => ({ x: getCx(p.x), y: getCy(p.y) }))
            .sort((a, b) => a.x - b.x);
        return buildSmoothPath(pts);
    }, [
        hasData,
        minValue,
        maxValue,
        activeTab,
        isCentered,
        validPrimaryPoints,
    ]);

    const diastolicPath = useMemo(() => {
        if (!isBloodPressure || !validSecondaryPoints.length) { return null; }
        const pts: ScreenPoint[] = validSecondaryPoints
            .map(p => ({ x: getCx(p.x), y: getCy(p.y) }))
            .sort((a, b) => a.x - b.x);
        return buildSmoothPath(pts);
    }, [
        minValue,
        maxValue,
        activeTab,
        isCentered,
        isBloodPressure,
        validSecondaryPoints,
    ]);

    const maxLabels
        = containerW > 0 ? Math.max(2, Math.floor(containerW / 40)) : 8;
    return (
        <View style={styles.container} onLayout={handleLayout}>
            <View style={{ opacity: tooltip ? 0 : 1, minHeight: 100 }}>
                {currentValue
                    && (currentValue.isBloodPressure
                    && currentValue.systolic
                    && currentValue.diastolic ? (
                            <BloodPressureCurrent
                                dateRange={dateRange}
                                unit={currentValue.unit}
                                systolic={currentValue.systolic}
                                diastolic={currentValue.diastolic}
                            />
                        ) : (
                            <View style={styles.currentInformation}>
                                <View style={styles.currentValueContainer}>
                                    <Text
                                        style={[styles.currentLabel, { color: theme.colors.textSecondary },]}
                                    >
                                    Current
                                    </Text>
                                    <View style={styles.currentValueRow}>
                                        <Text
                                            style={[styles.currentValue, { color: theme.colors.text },]}
                                        >
                                            {currentValue?.value?.toFixed
                                                ? currentValue.value.toFixed(1)
                                                : currentValue?.value ?? '--'}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.currentUnit,
                                                {
                                                    color: theme.colors
                                                        .textSecondary,
                                                },
                                            ]}
                                        >
                                            {' '}
                                            {currentValue?.unit}
                                        </Text>
                                    </View>
                                    <Text
                                        style={[styles.dateText, { color: theme.colors.textSecondary },]}
                                    >
                                        {dateRange}
                                    </Text>
                                </View>
                            </View>
                        ))}
            </View>

            {tooltip && (
                <>
                    <View
                        pointerEvents="none"
                        style={[
                            styles.tooltipOverlay,
                            {
                                top: TOOLTIP_TOP,
                                width: TOOLTIP_W,
                                left: tooltipLeft,
                                height: TOOLTIP_H,
                                backgroundColor: theme.colors.muted,
                            },
                        ]}
                    >
                        <Text
                            style={[styles.tooltipValue, { color: theme.colors.text },]}
                        >
                            {bpDisplayValue ?? '--'}
                            <Text
                                style={[
                                    styles.tooltipUnit,
                                    {
                                        color: theme.colors.textSecondary,
                                    },
                                ]}
                            >
                                {' '}
                                {tooltip.name
                                    || tooltip.unit
                                    || currentValue?.unit
                                    || ''}
                            </Text>
                        </Text>
                        <Text
                            style={[styles.tooltipDate, { color: theme.colors.textSecondary },]}
                            numberOfLines={1}
                        >
                            {tooltip.dateTime || dateRange}
                        </Text>
                    </View>
                </>
            )}

            {/* CHART */}
            <Svg
                width="100%"
                height={chartHeight + 150}
                onPress={() => {
                    // clear tooltip when tapping empty space
                    onPointPress?.(null);
                }}
            >
                {/* Outer frame */}
                <Rect
                    stroke="#B0B0B0"
                    width={graphWidth}
                    fill="transparent"
                    y={paddingTopChart}
                    height={chartHeight}
                />

                {/* Horizontal labels (X axis) */}
                <G
                    y={chartHeight + paddingTopChart + horizontalLabelsShift}
                    x={0}
                >
                    {horizontalLabels.map((label, index) => {
                        if (
                            !shouldShowXLabel(
                                index,
                                horizontalLabels.length,
                                maxLabels
                            )
                        ) {
                            return null;
                        }

                        const shift = getCx(labelDataPositions[index]);

                        return (
                            <G key={index}>
                                {/* vertical dashed line from label to chart */}
                                {hasData && (
                                    <Line
                                        x1={shift}
                                        x2={shift}
                                        opacity={0.7}
                                        strokeWidth="1"
                                        stroke="#B0B0B0"
                                        strokeDasharray="1, 3"
                                        y1={-horizontalLabelsShift}
                                        y2={-chartHeight - paddingY}
                                    />
                                )}
                                <TextSVG
                                    x={shift}
                                    fontSize={14}
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    fill={theme.colors.textSecondary}
                                >
                                    {label}
                                </TextSVG>
                            </G>
                        );
                    })}
                </G>

                {/* Vertical labels (Y axis values) */}
                {verticalLabels
                    .slice()
                    .reverse()
                    .map((value, index, arr) => {
                        const y
                            = paddingY
                            + (index * innerHeight) / (arr.length - 1);

                        return (
                            <G key={index} y={paddingTopChart} x={graphWidth + 10}>
                                <TextSVG
                                    y={y + 4}
                                    fontSize={12}
                                    fontWeight="bold"
                                    fill={theme.colors.textSecondary}
                                >
                                    {value}
                                </TextSVG>
                                {index > 0 && (
                                    <Line
                                        y1={y}
                                        y2={y}
                                        x2={-10}
                                        opacity={0.3}
                                        strokeWidth="1"
                                        x1={-graphWidth - paddingX}
                                        // x1={-graphWidth + paddingX}
                                        stroke={theme.colors.border}
                                    />
                                )}
                            </G>
                        );
                    })}

                {/* Tooltip vertical line */}
                {tooltip && (
                    <G>
                        <Line
                            opacity={0.7}
                            strokeWidth="1"
                            x1={tooltip.cx}
                            x2={tooltip.cx}
                            stroke="#B0B0B0"
                            y1={paddingY - 50}
                            y2={paddingY + innerHeight}
                        />
                    </G>
                )}

                {/* Empty state */}
                {!hasData && (
                    <G>
                        <TextSVG
                            fontSize="32"
                            fontWeight="bold"
                            x={graphWidth / 2}
                            textAnchor="middle"
                            fill={theme.colors.textSecondary}
                            y={chartHeight / 2 + paddingTopChart}
                        >
                            No Data
                        </TextSVG>
                    </G>
                )}

                {/* MAIN SERIES (SYSTOLIC) */}
                {hasData && (
                    <G>
                        {/* smooth line */}
                        {systolicPath && (
                            <AnimatedPath
                                fill="none"
                                strokeWidth={2}
                                stroke="#E91218"
                                d={systolicPath}
                                animatedProps={animatedProps}
                            />
                            // <Path
                            //     d={systolicPath}
                            //     stroke="#E91218"
                            //     strokeWidth={2}
                            //     fill="none"
                            // />
                        )}

                        {/* points */}
                        {points.map((point, index) => {
                            const isActive
                            = !!tooltip
                            && tooltip.dateTime
                                === (point.displayFromDate || point.fromDate);
                            if (isNaN(point.x) || isNaN(point.y)) {
                                console.error(
                                    '[ChartRenderer] Invalid coordinate:',
                                    { x: point.x, y: point.y }
                                );
                                return null;
                            }

                            const cx = getCx(point.x);
                            const cy = getCy(point.y);

                            if (isNaN(cx) || isNaN(cy)) {
                                console.error(
                                    '[ChartRenderer] Invalid circle position:',
                                    { cx, cy }
                                );
                                return null;
                            }

                            return (
                                <G key={index}>

                                    {/* active highlight behind point */}
                                    {isActive && (
                                        <Circle
                                            r={10}
                                            cx={cx}
                                            cy={cy}
                                            fill="rgba(233, 18, 24, 0.12)" // soft glow
                                        />
                                    )}

                                    {/* visible point */}
                                    <Circle
                                        // animatedProps={pointAnimatedProps}
                                        cx={cx}
                                        cy={cy}
                                        fill="#E91218"
                                        r={isActive ? 7 : 6}
                                    />
                                    <Circle
                                        // animatedProps={innerPointAnimatedProps}
                                        cx={cx}
                                        cy={cy}
                                        r={isActive ? 3 : 2}
                                        fill={theme.colors.white}
                                    />

                                    {/* invisible hit area for taps */}
                                    <Circle
                                        cx={cx}
                                        cy={cy}
                                        r={division}
                                        fill="transparent"
                                        onPress={(e: any) => {
                                            onPointPress?.({
                                                ...point,
                                                cx,
                                                cy,
                                                isDiastolic: false,
                                                unit: currentValue?.unit,
                                                pairY: restPoints[index]?.y,
                                                dateTime: point.displayFromDate || point.fromDate,
                                            });
                                            e?.preventDefault();
                                        }}
                                    />

                                    {/* visible point */}
                                    {/* <Circle
                                        r="6"
                                        cx={cx}
                                        cy={cy}
                                        fill="#E91218"
                                    />
                                    <Circle
                                        r="2"
                                        cx={cx}
                                        cy={cy}
                                        fill={theme.colors.white}
                                    /> */}

                                    {/* invisible hit area for taps */}
                                    {/* <Circle
                                        cx={cx}
                                        cy={cy}
                                        r={division / 2}
                                        fill="transparent"
                                        onPress={(e: any) => {
                                            onPointPress?.({
                                                ...point,
                                                cx,
                                                cy,
                                                isDiastolic: false,
                                                dateTime: point.displayFromDate || point.fromDate,
                                                unit: currentValue?.unit,
                                                pairY: restPoints[index]?.y,
                                            });
                                            e?.preventDefault();
                                        }}
                                    /> */}
                                </G>
                            );
                        })}
                    </G>
                )}

                {/* DIASTOLIC SERIES (SECOND LINE) */}
                {isBloodPressure && restPoints.length > 0 && (
                    <G>
                        {diastolicPath && (
                            <AnimatedPath
                                fill="none"
                                strokeWidth={2}
                                stroke="#156F93"
                                d={diastolicPath}
                                animatedProps={animatedProps}
                            />
                        )}

                        {restPoints.map((point, index) => {
                            if (isNaN(point.x) || isNaN(point.y)) { return null; }
                            const isActive
                            = !!tooltip && tooltip.dateTime === point.fromDate;
                            const cx = getCx(point.x);
                            const cy = getCy(point.y);

                            return (
                                <G key={`rest-${index}`}>
                                    {/* active highlight behind point */}
                                    {isActive && (
                                        <Circle
                                            r={10}
                                            cx={cx}
                                            cy={cy}
                                            fill="rgba(233, 18, 24, 0.12)" // soft glow
                                        />
                                    )}

                                    {/* visible point */}
                                    <Circle
                                        cx={cx}
                                        cy={cy}
                                        fill="#156F93"
                                        r={isActive ? 7 : 6}
                                    />
                                    <Circle
                                        cx={cx}
                                        cy={cy}
                                        r={isActive ? 3 : 2}
                                        fill={theme.colors.white}
                                    />

                                    {/* invisible hit area for taps */}
                                    <Circle
                                        cx={cx}
                                        cy={cy}
                                        r={division}
                                        fill="transparent"
                                        onPress={(e: any) => {
                                            onPointPress?.({
                                                ...point,
                                                cx,
                                                cy,
                                                isDiastolic: true,
                                                pairY: points[index]?.y,
                                                unit: currentValue?.unit,
                                                dateTime: point.displayFromDate || point.fromDate,
                                            });
                                            e?.preventDefault();
                                        }}
                                        // onPress={(e: any) => {
                                        //     onPointPress?.({
                                        //         ...point,
                                        //         cx,
                                        //         cy,
                                        //         isDiastolic: false,
                                        //         dateTime: point.fromDate,
                                        //         unit: currentValue?.unit,
                                        //         pairY: restPoints[index]?.y,
                                        //     });
                                        //     e?.preventDefault();
                                        // }}
                                    />
                                    {/* <Circle
                                        r="6"
                                        cx={cx}
                                        cy={cy}
                                        fill="#156F93"
                                    />
                                    <Circle
                                        r="2"
                                        cx={cx}
                                        cy={cy}
                                        fill={theme.colors.white}
                                    />
                                    <Circle
                                        cx={cx}
                                        cy={cy}
                                        r={division / 2}
                                        fill="transparent"
                                        onPress={(e: any) => {
                                            onPointPress?.({
                                                ...point,
                                                cx,
                                                cy,
                                                isDiastolic: true,
                                                pairY: points[index]?.y,
                                                dateTime: point.fromDate,
                                                unit: currentValue?.unit,
                                            });
                                            e?.preventDefault();
                                        }}
                                    /> */}
                                </G>
                            );
                        })}
                    </G>
                )}
            </Svg>
        </View>
    );
};

export default memo(ChartRenderer);

const createStyles = (theme: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            paddingHorizontal: 20,
        },
        dateText: {
            fontSize: 14,
            marginTop: 2,
        },
        currentInformation: {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 10,
            minHeight: 100,
        },

        currentValueContainer: {
            alignItems: 'center',
            marginLeft: 10,
        },
        currentLabel: {
            fontSize: 14,
            marginBottom: 4,
            fontWeight: '500',
        },
        currentValueRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        currentValue: {
            fontSize: 26,
            fontWeight: 'bold',
        },
        currentUnit: {
            fontSize: 16,
            fontWeight: '600',
        },

        tooltipOverlay: {
            position: 'absolute',
            zIndex: 10,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 8,
            justifyContent: 'center',
        },
        tooltipValue: {
            fontSize: 24,
            fontWeight: 'bold',
        },
        tooltipUnit: {
            fontSize: 14,
            fontWeight: '500',
        },
        tooltipDate: {
            marginTop: 4,
            fontSize: 14,
            fontWeight: '400',
            flexShrink: 1,
        },
    });
