// outsource dependencies
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

// local dependencies
import { isDecimalField } from '../decimal-utils';
import DecimalWheelPicker from './DecimalWheelPicker';
import { ITEM_HEIGHT, WheelPicker } from './WheelPicker';

// ---- Types
export type Field = {
  key: string;
  label: string;
  value?: number;
  data?: number[];
};

export type StepType = 'TIME' | 'DISTANCE';

export interface Workout {
  id: number;
  order: number;
  hours: number;
  type: StepType;
  minutes: number;
  modified: boolean;
  completed: boolean;
  steps: number | null;
  miles: number | null;
  velocity: number | null;
  elevation: number | null;
  resistance: number | null;
}

type MultiWheelPickerProps = {
  fields: Field[]; // mix of regular and decimal fields (decimal detected by isDecimalField)
  step: Record<string, unknown>;
  onApply: (update: Record<string, unknown>) => void;
};

const MultiWheelPicker: React.FC<MultiWheelPickerProps> = ({ step, fields, onApply }) => {
    // NOTE: `values` keeps SELECTED INDEXES for regular wheels (not the values from data[])
    const [values, setValues] = useState<number[]>(() => fields.map(f => f.value ?? 0));

    // Split fields by decimal/regular
    const regularFields = useMemo(() => fields.filter(f => !isDecimalField(f.key)), [fields]);
    const decimalFields = useMemo(() => fields.filter(f => isDecimalField(f.key)), [fields]);

    // Update handler for regular (index-based) wheels
    const handleChange = useCallback(
        (fieldIdx: number, newIdx: number) => {
            setValues(prev => {
                const newValues = [...prev];
                newValues[fieldIdx] = newIdx;

                const result: Record<string, unknown> = {};
                fields.forEach((f, i) => {
                    if (!isDecimalField(f.key)) {
                        result[f.key] = f.data?.[newValues[i]];
                    }
                });

                onApply({ ...step, ...result });
                return newValues;
            });
        },
        [fields, onApply, step]
    );

    const handleDecimalChange = useCallback(
        (update: Record<string, number>) => {
            onApply({ ...step, ...update });
        },
        [onApply, step]
    );

    return (
        <View style={styles.container}>
            {regularFields.map((field, idx) => {
                const fieldIdx = fields.findIndex(f => f.key === field.key);
                const isEven = idx % 2 === 0;

                return (
                    <View key={field.key} style={styles.pickerColumn}>
                        <Text style={styles.title}>{field.label}</Text>
                        <View style={isEven ? styles.backgroundFirst : styles.backgroundSecond}>
                            <WheelPicker
                                data={field.data ?? []}
                                selectedIndex={values[fieldIdx] ?? 0}
                                onSelect={(newIdx: number) => handleChange(fieldIdx, newIdx)}
                                selectedItemStyle={(isEven
                                    ? styles.selectedItemFirst
                                    : styles.selectedItemSecond) as ViewStyle}
                            />
                        </View>
                    </View>
                );
            })}

            {decimalFields.map(field => (
                <View key={field.key} style={{ width: '100%', marginBottom: 20 }}>
                    <DecimalWheelPicker field={field} onApply={handleDecimalChange} />
                </View>
            ))}
        </View>
    );
};

export default MultiWheelPicker;


const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    pickerColumn: {
        marginHorizontal: 3,
        width: '48%',
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
    selectedItemFirst: {
        backgroundColor: '#CAE1F9',
    },
    selectedItemSecond: {
        backgroundColor: '#E8EDD1',
    },
    text: {
        color: '#8E8E8E',
        fontSize: 18,
    },
    backgroundFirst: {
        backgroundColor: 'rgba(224, 235, 247, 0.5)',
    },
    backgroundSecond: {
        backgroundColor: 'rgba(238, 241, 227, 0.5)',
    },
});
