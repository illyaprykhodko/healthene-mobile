/**
 * MeasurementSummary Component
 * Displays starting value and total change for measurements
 */
// outsource dependencies
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
// local dependencies
// import { useThemeContext } from 'providers/ThemeProvider';

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
    const isPositive = totalChange >= 0;
    // const displayChange = isPositive ? `${totalChange.toFixed(1)}` : totalChange.toFixed(1);

    return (
        <View style={styles.container}>
            <View style={styles.column}>
                <Text style={styles.label}>Starting</Text>
                <Text style={styles.value}>
                    {startingValue.toFixed(1)}
                    {' '}
                    <Text style={styles.unit}>{unit}</Text>
                </Text>
            </View>
            <View style={styles.column}>
                <Text style={styles.label}>Total Change</Text>
                <Text style={[styles.value, isPositive ? styles.positive : styles.negative]}>
                    {totalChange.toFixed(1)}
                    {' '}
                    <Text style={styles.unit}>{unit}</Text>
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
        backgroundColor: '#E0EBF7',
    },
    column: {
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        marginBottom: 4,
        color: '#567697',
        fontWeight: '400',
    },
    value: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#000000',
    },
    unit: {
        color: '#567697',
        fontSize: 16,
        fontWeight: '600',
    },
    positive: {
        // Keep default color
    },
    negative: {
        // Keep default color
    },
});

