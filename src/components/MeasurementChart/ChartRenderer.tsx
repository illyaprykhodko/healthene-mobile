// outsource dependencies
import { Svg, G, Rect, Line, Circle, Text as TextSVG } from 'react-native-svg';
import React, { memo, useMemo, useState, useMemo as useReactMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';

// local dependencies
import { useThemeContext } from 'providers/ThemeProvider';
import BloodPressureCurrent from './BloodPressureCurrent';
import { CENTERED_VALUE_PERIODS, type MeasurementTab } from 'constants/measurement-chart';
import { getHorizontalLabels, calculateInterval, getDateRangeText } from './chart-helpers';

const { width, height } = Dimensions.get('window');
const column = width / 12;
const graphWidth = column * 10;
const paddingShift = 15;
const paddingTopChart = 0;
const horizontalLabelsShift = 20;
const chartHeight = height - 635;

// tooltip box constants
const TOOLTIP_W = 150;
const TOOLTIP_H = 105;
const TOOLTIP_TOP = 10;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));

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
    const hasData = points && points.length > 0;

    const allValues = hasData ? [...points.map(p => p.y), ...restPoints.map(p => p.y)] : [];
    const dataMinValue = hasData ? Math.ceil(Math.min(...allValues)) : 0;
    const dataMaxValue = hasData ? Math.ceil(Math.max(...allValues)) : 0;
    
    const minValue = hasData ? dataMinValue - 5 : 0;
    const maxValue = hasData ? dataMaxValue + 5 : 100;
    const range = maxValue - minValue;
    
    const verticalLabels = calculateInterval([minValue, maxValue]);

    const horizontalLabels = getHorizontalLabels(
        activeTab.name,
        activeTab.options.startDate,
        activeTab.count
    );

    const division = graphWidth / activeTab.count;
    const isCentered = CENTERED_VALUE_PERIODS.includes(activeTab.name);
    
    const styles = useMemo(() => createStyles(theme), [theme]);

    const dateRange = getDateRangeText(
        activeTab.name,
        activeTab.options.startDate,
        activeTab.options.endDate
    );

    const bpDisplayValue = useReactMemo(() => {
        if (!tooltip) { return null; }

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
        if (!tooltip) { return 0; }
        const rawX = (tooltip.cx ?? 0) - TOOLTIP_W / 2;
        return clamp(rawX, 0, Math.max(0, containerW - TOOLTIP_W));
    }, [tooltip, containerW]);

    return (
        <View
            style={styles.container}
            onLayout={handleLayout}
        >
            <View style={{ opacity: tooltip ? 0 : 1, minHeight: 100 }}>
                {currentValue && (
                    currentValue.isBloodPressure && currentValue.systolic && currentValue.diastolic ? (
                        <BloodPressureCurrent
                            dateRange={dateRange}
                            unit={currentValue.unit}
                            systolic={currentValue.systolic}
                            diastolic={currentValue.diastolic}
                        />
                    ) : (
                        <View style={styles.currentInformation}>
                            <View style={styles.currentValueContainer}>
                                <Text style={[styles.currentLabel, { color: theme.colors.textSecondary }]}>
                                    Current
                                </Text>
                                <View style={styles.currentValueRow}>
                                    <Text style={[styles.currentValue, { color: theme.colors.text }]}>
                                        {currentValue?.value?.toFixed
                                            ? currentValue.value.toFixed(1)
                                            : currentValue?.value ?? '--'}
                                    </Text>
                                    <Text style={[styles.currentUnit, { color: theme.colors.textSecondary }]}>
                                        {' '}{currentValue?.unit}
                                    </Text>
                                </View>
                                <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
                                    {dateRange}
                                </Text>
                            </View>
                        </View>
                    )
                )}
            </View>
            {tooltip && (
                <>
                    <View
                    // pointerEvents="none" so the overlay doesn't block touches on chart
                        pointerEvents="none"
                        style={[
                            styles.tooltipOverlay,
                            {
                                top: TOOLTIP_TOP,
                                width: TOOLTIP_W,
                                left: tooltipLeft,
                                height: TOOLTIP_H,
                                backgroundColor: '#E5E5E5'
                            },
                        ]}
                    >
                        <Text style={[styles.tooltipValue, { color: theme.colors.text }]}>
                            {bpDisplayValue ?? '--'}
                            <Text
                                style={[
                                    styles.tooltipUnit,
                                    { color: theme.colors.textSecondary },
                                ]}
                            >
                                {' '}
                                {tooltip.name || tooltip.unit || currentValue?.unit || ''}
                            </Text>
                        </Text>
                        <Text
                            style={[
                                styles.tooltipDate,
                                { color: theme.colors.textSecondary },
                            ]}
                            numberOfLines={1}
                        >
                            {tooltip.dateTime || dateRange}
                        </Text>
                    </View>
                    {/* <G>
                        <Line
                            x1={tooltip.cx}
                            x2={tooltip.cx}
                            y1={paddingTopChart}
                            y2={chartHeight + paddingTopChart}
                            stroke="#B0B0B0"
                            strokeWidth="1"
                            opacity={0.5}
                        />
                    </G> */}
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
                <Rect
                    stroke="#B0B0B0"
                    width={graphWidth}
                    fill="transparent"
                    y={paddingTopChart}
                    // x={0.5}
                    height={chartHeight}
                />
                <G y={chartHeight + paddingTopChart + horizontalLabelsShift} x={0}>
                    {horizontalLabels.map((label, index) => {
                        const shift = index === 0
                            ? 0
                            : column * (index * (10 / horizontalLabels.length));
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
                                        y2={-chartHeight - paddingShift}
                                    />
                                )}
                                <TextSVG
                                    x={shift}
                                    fontSize={14}
                                    fontWeight="bold"
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
                    .slice() // clone before reverse so we don't mutate original
                    .reverse()
                    .map((value, index, arr) => {
                        const y = (index * chartHeight) / (arr.length - 1);
                        return (
                            <G key={index} y={paddingTopChart} x={graphWidth + 10}>
                                <TextSVG
                                    y={y + 10}
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
                                        x1={-graphWidth}
                                        stroke={theme.colors.border}
                                    />
                                )}
                            </G>
                        );
                    })
                }
                {tooltip && (
                    <G>
                        <Line
                            opacity={0.7}
                            strokeWidth="1"
                            x1={tooltip.cx}
                            x2={tooltip.cx}
                            stroke="#B0B0B0"
                            y1={paddingTopChart}
                            y2={chartHeight + paddingTopChart}
                        />
                    </G>
                )}
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
                {hasData && (
                    <G>
                        {points.map((point, index) => {
                            if (isNaN(point.x) || isNaN(point.y)) {
                                console.error('[ChartRenderer] Invalid coordinate:', { x: point.x, y: point.y });
                                return null;
                            }
                            const cx = isCentered
                                ? division * point.x - division / 2
                                : division * point.x;
                            const cy = ((maxValue - point.y) * chartHeight) / range + paddingShift;

                            if (isNaN(cx) || isNaN(cy)) {
                                console.error('[ChartRenderer] Invalid circle position:', { cx, cy });
                                return null;
                            }
                            let prevX = 0;
                            let prevY = 0;
                            if (index > 0) {
                                const prevPoint = points[index - 1];
                                prevX = isCentered
                                    ? division * prevPoint.x - division / 2
                                    : division * prevPoint.x;
                                prevY = ((maxValue - prevPoint.y) * chartHeight) / range + paddingShift;
                            }

                            const y1 = cy + paddingTopChart - paddingShift;
                            const y2 = prevY + paddingTopChart - paddingShift;

                            return (
                                <G key={index}>
                                    {/* line to previous point */}
                                    {index > 0 && (
                                        <Line
                                            x1={cx}
                                            y1={y1}
                                            x2={prevX + 3}
                                            strokeWidth="2"
                                            stroke={'#E91218'}
                                            y2={index === 1 ? y2 - 3 : y2}
                                            // stroke={isBloodPressure ? '#E91218' : theme.colors.primary}
                                        />
                                    )}

                                    {/* visible point */}
                                    <Circle
                                        r="6"
                                        cx={cx}
                                        cy={cy + paddingTopChart - paddingShift}
                                        fill={'#E91218'}
                                        // fill={isBloodPressure ? '#E91218' : theme.colors.primary}
                                    />
                                    <Circle
                                        r="2"
                                        cx={cx}
                                        fill={theme.colors.white}
                                        cy={cy + paddingTopChart - paddingShift}
                                    />

                                    {/* invisible hit area for taps */}
                                    <Circle
                                        cx={cx}
                                        r={division / 2}
                                        fill="transparent"
                                        cy={cy + paddingTopChart - paddingShift}
                                        onPress={(e: any) => {
                                            // NOTE: we inject pairY ONLY for BP in diastolic render below;
                                            // here this is systolic (or single series)
                                            onPointPress?.({
                                                ...point,
                                                cx,
                                                cy,
                                                isDiastolic: false,
                                                dateTime: point.fromDate,
                                                unit: currentValue?.unit,
                                                pairY: restPoints[index]?.y, // systolic/diastolic pair
                                            });
                                            e?.preventDefault();
                                        }}
                                    />
                                </G>
                            );
                        })}
                    </G>
                )}

                {isBloodPressure && restPoints.length > 0 && (
                    <G>
                        {restPoints.map((point, index) => {
                            if (isNaN(point.x) || isNaN(point.y)) { return null; }

                            const cx = isCentered
                                ? division * point.x - division / 2
                                : division * point.x;
                            
                            const cy = ((maxValue - point.y) * chartHeight) / range + paddingShift;

                            let prevX = 0;
                            let prevY = 0;
                            if (index > 0) {
                                const prevPoint = restPoints[index - 1];
                                prevX = isCentered
                                    ? division * prevPoint.x - division / 2
                                    : division * prevPoint.x;
                                prevY = ((maxValue - prevPoint.y) * chartHeight) / range + paddingShift;
                            }

                            const y1 = cy + paddingTopChart - paddingShift;
                            const y2 = prevY + paddingTopChart - paddingShift;

                            return (
                                <G key={`rest-${index}`}>
                                    {index > 0 && (
                                        <Line
                                            x1={cx}
                                            y1={y1}
                                            x2={prevX}
                                            strokeWidth="2"
                                            stroke="#156F93"
                                            y2={index === 1 ? y2 - 3 : y2}
                                        />
                                    )}

                                    <Circle
                                        r="6"
                                        cx={cx}
                                        fill="#156F93"
                                        cy={cy + paddingTopChart - paddingShift}
                                    />
                                    <Circle
                                        r="2"
                                        cx={cx}
                                        fill={theme.colors.white}
                                        cy={cy + paddingTopChart - paddingShift}
                                    />
                                    <Circle
                                        cx={cx}
                                        r={division / 2}
                                        fill="transparent"
                                        cy={cy + paddingTopChart - paddingShift}
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
                                    />
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

const createStyles = (theme: any) => StyleSheet.create({
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
