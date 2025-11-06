// outsource dependencies
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.valuesContainer}>
                    <Text style={styles.label}>Current</Text>
                    <View style={styles.valuesRow}>
                        <View style={styles.valueGroup}>
                            <View style={styles.labelRow}>
                                <View style={[styles.dot, styles.systolicDot]} />
                                <Text style={styles.valueLabel}>SYSTOLIC</Text>
                            </View>
                            <Text style={styles.value}>{Math.round(systolic)} <Text style={styles.separator}>/</Text> </Text>
                        </View>
                        {/* <Text style={styles.separator}>/</Text> */}
                        <View style={styles.valueGroup}>
                            <View style={styles.labelRow}>
                                <View style={[styles.dot, styles.diastolicDot]} />
                                <Text style={styles.valueLabel}>DIASTOLIC</Text>
                            </View>
                            <View style={styles.diastolicValueRow}>
                                <Text style={styles.value}>{Math.round(diastolic)}</Text>
                                <Text style={styles.unit}> {unit}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <Text style={styles.dateText}>{dateRange}</Text>
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
        backgroundColor: '#FFFFFF',
    },
    content: {
        alignItems: 'flex-start',
        paddingLeft: 10,
    },
    label: {
        fontSize: 14,
        color: '#777777',
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
        color: '#999999',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#000000',
    },
    separator: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#7B7B7B', // Gray
        // marginHorizontal: 12,
        // alignSelf: 'flex-start',
    },
    diastolicValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    unit: {
        fontSize: 16,
        color: '#567697',
        fontWeight: '600',
    },
    dateText: {
        fontSize: 14,
        color: '#777777',
        marginTop: 4,
        // marginLeft: 0
        left: -30,
        top: 10,
    },
    valuesContainer: {
        // flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
});
