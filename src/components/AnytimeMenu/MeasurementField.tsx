// outsource dependencies
import React from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
// local dependencies
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';
import { MAX_FONT_SCALE } from 'constants/typography';
import type { MeasurementFieldConfig } from 'types/health';

interface MeasurementFieldProps {
    value: string;
    unit?: string;
    error?: string;
    disabled?: boolean;
    onBlur?: () => void;
    field: MeasurementFieldConfig;
    onChange: (text: string) => void;
}

export const MeasurementField: React.FC<MeasurementFieldProps> = ({
    unit,
    field,
    value,
    error,
    onBlur,
    onChange,
    disabled = false,
}) => {
    const theme = useTheme();

    const handleChangeText = (text: string) => {
    // Replace comma with dot for decimal input
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
            <View style={[
                styles.inputContainer,
                {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: error
                        ? theme.colors.error
                        : theme.colors.cerulean300

                },
            ]}>
                <TextInput
                    value={value}
                    onBlur={onBlur}
                    editable={!disabled}
                    placeholder={field.placeholder}
                    onChangeText={handleChangeText}
                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                    maxLength={field.type === 'number' ? 3 : 5}
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType={field.type === 'decimal' ? 'decimal-pad' : 'number-pad'}
                    style={[
                        styles.input,
                        { color: theme.colors.text },
                        error && { color: theme.colors.error },
                    ]}
                />
                {unit && (
                    <Text style={[styles.unit, { color: theme.colors.text }]}>
                        {unit}
                    </Text>
                )}
            </View>

            {error && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {error}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderRadius: 10,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        height: 125,
        fontSize: 72,
        fontWeight: '500',
        textAlign: 'center',
        ...(Platform.OS === 'ios' && { paddingVertical: 0 }),
    },
    unit: {
        fontSize: 32,
        fontWeight: '600',
        marginLeft: 8,
        width: 125,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'right',
        paddingRight: 8,
    },
});
