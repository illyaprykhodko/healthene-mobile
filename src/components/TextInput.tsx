// outsource dependencies
import React, { useState } from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import { StyleSheet, View, TextInput as RNInput, ViewStyle } from 'react-native';

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
    multiline?: boolean;
    styleWrapper?: ViewStyle;
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
    styleWrapper,
    multiline = false,
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
    const [isSecureText, setIsSecureText] = useState(secureTextEntry);
    const toggleSecureIcon = () => setIsSecureText(currentValue => !currentValue);
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
            <View style={[
                styleWrapper,
                styles.inputWrapper,
                {
                    borderBottomColor: isShowError ? theme.colors.error : theme.colors.grey
                }]}>
                <RNInput
                    value={value}
                    editable={!disabled}
                    autoCapitalize="none"
                    multiline={multiline}
                    onChangeText={onChangeText}
                    secureTextEntry={isSecureText}
                    selectionColor={theme.colors.info}
                    numberOfLines={multiline ? 6 : 1}
                    onBlur={() => value && setIsBlur(true)}
                    textAlignVertical={multiline ? 'top' : 'center'}
                    style={[
                        styles.inputStyle,
                        {
                            textAlign,
                            minHeight: multiline ? 120 : 'auto',
                            color: isShowError ? theme.colors.error : resolvedPrimary,
                        }
                    ]}
                    {...input}
                />
                {secureTextEntry
                    ? isSecureText
                        ? <Ionicons onPress={toggleSecureIcon} color={theme.colors.primary} name="eye" size={24}/>
                        : <Ionicons onPress={toggleSecureIcon} color={theme.colors.primary} size={24} name="eye-off" />
                    : null
                }
            </View>
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
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingVertical: OFFSET.POINT * 2,
        borderBottomWidth: 1
    },
    inputStyle: {
        width: '100%',
        flexShrink: 1,
        marginRight: OFFSET.POINT * 2,
    },
    errorText: {
        fontSize: 12,
    }
});
