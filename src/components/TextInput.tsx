// outsource dependencies
import React, { useState } from 'react';
import { StyleSheet, View, TextInput as RNInput } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset.ts';

interface TextInputProps {
    name: string;
    value?: string;
    label?: string;
    color?: string;
    disabled: boolean;
    [key: string]: any;
    secureTextEntry?: boolean;
    trailing?: React.ReactNode;
    accessibilityHint?: string;
    accessibilityLabel?: string;
    textAlign?: 'left' | 'right';
    error?: Record<string, string>;
    touched?: Record<string, boolean>;
    onChangeText?: (text: string) => void;
    leading?: (props: any) => React.ReactNode;
}

const TextInput: React.FC<TextInputProps> = ({
    name,
    value,
    color,
    label,
    disabled,
    error = {},
    touched = {},
    onChangeText,
    textAlign = 'right',
    secureTextEntry = false,
    ...input
}) => {
    const theme = useTheme();
    const errorText = error?.[name];
    const touchedField = touched?.[name];
    const [isBlur, setIsBlur] = useState(false);
    const isShowError = touchedField && errorText;
    const resolvedPrimary = color || theme.colors.primary;
    return (
        <View style={styles.container}>
            {label
                ? <Text
                    variant="caption"
                    color={isShowError ? theme.colors.error : theme.colors.black}
                >
                    {label}
                </Text>
                : null
            }
            <RNInput
                value={value}
                editable={!disabled}
                autoCapitalize="none"
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                selectionColor={theme.colors.info}
                onBlur={() => value && setIsBlur(true)}
                style={[
                    styles.inputStyle,
                    {
                        textAlign,
                        color: isShowError ? theme.colors.error : resolvedPrimary,
                        borderBottomColor: isShowError ? theme.colors.error : theme.colors.grey
                    }
                ]}
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

const styles = StyleSheet.create({
    container: {
        marginBottom: OFFSET.POINT
    },
    errorText: {
        fontSize: 12,
    },
    inputStyle: {
        paddingVertical: OFFSET.POINT * 2,
        borderBottomWidth: 1
    }
});
