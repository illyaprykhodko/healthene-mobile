import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Dropdown as RNDropdown } from 'react-native-element-dropdown';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';

type Item = {
    value: string, label: string
}
interface DropdownProps {
    data: Item[];
    label: string;
    value?: string;
    touched?: boolean;
    errorText?: string;
    onSelect: (value: string) => void;
}

export const Dropdown = ({ data, label, value, onSelect, touched, errorText }: DropdownProps) => {
    const theme = useTheme();


    return <View style={{ }}>
        <Text color={touched && errorText ? theme.colors.error : theme.colors.black} variant="caption">
            {label}
        </Text>
        <RNDropdown
            data={data}
            value={value}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Select item"
            onChange={item => onSelect(item.value)}
            selectedTextStyle={styles.selectedTextStyle}
            placeholderStyle={[styles.placeholderStyle, { color: theme.colors.grey }]}
            style={[styles.dropdown, { borderBottomColor: touched && errorText ? theme.colors.error : theme.colors.grey }]}
        />
        <Text
            style={StyleSheet.flatten([styles.errorText, { color: theme.colors.error, opacity: errorText ? 1 : 0 }])}
        >
            {errorText}
        </Text>
    </View>;
};

const styles = StyleSheet.create({
    dropdown: {
        height: 50,
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
