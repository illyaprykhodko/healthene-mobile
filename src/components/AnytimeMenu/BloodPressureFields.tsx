// outsource dependencies
import React from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
// local dependencies
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';
import type { MeasurementFieldConfig } from 'types/health';

interface BloodPressureFieldsProps {
  disabled?: boolean;
  systolicValue: string;
  diastolicValue: string;
  systolicError?: string;
  diastolicError?: string;
  onSystolicBlur?: () => void;
  onDiastolicBlur?: () => void;
  systolicField: MeasurementFieldConfig;
  diastolicField: MeasurementFieldConfig;
  onSystolicChange: (text: string) => void;
  onDiastolicChange: (text: string) => void;
}

export const BloodPressureFields: React.FC<BloodPressureFieldsProps> = ({
    systolicField,
    systolicValue,
    systolicError,
    diastolicField,
    diastolicError,
    diastolicValue,
    onSystolicBlur,
    onDiastolicBlur,
    disabled = false,
    onSystolicChange,
    onDiastolicChange,
}) => {
    const theme = useTheme();

    const handleTextChange = (
        onChange: (text: string) => void,
        text: string
    ) => {
    // Replace comma with dot
        let processedText = text.replace(',', '.');
        // Remove non-numeric characters except dot
        processedText = processedText.replace(/[^0-9.]/g, '');
        // Allow only one decimal point
        const parts = processedText.split('.');
        if (parts.length > 2) {
            processedText = `${parts[0] }.${ parts.slice(1).join('')}`;
        }
        onChange(processedText);
    };

    return (
        <View style={styles.container}>
            {/* Systolic */}
            <View style={styles.fieldWrapper}>
                <View style={[styles.inputContainer, systolicError && { borderColor: theme.colors.error }]}>
                    <TextInput
                        maxLength={3}
                        editable={!disabled}
                        value={systolicValue}
                        onBlur={onSystolicBlur}
                        keyboardType="number-pad"
                        placeholder={systolicField.placeholder}
                        placeholderTextColor={theme.colors.textSecondary}
                        onChangeText={text => handleTextChange(onSystolicChange, text)}
                        style={[
                            styles.input,
                            { color: theme.colors.text },
                            systolicError && { color: theme.colors.error },
                        ]}
                    />
                </View>
                {systolicError && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                        {systolicError}
                    </Text>
                )}
            </View>

            {/* Visual Separator */}
            <View style={styles.separatorContainer}>
                <View style={[styles.separatorLine, { backgroundColor: theme.colors.blue }]} />
                <Text style={styles.separatorUnit}>mm</Text>
            </View>

            {/* Diastolic */}
            <View style={styles.fieldWrapper}>
                <View style={[styles.inputContainer, diastolicError && { borderColor: theme.colors.error }]}>
                    <TextInput
                        value={diastolicValue}
                        editable={!disabled}
                        maxLength={3}
                        placeholder={diastolicField.placeholder}
                        keyboardType="number-pad"
                        onChangeText={text => handleTextChange(onDiastolicChange, text)}
                        onBlur={onDiastolicBlur}
                        style={[
                            styles.input,
                            { color: theme.colors.text },
                            diastolicError && { color: theme.colors.error },
                        ]}
                        placeholderTextColor={theme.colors.textSecondary}
                    />
                </View>
                {diastolicError && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                        {diastolicError}
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    fieldWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    inputContainer: {
        width: '80%',
        borderWidth: 3,
        borderColor: '#6A92BB',
        borderRadius: 10,
        backgroundColor: '#E0EBF7',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    input: {
        height: 100,
        fontSize: 64,
        fontWeight: '500',
        textAlign: 'center',
        ...(Platform.OS === 'ios' && { paddingVertical: 0 }),
    },
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        marginVertical: 12,
    },
    separatorLine: {
        height: 3,
        width: 175,
        backgroundColor: '#2978A0',
    },
    separatorUnit: {
        position: 'absolute',
        right: -75,
        fontSize: 32,
        fontWeight: '500',
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
});
