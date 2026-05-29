// outsource dependencies
import { View, Text, StyleSheet } from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
// Decimal values must be greater than zero — smallest valid step is 0.1.
const MIN_TENTHS = 1;


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
    const initialTenths = Math.max(MIN_TENTHS, Math.round(initialValue * 10));
    const initialWhole = Math.min(WHOLE_MAX, Math.floor(initialTenths / 10));
    const initialDecimal = initialTenths - initialWhole * 10;

    const [wholePart, setWholePart] = useState<number>(initialWhole);
    const [decimalPart, setDecimalPart] = useState<number>(initialDecimal);

    // If redux held a value below 0.1, the wheel above silently bumps to 0.1 — push that
    // up to the parent on mount so SAVE persists what the user actually sees.
    const wasBumped = useRef(Math.round(initialValue * 10) < MIN_TENTHS).current;
    useEffect(() => {
        if (wasBumped) {
            // Defer: emitting synchronously inside the commit phase fans out a redux
            // notify that reaches ExerciseDetails (parent in the nav stack), tripping
            // React 19's "setState while rendering" warning. Promise microtask defers
            // the dispatch until after the wheel-picker tree has fully committed.
            Promise.resolve().then(() => onApply({ [field.key]: MIN_TENTHS / 10 }));
        }
    }, []);

    // -- Propagate changes upward — snap (0, 0) to (0, 1) so the wheel can't emit 0.0.
    const emit = useCallback(
        (whole: number, decimal: number) => {
            if (whole === 0 && decimal === 0) {
                setDecimalPart(MIN_TENTHS);
                onApply({ [field.key]: MIN_TENTHS / 10 });
                return;
            }
            onApply({ [field.key]: whole + decimal / 10 });
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

export default React.memo(DecimalWheelPicker);

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
