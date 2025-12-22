// outsource dependencies
import React, { memo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// local dependencies
import Text from 'components/Text.tsx';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import Separator from 'components/Selector/components/Separator.tsx';

// local dependencies

interface ListHeaderProps {
    value?: string,
    disabled?: boolean;
    searchValue?: string;
    placeholder?: string;
    onSearch: (item: string) => void;
}

const ListHeader = ({ searchValue, disabled, placeholder, value, onSearch }: ListHeaderProps) => {
    console.log('Cvalue', value);
    const theme = useTheme();
    return (
        <>
            <View style={[styles.inputWrapper, { borderBottomColor: theme.colors.grey }]}>
                <TextInput
                    value={searchValue}
                    editable={!disabled}
                    autoCapitalize="none"
                    onChangeText={onSearch}
                    placeholder={placeholder}
                    selectionColor={theme.colors.info}
                    style={[styles.inputStyle, { color: theme.colors.black }]}
                />
            </View>

            {
                value
                    ? <View style={styles.itemContainer}>
                        <Icon name="radio-button-checked" size={24} color={theme.colors.primary}/>
                        <Text style={styles.itemText}>{value}</Text>
                    </View>
                    : null
            }
            <Separator />
        </>
    );
};

export default memo(ListHeader);
const styles = StyleSheet.create({
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingVertical: OFFSET.POINT * 2,
        paddingHorizontal: OFFSET.HORIZONTAL,
        borderBottomWidth: 1
    },
    inputStyle: {
        width: '100%',
        flexShrink: 1,
        marginRight: OFFSET.POINT * 2,
    },
    itemText: {
        marginLeft: OFFSET.POINT * 2
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL
    },
});
