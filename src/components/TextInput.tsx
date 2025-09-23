// outsource dependencies
import React, { useState } from 'react';
import { StyleSheet, View, TextStyle } from 'react-native';
import { TextInput as MInput, Text } from '@react-native-material/core';
// local dependencies
import { useTheme } from 'hooks/useTheme';

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
    color,
    disabled,
    inputStyle,
    error = {},
    touched = {},
    onChangeText,
    variant = 'standard',
    secureTextEntry = false,
    ...input
}) => {
    const theme = useTheme();
    const errorText = error?.[name];
    const touchedField = touched?.[name];
    const [isBlur, setIsBlur] = useState(false);
    const isShowError = touchedField && errorText;
    const resolvedPrimary = color || theme.colors.primary;
    const resolvedInputStyle: TextStyle = StyleSheet.flatten([
        { textAlign: 'right', color: resolvedPrimary },
        inputStyle,
    ]);
    return (
        <View>
            <MInput
                value={value}
                variant={variant}
                editable={!disabled}
                autoCapitalize="none"
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                selectionColor={theme.colors.info}
                onBlur={() => value && setIsBlur(true)}
                style={{ backgroundColor: 'transparent' }}
                color={isShowError ? theme.colors.error : resolvedPrimary}
                inputStyle={isShowError ? { ...resolvedInputStyle, color: theme.colors.error } : resolvedInputStyle}
                {...input}
            />
            <Text
                style={StyleSheet.flatten([styles.errorText, { color: theme.colors.error, opacity: errorText ? 1 : 0 }])}
            >
                {(isShowError || isBlur) && errorText}
            </Text>
        </View>
    );
};

export default React.memo(TextInput);
