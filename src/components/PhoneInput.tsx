// outsource dependencies
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';

// local dependencies
import Text from 'components/Text.tsx';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';

interface PhoneInputProps {
    name: string;
    value?: string;
    label?: string;
    error?: Record<string, string>;
    touched?: Record<string, boolean>;
    onChangeText: (text: string) => void;
}

export const PhoneInput = ({
    name,
    value,
    label,
    error,
    touched,
    onChangeText,
}: PhoneInputProps) => {
    const theme = useTheme();
    const errorText = error?.[name];
    const touchedField = touched?.[name];
    const [isBlur, setIsBlur] = useState(false);
    const isShowError = touchedField && errorText;
    return <View style={styles.container}>
        {label
            ? <Text
                variant="caption"
                color={isShowError ? theme.colors.error : theme.colors.black}
            >
                {label}
            </Text>
            : null
        }
        <MaskedTextInput
            type="custom"
            value={value}
            mask="(999)-999-9999"
            keyboardType="phone-pad"
            onChangeText={onChangeText}
            placeholder="(___) ___-____"
            selectionColor={theme.colors.info}
            onBlur={() => value && setIsBlur(true)}
            style={[
                styles.inputStyle,
                {
                    color: isShowError ? theme.colors.error : theme.colors.black,
                    borderBottomColor: isShowError ? theme.colors.error : theme.colors.grey
                }
            ]}
        />
        <Text
            style={StyleSheet.flatten([styles.errorText, { color: theme.colors.error, opacity: errorText ? 1 : 0 }])}
        >
            {(isShowError || isBlur) && errorText}
        </Text>
    </View>;
};

const styles = StyleSheet.create({
    container: {
        marginBottom: OFFSET.POINT
    },
    inputStyle: {
        paddingVertical: OFFSET.POINT * 2,
        borderBottomWidth: 1
    },
    errorText: {
        fontSize: 12,
    },
});
