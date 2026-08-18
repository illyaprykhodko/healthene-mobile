// outsource dependencies
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// local dependencies
import { useTheme } from 'hooks/useTheme';
import { MAX_FONT_SCALE } from 'constants/typography.ts';

interface BloodPressureCurrentProps {
    unit: string;
    systolic: number;
    diastolic: number;
    dateRange: string;
}

const BloodPressureCurrent: React.FC<BloodPressureCurrentProps> = ({
    unit,
    systolic,
    diastolic,
    dateRange,
}) => {
    const theme = useTheme();
    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.content}>
                <View style={styles.valuesContainer}>
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.label, { color: theme.colors.textSecondary }]}>Current</Text>
                    <View style={styles.valuesRow}>
                        <View style={styles.valueGroup}>
                            <View style={styles.labelRow}>
                                <View style={[styles.dot, styles.systolicDot]} />
                                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.valueLabel, { color: theme.colors.textMuted }]}>SYSTOLIC</Text>
                            </View>
                            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.value, { color: theme.colors.text }]}>
                                {Math.round(systolic)} <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.separator, { color: theme.colors.textSecondary }]}>/</Text>{' '}
                            </Text>
                        </View>
                        <View style={styles.valueGroup}>
                            <View style={styles.labelRow}>
                                <View style={[styles.dot, styles.diastolicDot]} />
                                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.valueLabel, { color: theme.colors.textMuted }]}>DIASTOLIC</Text>
                            </View>
                            <View style={styles.diastolicValueRow}>
                                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.value, { color: theme.colors.text }]}>{Math.round(diastolic)}</Text>
                                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.unit, { color: theme.colors.secondary }]}> {unit}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.dateText, { color: theme.colors.textSecondary }]}>{dateRange}</Text>
            </View>
        </View>
    );
};

export default memo(BloodPressureCurrent);

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    content: {
        alignItems: 'flex-start',
        paddingLeft: 10,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    valuesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    valueGroup: {
        alignItems: 'center',
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    systolicDot: {
        backgroundColor: '#E91218',
    },
    diastolicDot: {
        backgroundColor: '#156F93',
    },
    valueLabel: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    separator: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    diastolicValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    unit: {
        fontSize: 16,
        fontWeight: '600',
    },
    dateText: {
        fontSize: 14,
        marginTop: 4,
        left: -25,
        top: 10,
    },
    valuesContainer: {
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
});
