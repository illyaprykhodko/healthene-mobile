// outsource dependencies
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
    const isPositiveSystolic = totalChangeSystolic >= 0;
    const isPositiveDiastolic = totalChangeDiastolic >= 0;
    
    const displayChangeSystolic = isPositiveSystolic
        ? `+${totalChangeSystolic.toFixed(0)}`
        : totalChangeSystolic.toFixed(0);
    const displayChangeDiastolic = isPositiveDiastolic
        ? `+${totalChangeDiastolic.toFixed(0)}`
        : totalChangeDiastolic.toFixed(0);

    return (
        <View style={styles.container}>
            {/* Starting Column */}
            <View style={styles.column}>
                <Text style={styles.label}>Starting</Text>
                <Text style={styles.value}>
                    {Math.round(startingSystolic)}
                    {' / '}
                    {Math.round(startingDiastolic)}
                </Text>
                <Text style={styles.unit}>{unit}</Text>
                {/* <Text style={styles.value}> */}
                {/* {' '} */}
                {/* </Text> */}
            </View>

            {/* Total Change Column */}
            <View style={styles.column}>
                <Text style={styles.label}>Total Change</Text>
                <Text style={styles.value}>
                    {displayChangeSystolic}
                    {' / '}
                    {displayChangeDiastolic}
                    {' '}
                </Text>
                <Text style={styles.valueDiastolic}>
                    {' '}
                    <Text style={styles.unit}>{unit}</Text>
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
    valueDiastolic: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
        marginTop: 4,
    },
    unit: {
        color: '#567697',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 4,
    },
});
