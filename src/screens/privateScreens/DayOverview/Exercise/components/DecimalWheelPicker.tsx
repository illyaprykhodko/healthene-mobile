import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';

interface FieldDef {
    label: string;
    key: string;
    value?: number;
}

interface Props {
    field: FieldDef;
    onApply: (update: Record<string, number>) => void;
}

export default function DecimalWheelPicker({ field, onApply }: Props) {
    const [value, setValue] = React.useState(String(field.value ?? 0));
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{field.label}</Text>
            <TextInput
                keyboardType="decimal-pad"
                value={value}
                onChangeText={txt => {
                    setValue(txt);
                    const parsed = Number(txt);
                    if (!Number.isNaN(parsed)) {
                        onApply({ [field.key]: parsed });
                    }
                }}
                style={styles.input}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { width: '100%' },
    title: { fontWeight: 'bold', marginVertical: 15, fontSize: 16, textAlign: 'center' },
    input: {
        borderWidth: 1,
        borderColor: '#E1E1E1',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        alignSelf: 'center',
        width: '94%'
    }
});


