// outsource dependencies
import React, { useState } from 'react';
import { StyleSheet, View, TextStyle } from 'react-native';
import { TextInput as MInput, Text } from '@react-native-material/core';

interface TextInputProps {
  name: string;
  value?: string;
  label?: string;
  color?: string;
  disabled: boolean;
  [key: string]: any;
  inputStyle?: TextStyle;
  secureTextEntry?: boolean;
  trailing?: React.ReactNode;
  accessibilityHint?: string;
  accessibilityLabel?: string;
  error?: Record<string, string>;
  touched?: Record<string, boolean>;
  onChangeText?: (text: string) => void;
  leading?: (props: any) => React.ReactNode;
  variant?: 'filled' | 'outlined' | 'standard';
}

const styles = StyleSheet.create({
    errorText: {
        fontSize: 12,
    },
});

const TextInput: React.FC<TextInputProps> = ({
    name,
    value,
    disabled,
    error = {},
    touched = {},
    onChangeText,
    color = '#1976d2',
    variant = 'standard',
    secureTextEntry = false,
    inputStyle = { textAlign: 'right', color: '#1976d2' },
    ...input
}) => {
    const errorText = error?.[name];
    const touchedField = touched?.[name];
    const [isBlur, setIsBlur] = useState(false);
    const isShowError = touchedField && errorText;
    return (
        <View>
            <MInput
                value={value}
                variant={variant}
                editable={!disabled}
                autoCapitalize="none"
                selectionColor={'#64b5f6'}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                onBlur={() => value && setIsBlur(true)}
                color={isShowError ? '#d32f2f' : color}
                style={{ backgroundColor: 'transparent' }}
                inputStyle={isShowError ? { ...inputStyle, color: '#d32f2f' } : inputStyle}
                {...input}
            />
            <Text
                style={StyleSheet.flatten([styles.errorText, { color: '#d32f2f', opacity: errorText ? 1 : 0 }])}
            >
                {(isShowError || isBlur) && errorText}
            </Text>
        </View>
    );
};

export default React.memo(TextInput);
