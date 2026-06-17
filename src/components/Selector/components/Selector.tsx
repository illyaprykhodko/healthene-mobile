// outsource dependencies
import React from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { humanize } from 'services/filter';
import { useTheme } from 'hooks/useTheme.ts';

interface SelectorProps {
  label: string,
  value?: string,
  touched?: boolean;
  errorText?: string;
  openModalSheet: () => void;
}

export const Selector = ({ label, touched, errorText, value, openModalSheet }: SelectorProps) => {
    const theme = useTheme();
    return <View>
        <Text color={touched && errorText ? theme.colors.error : theme.colors.text} variant="caption">
            {label}
        </Text>
        <Pressable
            onPress={openModalSheet}
            style={[styles.selectBtn, { borderBottomColor: touched && errorText ? theme.colors.error : theme.colors.grey }]}
        >
            <Text color={value ? theme.colors.text : theme.colors.grey}>
                {value ? humanize(value) : 'Select item'}
            </Text>
            <Ionicons color={theme.colors.grey} name="chevron-down-sharp" size={16} />
        </Pressable>
    </View>;
};

export default Selector;
const styles = StyleSheet.create({
    selectBtn: {
        height: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 0.5,
    },
});
