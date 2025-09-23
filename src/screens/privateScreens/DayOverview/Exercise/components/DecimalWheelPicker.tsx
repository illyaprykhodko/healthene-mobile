// outsource dependencies
import { View, Text, StyleSheet } from 'react-native';
import React, { useCallback, useMemo, useState } from 'react';
// local dependencies
import { ITEM_HEIGHT, WheelPicker } from './WheelPicker';
// ---- Types
type Field = {
  label: string;
  value?: number;
  key: string; // NOTE: this is not the React "key" prop; it's a domain key
  data?: unknown[]; // kept for parity with original prop, though unused here
};

type DecimalWheelPickerProps = {
  field: Field;
  onApply: (update: Record<string, number>) => void;
};

// ---- Constants
const WHOLE_MAX = 500;


const DecimalWheelPicker: React.FC<DecimalWheelPickerProps> = ({ field, onApply }) => {
    // -- Build data arrays once
    const wholeData = useMemo<number[]>(
        () => Array.from({ length: WHOLE_MAX + 1 }, (_, i) => i),
        []
    );
    const decimalData = useMemo<number[]>(
        () => Array.from({ length: 10 }, (_, i) => i),
        []
    );

    // -- Robust initial split (avoids 0.999 rounding to 10 in decimals)
    const initialValue = Math.max(0, Number(field.value ?? 0));
    const totalTenths = Math.round(initialValue * 10);
    const initialWhole = Math.min(WHOLE_MAX, Math.floor(totalTenths / 10));
    const initialDecimal = totalTenths - initialWhole * 10;

    const [wholePart, setWholePart] = useState<number>(initialWhole);
    const [decimalPart, setDecimalPart] = useState<number>(initialDecimal);

    // -- Propagate changes upward
    const emit = useCallback(
        (whole: number, decimal: number) => {
            const result = whole + decimal / 10;
            onApply({ [field.key]: result });
        },
        [field.key, onApply]
    );

    const handleWholeChange = useCallback(
        (newIdx: number) => {
            const newWhole = wholeData[newIdx] ?? 0;
            setWholePart(newWhole);
            emit(newWhole, decimalPart);
        },
        [wholeData, decimalPart, emit]
    );

    const handleDecimalChange = useCallback(
        (newIdx: number) => {
            const newDecimal = decimalData[newIdx] ?? 0;
            setDecimalPart(newDecimal);
            emit(wholePart, newDecimal);
        },
        [decimalData, wholePart, emit]
    );

    return (
        <View style={styles.container}>
            <View style={styles.pickerColumn}>
                <Text style={styles.title}>{field.label}</Text>
                <View style={styles.background}>
                    <WheelPicker
                        data={wholeData}
                        selectedIndex={wholePart}
                        onSelect={handleWholeChange}
                        selectedItemStyle={styles.selectedItem}
                    />
                </View>
            </View>

            <Text style={styles.decimalPoint}>.</Text>

            <View style={styles.pickerColumn}>
                <Text style={styles.title}>Decimal</Text>
                <View style={styles.background}>
                    <WheelPicker
                        data={decimalData}
                        selectedIndex={decimalPart}
                        onSelect={handleDecimalChange}
                        selectedItemStyle={styles.selectedItem}
                    />
                </View>
            </View>
        </View>
    );
};

export default DecimalWheelPicker;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerColumn: {
        marginHorizontal: 3,
        width: '40%',
    },
    decimalPoint: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#8E8E8E',
        marginHorizontal: 10,
    },
    title: {
        fontWeight: 'bold',
        marginVertical: 15,
        fontSize: 16,
        textAlign: 'center',
    },
    item: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedItem: {
        backgroundColor: '#CAE1F9',
    },
    text: {
        color: '#8E8E8E',
        fontSize: 18,
    },
    background: {
        backgroundColor: 'rgba(224, 235, 247, 0.5)',
    },
});
