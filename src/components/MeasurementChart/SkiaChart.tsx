/**
 * Skia-based measurement chart renderer (Apple-Health style).
 *
 * Draws the plot with @shopify/react-native-skia — gradient area fill, smooth animated
 * line(s), points and grid — while axis labels and the "Current" header are plain RN
 * overlays (crisp, accessible, no Skia font loading). Coordinate/size math is driven by an
 * onLayout-measured plot area (no fragile screen-height magic numbers). Blood pressure renders
 * two series (systolic/diastolic). Scrub interaction is added in a later stage.
 *
 * Drop-in for the legacy SVG `ChartRenderer` — same props, so `MeasurementChart` only swaps
 * the component. `ChartRenderer.tsx` is kept as a fallback.
 *
 * Author: Viktor
 */
// outsource dependencies
import React, { memo, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { withTiming, useSharedValue, useReducedMotion } from 'react-native-reanimated';
import { Path, Group, Canvas, Circle, DashPathEffect, LinearGradient, vec } from '@shopify/react-native-skia';

// local dependencies
import { MAX_FONT_SCALE } from 'constants/typography.ts';
import { useThemeContext } from 'providers/ThemeProvider';
import BloodPressureCurrent from './BloodPressureCurrent';
import { buildAreaPath, buildSmoothPath, type ScreenPoint } from './skia-chart-helpers';
import { CENTERED_VALUE_PERIODS, type MeasurementTab } from 'constants/measurement-chart';
import { getDateRangeText, calculateInterval, getHorizontalLabels, getHorizontalLabelPositions } from './chart-helpers';

const PRIMARY_COLOR = '#E91218';
const SECONDARY_COLOR = '#156F93';

// Plot insets. Right gutter reserves room for the Y-axis value labels; bottom for X labels.
const PADDING_X = 20;
const PADDING_TOP = 16;
const Y_GUTTER = 40;
const X_LABEL_H = 28;

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

const shouldShowXLabel = (index: number, total: number, maxLabels: number): boolean => {
    if (total <= maxLabels) {
        return true;
    }
    const step = Math.ceil(total / maxLabels);
    return (total - 1 - index) % step === 0;
};

const SkiaChart: React.FC<ChartRendererProps> = ({
    points,
    activeTab,
    currentValue,
    restPoints = [],
    isBloodPressure = false,
}) => {
    const { theme } = useThemeContext();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [size, setSize] = useState({ w: 0, h: 0 });
    const handleLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setSize(prev => (prev.w === width && prev.h === height ? prev : { w: width, h: height }));
    };

    // draw-on animation (0 -> 1), respecting Reduce Motion
    const progress = useSharedValue(0);
    const reduceMotion = useReducedMotion();
    useEffect(() => {
        if (reduceMotion) {
            progress.value = 1;
            return;
        }
        progress.value = 0;
        progress.value = withTiming(1, { duration: 1100 });
    }, [points, restPoints, activeTab, reduceMotion]);

    const hasData = points && points.length > 0;

    // --- value range with auto margins (same rule as the legacy renderer) ---
    const allValues = hasData ? [...points.map(p => p.y), ...restPoints.map(p => p.y)] : [];
    const dataMin = hasData ? Math.min(...allValues) : 0;
    const dataMax = hasData ? Math.max(...allValues) : 0;
    const minValue = hasData ? Math.floor(dataMin) - 5 : 0;
    let maxValue = hasData ? Math.ceil(dataMax) + 5 : 100;
    if (maxValue === minValue) {
        maxValue = minValue + 1;
    }
    const range = maxValue - minValue;

    const verticalLabels = calculateInterval([minValue, maxValue]);
    const horizontalLabels = getHorizontalLabels(activeTab.name, activeTab.options.endDate, activeTab.count);
    const labelDataPositions = getHorizontalLabelPositions(activeTab.name, activeTab.count);
    const isCentered = CENTERED_VALUE_PERIODS.includes(activeTab.name);
    const dateRange = getDateRangeText(activeTab.name, activeTab.options.startDate, activeTab.options.endDate);

    // --- plot geometry from the measured canvas ---
    const plotLeft = PADDING_X;
    const plotRight = Math.max(plotLeft, size.w - Y_GUTTER);
    const plotTop = PADDING_TOP;
    const plotBottom = Math.max(plotTop, size.h - X_LABEL_H);
    const innerWidth = plotRight - plotLeft;
    const innerHeight = plotBottom - plotTop;
    const division = activeTab.count > 0 ? innerWidth / activeTab.count : innerWidth;

    const getCx = (xIndex: number) => plotLeft + (isCentered ? division * xIndex - division / 2 : division * xIndex);
    const getCy = (value: number) => plotTop + ((maxValue - value) * innerHeight) / range;

    const maxLabels = size.w > 0 ? Math.max(2, Math.floor(size.w / 44)) : 8;

    const toScreen = (arr: any[]): ScreenPoint[] =>
        arr
            .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y))
            .map(p => ({ x: getCx(p.x), y: getCy(p.y) }))
            .sort((a, b) => a.x - b.x);

    const primaryScreen = useMemo(() => toScreen(points), [points, size, minValue, maxValue, activeTab]);
    const secondaryScreen = useMemo(
        () => (isBloodPressure ? toScreen(restPoints) : []),
        [restPoints, isBloodPressure, size, minValue, maxValue, activeTab],
    );

    const primaryPaths = useMemo(() => {
        const line = buildSmoothPath(primaryScreen);
        return { line, area: buildAreaPath(line, primaryScreen, plotBottom) };
    }, [primaryScreen, plotBottom]);

    const secondaryPaths = useMemo(() => {
        const line = buildSmoothPath(secondaryScreen);
        return { line, area: buildAreaPath(line, secondaryScreen, plotBottom) };
    }, [secondaryScreen, plotBottom]);

    const ready = size.w > 0 && size.h > 0;

    return (
        <View style={styles.container}>
            {/* Current value header */}
            <View style={styles.headerWrap}>
                {currentValue
                    && (currentValue.isBloodPressure && currentValue.systolic && currentValue.diastolic ? (
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
                                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                                    style={[styles.currentLabel, { color: theme.colors.textSecondary }]}
                                >
                                    Current
                                </Text>
                                <View style={styles.currentValueRow}>
                                    <Text
                                        maxFontSizeMultiplier={MAX_FONT_SCALE}
                                        style={[styles.currentValue, { color: theme.colors.text }]}
                                    >
                                        {currentValue?.value?.toFixed
                                            ? currentValue.value.toFixed(1)
                                            : (currentValue?.value ?? '--')}
                                    </Text>
                                    <Text
                                        maxFontSizeMultiplier={MAX_FONT_SCALE}
                                        style={[styles.currentUnit, { color: theme.colors.textSecondary }]}
                                    >
                                        {' '}
                                        {currentValue?.unit}
                                    </Text>
                                </View>
                                <Text
                                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                                    style={[styles.dateText, { color: theme.colors.textSecondary }]}
                                >
                                    {dateRange}
                                </Text>
                            </View>
                        </View>
                    ))}
            </View>

            {/* Plot area (measured) */}
            <View style={styles.plotWrap} onLayout={handleLayout}>
                {ready && (
                    <Canvas style={StyleSheet.absoluteFill}>
                        {/* horizontal grid lines aligned to Y labels */}
                        {verticalLabels.map((_, index, arr) => {
                            const y = plotTop + (index * innerHeight) / (arr.length - 1);
                            return (
                                <Path
                                    key={`grid-${index}`}
                                    path={`M ${plotLeft} ${y} L ${plotRight} ${y}`}
                                    style="stroke"
                                    strokeWidth={1}
                                    color={theme.colors.border}
                                    opacity={0.25}
                                />
                            );
                        })}

                        {/* dashed vertical guides under shown X labels */}
                        {hasData
                            && horizontalLabels.map((_, index) => {
                                if (!shouldShowXLabel(index, horizontalLabels.length, maxLabels)) {
                                    return null;
                                }
                                const x = getCx(labelDataPositions[index]);
                                return (
                                    <Path
                                        opacity={0.35}
                                        style="stroke"
                                        strokeWidth={1}
                                        color="#B0B0B0"
                                        key={`vguide-${index}`}
                                        path={`M ${x} ${plotTop} L ${x} ${plotBottom}`}
                                    >
                                        <DashPathEffect intervals={[1, 4]} />
                                    </Path>
                                );
                            })}

                        {/* SYSTOLIC / primary */}
                        {primaryPaths.area && (
                            <Path path={primaryPaths.area} style="fill" opacity={progress}>
                                <LinearGradient
                                    start={vec(0, plotTop)}
                                    end={vec(0, plotBottom)}
                                    colors={[`${PRIMARY_COLOR}47`, `${PRIMARY_COLOR}00`]}
                                />
                            </Path>
                        )}
                        {primaryPaths.line && (
                            <Path
                                start={0}
                                style="stroke"
                                end={progress}
                                strokeWidth={2.5}
                                strokeCap="round"
                                strokeJoin="round"
                                color={PRIMARY_COLOR}
                                path={primaryPaths.line}
                            />
                        )}

                        {/* DIASTOLIC / secondary */}
                        {isBloodPressure && secondaryPaths.area && (
                            <Path path={secondaryPaths.area} style="fill" opacity={progress}>
                                <LinearGradient
                                    start={vec(0, plotTop)}
                                    end={vec(0, plotBottom)}
                                    colors={[`${SECONDARY_COLOR}47`, `${SECONDARY_COLOR}00`]}
                                />
                            </Path>
                        )}
                        {isBloodPressure && secondaryPaths.line && (
                            <Path
                                start={0}
                                style="stroke"
                                end={progress}
                                strokeWidth={2.5}
                                strokeCap="round"
                                strokeJoin="round"
                                color={SECONDARY_COLOR}
                                path={secondaryPaths.line}
                            />
                        )}

                        {/* points */}
                        <Group opacity={progress}>
                            {primaryScreen.map((p, i) => (
                                <Group key={`pp-${i}`}>
                                    <Circle cx={p.x} cy={p.y} r={5} color={PRIMARY_COLOR} />
                                    <Circle cx={p.x} cy={p.y} r={2} color={theme.colors.white} />
                                </Group>
                            ))}
                            {isBloodPressure
                                && secondaryScreen.map((p, i) => (
                                    <Group key={`sp-${i}`}>
                                        <Circle cx={p.x} cy={p.y} r={5} color={SECONDARY_COLOR} />
                                        <Circle cx={p.x} cy={p.y} r={2} color={theme.colors.white} />
                                    </Group>
                                ))}
                        </Group>
                    </Canvas>
                )}

                {/* Empty state */}
                {ready && !hasData && (
                    <View style={styles.emptyWrap} pointerEvents="none">
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No Data</Text>
                    </View>
                )}

                {/* Y-axis value labels (right gutter) */}
                {ready
                    && verticalLabels
                        .slice()
                        .reverse()
                        .map((value, index, arr) => {
                            const y = plotTop + (index * innerHeight) / (arr.length - 1);
                            return (
                                <Text
                                    key={`yl-${index}`}
                                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                                    style={[styles.yLabel, { top: y - 8, color: theme.colors.textSecondary }]}
                                >
                                    {value}
                                </Text>
                            );
                        })}

                {/* X-axis labels (bottom) */}
                {ready
                    && horizontalLabels.map((label, index) => {
                        if (!shouldShowXLabel(index, horizontalLabels.length, maxLabels)) {
                            return null;
                        }
                        const x = getCx(labelDataPositions[index]);
                        return (
                            <Text
                                key={`xl-${index}`}
                                maxFontSizeMultiplier={MAX_FONT_SCALE}
                                style={[styles.xLabel, { left: x - 20, color: theme.colors.textSecondary }]}
                            >
                                {label}
                            </Text>
                        );
                    })}
            </View>
        </View>
    );
};

export default memo(SkiaChart);

const createStyles = (theme: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            paddingHorizontal: 20,
        },
        headerWrap: {
            minHeight: 100,
        },
        plotWrap: {
            flex: 1,
        },
        emptyWrap: {
            ...StyleSheet.absoluteFill,
            alignItems: 'center',
            justifyContent: 'center',
        },
        emptyText: {
            fontSize: 30,
            fontWeight: 'bold',
        },
        yLabel: {
            position: 'absolute',
            right: 0,
            width: Y_GUTTER - 6,
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'left',
        },
        xLabel: {
            position: 'absolute',
            bottom: 4,
            width: 40,
            fontSize: 13,
            fontWeight: 'bold',
            textAlign: 'center',
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
    });
