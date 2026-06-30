// outsource dependencies
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// local dependencies
import { useTheme } from 'hooks/useTheme';
import { MAX_FONT_SCALE } from 'constants/typography.ts';

interface BloodPressureSummaryProps {
    unit: string;
    startingSystolic: number;
    startingDiastolic: number;
    totalChangeSystolic: number;
    totalChangeDiastolic: number;
}

const BloodPressureSummary: React.FC<BloodPressureSummaryProps> = ({
    unit,
    startingSystolic,
    startingDiastolic,
    totalChangeSystolic,
    totalChangeDiastolic,
}) => {
    const theme = useTheme();
    const isPositiveSystolic = totalChangeSystolic >= 0;
    const isPositiveDiastolic = totalChangeDiastolic >= 0;

    const displayChangeSystolic = isPositiveSystolic
        ? `+${totalChangeSystolic.toFixed(0)}`
        : totalChangeSystolic.toFixed(0);
    const displayChangeDiastolic = isPositiveDiastolic
        ? `+${totalChangeDiastolic.toFixed(0)}`
        : totalChangeDiastolic.toFixed(0);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surfaceAlt }]}>
            <View style={styles.column}>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.label, { color: theme.colors.secondary }]}>Starting</Text>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.value, { color: theme.colors.text }]}>
                    {Math.round(startingSystolic)}
                    {' / '}
                    {Math.round(startingDiastolic)}
                </Text>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.unit, { color: theme.colors.secondary }]}>{unit}</Text>
            </View>

            <View style={styles.column}>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.label, { color: theme.colors.secondary }]}>Total Change</Text>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.value, { color: theme.colors.text }]}>
                    {displayChangeSystolic}
                    {' / '}
                    {displayChangeDiastolic}
                    {' '}
                </Text>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.valueDiastolic, { color: theme.colors.text }]}>
                    {' '}
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.unit, { color: theme.colors.secondary }]}>{unit}</Text>
                </Text>
            </View>
        </View>
    );
};

export default memo(BloodPressureSummary);

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
    valueDiastolic: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 4,
    },
    unit: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 4,
    },
});
