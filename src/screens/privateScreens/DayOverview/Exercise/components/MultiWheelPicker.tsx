import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ITEM_HEIGHT, WheelPicker } from './WheelPicker';
import DecimalWheelPicker from './DecimalWheelPicker';
import { isDecimalField } from '../decimal-utils';

export interface FieldDef {
    label: string;
    data?: number[] | null;
    value?: number;
    key: string;
}

interface Props {
    step: any;
    fields: FieldDef[];
    onApply: (vals: Record<string, number>) => void;
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    pickerColumn: {
        marginHorizontal: 3,
        width: '48%'
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
    selectedItemFirst: { backgroundColor: '#CAE1F9' },
    selectedItemSecond: { backgroundColor: '#E8EDD1' },
    text: { color: '#8E8E8E', fontSize: 18 },
    backgroundFirst: { backgroundColor: 'rgba(224, 235, 247, 0.5)' },
    backgroundSecond: { backgroundColor: 'rgba(238, 241, 227, 0.5)' },
});

export default function MultiWheelPicker ({ step, fields, onApply }: Props) {
    const [values, setValues] = useState(fields.map(f => f.value ?? 0));

    const regularFields = fields.filter(f => !isDecimalField(f.key));
    const decimalFields = fields.filter(f => isDecimalField(f.key));

    const handleChange = useCallback((fieldIdx: number, newIdx: number) => {
        const newValues = [...values];
        newValues[fieldIdx] = newIdx;
        setValues(newValues);
        const result: Record<string, number> = {};
        fields.forEach((f, i) => {
            if (f.data) { result[f.key] = (f.data as number[])[newValues[i]]; }
        });
        onApply(result);
    }, [fields, values, onApply]);

    const handleDecimalChange = useCallback((update: Record<string, number>) => {
        onApply(update);
    }, [onApply]);

    return (
        <View style={styles.container}>
            {regularFields.map((field, idx) => {
                const fieldIdx = fields.findIndex(f => f.key === field.key);
                return (
                    <View key={field.key} style={styles.pickerColumn}>
                        <Text style={styles.title}>{field.label}</Text>
                        <View style={idx % 2 === 0 ? styles.backgroundFirst : styles.backgroundSecond}>
                            <WheelPicker
                                data={(field.data as number[]) || []}
                                selectedIndex={values[fieldIdx]}
                                onSelect={newIdx => handleChange(fieldIdx, newIdx)}
                                selectedItemStyle={idx % 2 === 0 ? styles.selectedItemFirst : styles.selectedItemSecond}
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
}
