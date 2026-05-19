// outsource dependencies
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ViewStyle } from 'react-native';

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

// Matches DecimalWheelPicker WHOLE_MAX (500) plus the single decimal place the wheel allows.
const DECIMAL_MAX = 500.9;

// fieldMax returns the largest VALUE the wheel can show (not the wheel index).
const fieldMax = (field: Field) => {
    if (isDecimalField(field.key)) { return DECIMAL_MAX; }
    const data = field.data ?? [];
    return data.length === 0 ? 0 : data[data.length - 1];
};

// Exercise values must be greater than zero — smallest valid step for the picker's precision.
const fieldMin = (field: Field) => (isDecimalField(field.key) ? 0.1 : 1);

// Look up the wheel index for a given value (data no longer starts at 0, so index !== value).
const valueToIndex = (data: number[] | undefined, value: number) => {
    if (!data || data.length === 0) { return 0; }
    const idx = data.indexOf(value);
    return idx === -1 ? 0 : idx;
};

const MultiWheelPicker: React.FC<MultiWheelPickerProps> = ({ step, fields, onApply }) => {
    const [mode, setMode] = useState<'wheel' | 'input'>('wheel');

    // NOTE: `values` keeps SELECTED INDEXES for regular wheels (not the values from data[])
    const [values, setValues] = useState<number[]>(() => fields.map(f => valueToIndex(f.data, f.value ?? 0)));

    // Raw text state for input mode — kept as string so the user can type mid-edits ("12.", "")
    const [inputs, setInputs] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        fields.forEach(f => { initial[f.key] = String(f.value ?? 0); });
        return initial;
    });

    // Per-field validation message shown when the typed value falls outside [min, max]
    const [errors, setErrors] = useState<Record<string, string>>({});

    // The regular wheels now start at 1, but redux may still hold a pre-existing 0 for an
    // older record. Emit a bump on first mount so SAVE persists what the wheel actually shows.
    const didEmitBumps = useRef(false);
    useEffect(() => {
        if (didEmitBumps.current || fields.length === 0) { return; }
        didEmitBumps.current = true;

        const bumps: Record<string, number> = {};
        fields.forEach(f => {
            if (isDecimalField(f.key)) { return; } // decimal fields are handled in DecimalWheelPicker
            const min = fieldMin(f);
            if ((f.value ?? 0) < min) { bumps[f.key] = min; }
        });

        if (Object.keys(bumps).length > 0) {
            onApply({ ...step, ...bumps });
        }
    }, [fields, onApply, step]);

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

    const toggleMode = useCallback(() => {
        setMode(prev => {
            const next = prev === 'wheel' ? 'input' : 'wheel';
            if (next === 'input') {
                // Sync input strings with the current field values when entering input mode
                const fresh: Record<string, string> = {};
                fields.forEach(f => { fresh[f.key] = String(f.value ?? 0); });
                setInputs(fresh);
            }
            setErrors({});
            return next;
        });
    }, [fields]);

    const handleInputChange = useCallback(
        (field: Field, raw: string) => {
            const isDecimal = isDecimalField(field.key);

            // Sanitize: digits only (+ a single '.' for decimal fields), max 1 decimal place
            let clean = raw.replace(/[^0-9.]/g, '');
            if (!isDecimal) {
                clean = clean.replace(/\./g, '');
            } else {
                const parts = clean.split('.');
                if (parts.length > 2) {
                    clean = `${parts[0]}.${parts.slice(1).join('')}`;
                }
                const [whole, dec = ''] = clean.split('.');
                if (dec.length > 1) {
                    clean = `${whole}.${dec[0]}`;
                }
            }

            if (clean === '' || clean === '.') {
                setInputs(prev => ({ ...prev, [field.key]: clean }));
                setErrors(prev => ({ ...prev, [field.key]: '' }));
                return; // wait for more input before emitting
            }

            const parsed = isDecimal ? parseFloat(clean) : parseInt(clean);
            if (Number.isNaN(parsed)) {
                setInputs(prev => ({ ...prev, [field.key]: clean }));
                return;
            }

            const min = fieldMin(field);
            const max = fieldMax(field);
            // While typing "0." the parsed value is 0, but the user is mid-edit — don't nag yet
            const midTypingDecimal = isDecimal && clean.endsWith('.');

            const syncWheel = (value: number) => {
                if (isDecimal) { return; }
                const idx = fields.findIndex(f => f.key === field.key);
                if (idx === -1) { return; }
                setValues(prev => {
                    const next = [...prev];
                    next[idx] = valueToIndex(field.data, value);
                    return next;
                });
            };

            // When the typed value exceeds the max, snap the displayed string to the cap
            // and surface an inline validation message so the user sees why it shrank.
            // For values below the min we show a validation message but keep the displayed
            // text so the user can keep typing (e.g. "1" en route to "10").
            if (parsed > max) {
                clean = isDecimal ? max.toFixed(1) : String(max);
                setInputs(prev => ({ ...prev, [field.key]: clean }));
                setErrors(prev => ({
                    ...prev,
                    [field.key]: `Max: ${isDecimal ? max.toFixed(1) : max}`,
                }));
                onApply({ ...step, [field.key]: max });
                syncWheel(max);
                return;
            }

            if (parsed < min && !midTypingDecimal) {
                setInputs(prev => ({ ...prev, [field.key]: clean }));
                setErrors(prev => ({
                    ...prev,
                    [field.key]: `Min: ${isDecimal ? min.toFixed(1) : min}`,
                }));
                return;
            }

            setInputs(prev => ({ ...prev, [field.key]: clean }));
            setErrors(prev => ({ ...prev, [field.key]: '' }));
            onApply({ ...step, [field.key]: parsed });
            syncWheel(parsed);
        },
        [fields, onApply, step]
    );

    const handleInputBlur = useCallback(
        (field: Field) => {
            const isDecimal = isDecimalField(field.key);
            const min = fieldMin(field);
            const current = inputs[field.key] ?? '';
            const parsed = isDecimal ? parseFloat(current) : parseInt(current);

            // Normalize empty / below-min inputs up to the field's minimum so we never
            // leave the user with an invalid value when they tap away.
            if (current === '' || current === '.' || Number.isNaN(parsed) || parsed < min) {
                const normalized = isDecimal ? min.toFixed(1) : String(min);
                setInputs(prev => ({ ...prev, [field.key]: normalized }));
                setErrors(prev => ({ ...prev, [field.key]: '' }));
                onApply({ ...step, [field.key]: min });

                if (!isDecimal) {
                    const idx = fields.findIndex(f => f.key === field.key);
                    if (idx !== -1) {
                        setValues(prev => {
                            const next = [...prev];
                            next[idx] = valueToIndex(field.data, min);
                            return next;
                        });
                    }
                }
            }
        },
        [inputs, fields, onApply, step]
    );

    const renderInputCell = (field: Field, idx: number, isDecimal: boolean) => {
        const isEven = idx % 2 === 0;
        const error = errors[field.key];
        return (
            <View key={field.key} style={isDecimal ? styles.inputFull : styles.pickerColumn}>
                <Text style={styles.title}>{field.label}</Text>
                <View style={[
                    styles.inputBox,
                    isEven ? styles.backgroundFirst : styles.backgroundSecond,
                ]}>
                    <TextInput
                        value={inputs[field.key] ?? ''}
                        onChangeText={text => handleInputChange(field, text)}
                        onBlur={() => handleInputBlur(field)}
                        keyboardType={isDecimal ? 'decimal-pad' : 'number-pad'}
                        style={styles.inputText}
                        selectTextOnFocus
                        maxLength={isDecimal ? 7 : 6}
                    />
                </View>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
        );
    };

    return (
        <View style={styles.wrapper}>
            <View style={styles.toggleRow}>
                <TouchableOpacity onPress={toggleMode} style={styles.toggleBtn} accessibilityRole="button">
                    <Text style={styles.toggleText}>
                        {mode === 'wheel' ? 'Type values' : 'Use wheels'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.container}>
                {mode === 'wheel' ? (
                    <>
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
                    </>
                ) : (
                    <>
                        {regularFields.map((field, idx) => renderInputCell(field, idx, false))}
                        {decimalFields.map((field, idx) => renderInputCell(field, idx, true))}
                    </>
                )}
            </View>
        </View>
    );
};

export default MultiWheelPicker;


const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
    },
    toggleRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 12,
        marginBottom: 4,
    },
    toggleBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#8E8E8E',
    },
    toggleText: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    pickerColumn: {
        marginHorizontal: 3,
        width: '48%',
    },
    inputFull: {
        marginHorizontal: 3,
        width: '96%',
    },
    inputBox: {
        height: ITEM_HEIGHT * 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputText: {
        fontSize: 28,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        width: '100%',
        paddingVertical: 0,
    },
    errorText: {
        marginTop: 4,
        fontSize: 12,
        color: '#D9534F',
        textAlign: 'center',
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
