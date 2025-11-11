// outsource dependencies
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Dropdown as RNDropdown } from 'react-native-element-dropdown';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';

interface DropdownProps<T> {
    data: T[];
    label: string;
    value?: string;
    touched?: boolean;
    isSearch?: boolean;
    errorText?: string;
    labelField: string;
    valueField: string;
    position?: 'top' | 'auto';
    onSelect: (item: T) => void;
}

export const Dropdown = <T extends Record<string, any>>({
    data,
    label,
    value,
    touched,
    onSelect,
    position,
    errorText,
    valueField,
    labelField,
    isSearch = false
}: DropdownProps<T>) => {
    const theme = useTheme();
    const showError = touched && errorText;
    return <View>
        <Text color={touched && errorText ? theme.colors.error : theme.colors.black} variant="caption">
            {label}
        </Text>
        <RNDropdown
            data={data}
            value={value}
            maxHeight={300}
            search={isSearch}
            placeholder="Select item"
            onChange={item => onSelect(item)}
            labelField={labelField ?? 'label'}
            valueField={valueField ?? 'value'}
            dropdownPosition={position ?? 'auto'}
            selectedTextStyle={styles.selectedTextStyle}
            placeholderStyle={[styles.placeholderStyle, { color: theme.colors.grey }]}
            style={[styles.dropdown, { borderBottomColor: touched && errorText ? theme.colors.error : theme.colors.grey }]}
        />
        {showError ? <Text
            style={StyleSheet.flatten([styles.errorText, { color: theme.colors.error, opacity: errorText ? 1 : 0 }])}
        >
            {errorText}
        </Text> : null}
    </View>;
};

const styles = StyleSheet.create({
    dropdown: {
        height: 40,
        borderBottomWidth: 0.5,
    },
    placeholderStyle: {
        fontSize: 16,
    },
    selectedTextStyle: {
        fontSize: 16,
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
    },
    errorText: {
        marginTop: OFFSET.POINT,
        fontSize: 12,
    },
});
