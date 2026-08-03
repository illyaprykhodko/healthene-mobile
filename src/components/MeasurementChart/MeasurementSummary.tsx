// outsource dependencies
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// local dependencies
import { useTheme } from 'hooks/useTheme';
import { MAX_FONT_SCALE } from 'constants/typography.ts';

interface MeasurementSummaryProps {
    startingValue: number;
    totalChange: number;
    unit: string;
}

const MeasurementSummary: React.FC<MeasurementSummaryProps> = ({
    startingValue,
    totalChange,
    unit,
}) => {
    const theme = useTheme();
    const isPositive = totalChange >= 0;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surfaceAlt }]}>
            <View style={styles.column}>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.label, { color: theme.colors.secondary }]}>Starting</Text>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.value, { color: theme.colors.text }]}>
                    {startingValue.toFixed(1)}
                    {' '}
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.unit, { color: theme.colors.secondary }]}>{unit}</Text>
                </Text>
            </View>
            <View style={styles.column}>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.label, { color: theme.colors.secondary }]}>Total Change</Text>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.value, { color: theme.colors.text }, isPositive ? styles.positive : styles.negative]}>
                    {totalChange.toFixed(1)}
                    {' '}
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.unit, { color: theme.colors.secondary }]}>{unit}</Text>
                </Text>
            </View>
        </View>
    );
};

export default memo(MeasurementSummary);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 30,
    },
    column: {
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        marginBottom: 4,
        fontWeight: '400',
    },
    value: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    unit: {
        fontSize: 16,
        fontWeight: '600',
    },
    positive: {},
    negative: {},
});
