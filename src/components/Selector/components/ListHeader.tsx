// outsource dependencies
import { StyleSheet, TextInput, View } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import React, { memo, useEffect, useMemo, useState } from 'react';

// local dependencies
import Text from 'components/Text.tsx';
import { debounce } from 'utils/general.ts';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import Separator from 'components/FlatListSeparator.tsx';
import { MAX_FONT_SCALE } from 'constants/typography.ts';

interface ListHeaderProps {
    value?: string,
    disabled?: boolean;
    throttleMs?: number;
    searchValue?: string;
    placeholder?: string;
    onSearch: (item: string) => void;
}

const ListHeader = ({ searchValue = '', disabled, placeholder, value, onSearch, throttleMs = 500 }: ListHeaderProps) => {
    const theme = useTheme();
    const [localValue, setLocalValue] = useState(searchValue);

    useEffect(() => {
        setLocalValue(searchValue);
    }, [searchValue]);

    const debouncedSearch = useMemo(() => debounce((v: string) => {
        onSearch(v);
    }, throttleMs), [onSearch, throttleMs]);

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);
    
    return (
        <>
            <View style={[styles.inputWrapper, { borderBottomColor: theme.colors.grey, backgroundColor: theme.colors.background }]}>
                <TextInput
                    value={localValue}
                    editable={!disabled}
                    autoCapitalize="none"
                    placeholder={placeholder}
                    onChangeText={(v: string) => {
                        setLocalValue(v);
                        debouncedSearch(v);
                    }}
                    selectionColor={theme.colors.info}
                    maxFontSizeMultiplier={MAX_FONT_SCALE}
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
