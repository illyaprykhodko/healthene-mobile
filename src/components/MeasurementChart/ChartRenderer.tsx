/**
 * ChartRenderer Component
 * SVG chart visualization with points, lines and tooltips
 */
// outsource dependencies
import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Svg, G, Rect, Line, Circle, Text as TextSVG } from 'react-native-svg';
// local dependencies
import { useThemeContext } from 'providers/ThemeProvider';
import { CENTERED_VALUE_PERIODS, type MeasurementTab } from 'constants/measurement-chart';
import { getHorizontalLabels, calculateInterval, getDateRangeText } from './chart-helpers';

const { width, height } = Dimensions.get('window');
const column = width / 12;
const graphWidth = column * 10;
const paddingShift = 10;
const paddingTopChart = 25;
const horizontalLabelsShift = 20;
const chartHeight = height - 550; // Dynamic height

interface ChartRendererProps {
    tooltip?: any;
    points: any[];
    restPoints?: any[];
    activeTab: MeasurementTab;
    isBloodPressure?: boolean;
    onPointPress?: (point: any) => void;
    currentValue?: { value: number; unit: string };
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
    // Always render the chart structure, even with no data
    const hasData = points && points.length > 0;

    const allValues = hasData ? [...points.map(p => p.y), ...restPoints.map(p => p.y)] : [];
    const dataMinValue = hasData ? Math.ceil(Math.min(...allValues)) : 0;
    const dataMaxValue = hasData ? Math.ceil(Math.max(...allValues)) : 0;
    
    const minValue = hasData ? dataMinValue - 5 : 0;
    const maxValue = hasData ? dataMaxValue + 5 : 100;
    const range = maxValue - minValue;
    
    const verticalLabels = calculateInterval([minValue, maxValue]);

    // Calculate horizontal labels
    const horizontalLabels = getHorizontalLabels(
        activeTab.name,
        activeTab.options.startDate,
        activeTab.count
    );

    const division = graphWidth / activeTab.count;
    const isCentered = CENTERED_VALUE_PERIODS.includes(activeTab.name);
    
    // Create dynamic styles with theme
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Get date range for current value display (updates with swipe)
    const dateRange = getDateRangeText(
        activeTab.name,
        activeTab.options.startDate,
        activeTab.options.endDate
    );

    return (
        <View style={styles.container}>
            {/* Current value with date - shows always, updates on swipe */}
            {!tooltip && !isBloodPressure && currentValue && (
                <View style={styles.currentInformation}>
                    <View style={styles.currentValueContainer}>
                        <Text style={[styles.currentLabel, { color: theme.colors.textSecondary }]}>
                            Current
                        </Text>
                        <View style={styles.currentValueRow}>
                            <Text style={[styles.currentValue, { color: theme.colors.text }]}>
                                {currentValue.value.toFixed(1)}
                            </Text>
                            <Text style={[styles.currentUnit, { color: theme.colors.textSecondary }]}>
                                {' '}{currentValue.unit}
                            </Text>
                        </View>
                        <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
                            {dateRange}
                        </Text>
                    </View>
                </View>
            )}
            
            <Svg height={chartHeight + 150} width="100%">
                {/* Chart border */}
                <Rect
                    stroke="#B0B0B0"
                    width={graphWidth}
                    fill="transparent"
                    y={paddingTopChart}
                    height={chartHeight}
                />

                {/* Horizontal labels (dates) with vertical lines */}
                <G y={chartHeight + paddingTopChart + horizontalLabelsShift} x={0}>
                    {horizontalLabels.map((label, index) => {
                        const shift = index === 0 ? 0 : column * (index * (10 / horizontalLabels.length));
                        return (
                            <G key={index}>
                                {/* Vertical dashed line from label to chart */}
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
                                {/* Label text */}
                                <TextSVG x={shift} fill={theme.colors.textSecondary} fontSize={14} fontWeight="bold">
                                    {label}
                                </TextSVG>
                            </G>
                        );
                    })}
                </G>

                {/* Vertical labels (values) */}
                {verticalLabels.reverse().map((value, index) => {
                    const y = (index * chartHeight) / (verticalLabels.length - 1);
                    return (
                        <G key={index} y={paddingTopChart} x={graphWidth + 10}>
                            <TextSVG fill={theme.colors.textSecondary} y={y} fontSize={12} fontWeight="bold">
                                {value}
                            </TextSVG>
                            {index > 0 && (
                                <Line
                                    y1={y}
                                    x2={0}
                                    y2={y}
                                    opacity={0.3}
                                    strokeWidth="1"
                                    x1={-graphWidth - 10}
                                    stroke={theme.colors.border}
                                />
                            )}
                        </G>
                    );
                })}

                {/* No Data text when no data */}
                {!hasData && (
                    <G>
                        <TextSVG
                            fontSize="32"
                            fontWeight="bold"
                            textAnchor="middle"
                            x={graphWidth / 2}
                            fill={theme.colors.textSecondary}
                            y={chartHeight / 2 + paddingTopChart}
                        >
                            No Data
                        </TextSVG>
                    </G>
                )}

                {/* Data points and lines */}
                {hasData && (
                    <G>
                        {points.map((point, index) => {
                            if (isNaN(point.x) || isNaN(point.y)) {
                                console.error('[ChartRenderer] Invalid coordinate:', { x: point.x, y: point.y });
                                return null;
                            }

                            // Calculate cx with centering for WEEK, SIX_MONTH, YEAR (like original CENTERED_VALUE.includes(date))
                            const cx = isCentered
                                ? division * point.x - division / 2
                                : division * point.x;
                        
                            // Calculate cy like original (line 292 in chart.js): (firstItem - y) * (chartHeight / range) + paddingShift
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
                                prevY
                                = ((maxValue - prevPoint.y) * chartHeight) / range
                                + paddingShift;
                            }

                            const y1 = cy + paddingTopChart - paddingShift;
                            const y2 = prevY + paddingTopChart - paddingShift;

                            return (
                                <G key={index}>
                                    {/* Line to previous point */}
                                    {index > 0 && (
                                        <Line
                                            x1={cx}
                                            y1={y1}
                                            x2={prevX + 3}
                                            strokeWidth="2"
                                            stroke={theme.colors.primary}
                                            y2={index === 1 ? y2 - 3 : y2}
                                        />
                                    )}
                                    {/* Point circles */}
                                    <Circle
                                        r="6"
                                        cx={cx}
                                        fill={theme.colors.primary}
                                        cy={cy + paddingTopChart - paddingShift}
                                    />
                                    <Circle
                                        r="2"
                                        cx={cx}
                                        fill={theme.colors.white}
                                        cy={cy + paddingTopChart - paddingShift}
                                    />
                                </G>
                            );
                        })}
                    </G>
                )}

                {/* Blood pressure diastolic line */}
                {isBloodPressure && restPoints.length > 0 && (
                    <G>
                        {restPoints.map((point, index) => {
                            if (isNaN(point.x) || isNaN(point.y)) { return null; }

                            const cx = isCentered
                                ? division * point.x - division / 2
                                : division * point.x;
                            
                            const cy
                                = ((maxValue - point.y) * chartHeight) / range
                                + paddingShift;

                            let prevX = 0;
                            let prevY = 0;
                            if (index > 0) {
                                const prevPoint = restPoints[index - 1];
                                prevX = isCentered
                                    ? division * prevPoint.x - division / 2
                                    : division * prevPoint.x;
                                prevY
                                    = ((maxValue - prevPoint.y) * chartHeight) / range
                                    + paddingShift;
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
                                            y2={index === 1 ? y2 - 3 : y2}
                                            strokeWidth="2"
                                            stroke={theme.colors.success}
                                        />
                                    )}
                                    <Circle
                                        r="6"
                                        cx={cx}
                                        fill={theme.colors.success}
                                        cy={cy + paddingTopChart - paddingShift}
                                    />
                                    <Circle
                                        r="2"
                                        cx={cx}
                                        fill={theme.colors.white}
                                        cy={cy + paddingTopChart - paddingShift}
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    emptyText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
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
});

