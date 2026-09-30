/**
 * Fixed chart header for the measurement carousel — the "Current" value block, with the scrubbed
 * point fading in on top while dragging. Rendered ONCE above the scrolling plot ribbon. The scrub
 * readout is an absolute overlay so the header height never changes (no plot reflow on touch).
 * Author: Viktor
 */
import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// local dependencies
import type { ScrubInfo } from './skia-chart-helpers';
import { MAX_FONT_SCALE } from 'constants/typography.ts';
import { useThemeContext } from 'providers/ThemeProvider';
import BloodPressureCurrent from './BloodPressureCurrent';

interface ChartHeaderProps {
    dateRange: string;
    isBloodPressure?: boolean;
    scrubInfo?: ScrubInfo | null;
    currentValue?: {
        unit: string;
        value: number;
        systolic?: number;
        diastolic?: number;
        isBloodPressure?: boolean;
    };
}

const ChartHeader: React.FC<ChartHeaderProps> = ({ dateRange, currentValue, scrubInfo, isBloodPressure = false }) => {
    const { theme } = useThemeContext();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const renderCurrent = () => {
        if (!currentValue) {
            return null;
        }
        if (currentValue.isBloodPressure && currentValue.systolic && currentValue.diastolic) {
            return (
                <BloodPressureCurrent
                    dateRange={dateRange}
                    unit={currentValue.unit}
                    systolic={currentValue.systolic}
                    diastolic={currentValue.diastolic}
                />
            );
        }
        return (
            <View style={styles.center}>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Current
                </Text>
                <View style={styles.valueRow}>
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.value, { color: theme.colors.text }]}>
                        {currentValue.value?.toFixed ? currentValue.value.toFixed(1) : (currentValue.value ?? '--')}
                    </Text>
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.unit, { color: theme.colors.textSecondary }]}>
                        {' '}
                        {currentValue.unit}
                    </Text>
                </View>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.date, { color: theme.colors.textSecondary }]}>
                    {dateRange}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.wrap}>
            {renderCurrent()}

            {/* Scrubbed value fades in on top — absolute so it never changes the header height. */}
            {scrubInfo && (
                <Animated.View
                    pointerEvents="none"
                    entering={FadeIn.duration(120)}
                    exiting={FadeOut.duration(120)}
                    style={[styles.overlay, { backgroundColor: theme.colors.background }]}
                >
                    <View style={styles.valueRow}>
                        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.value, { color: theme.colors.text }]}>
                            {isBloodPressure && scrubInfo.value2 !== undefined
                                ? `${Math.round(scrubInfo.value)}/${Math.round(scrubInfo.value2)}`
                                : scrubInfo.value.toFixed(1)}
                        </Text>
                        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.unit, { color: theme.colors.textSecondary }]}>
                            {' '}
                            {currentValue?.unit}
                        </Text>
                    </View>
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.date, { color: theme.colors.textSecondary }]}>
                        {scrubInfo.date}
                    </Text>
                </Animated.View>
            )}
        </View>
    );
};

export default memo(ChartHeader);

const createStyles = (_theme: any) =>
    StyleSheet.create({
        wrap: {
            height: 116,
            justifyContent: 'center',
        },
        center: {
            alignItems: 'center',
        },
        overlay: {
            ...StyleSheet.absoluteFill,
            alignItems: 'center',
            justifyContent: 'center',
        },
        label: {
            fontSize: 14,
            marginBottom: 4,
            fontWeight: '500',
        },
        valueRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        value: {
            fontSize: 26,
            fontWeight: 'bold',
        },
        unit: {
            fontSize: 16,
            fontWeight: '600',
        },
        date: {
            fontSize: 14,
            marginTop: 2,
        },
    });
