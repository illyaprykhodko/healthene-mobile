// outsource dependencies
import React, { memo, useState, useRef, useCallback } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import {
    View,
    StyleSheet,
    TouchableWithoutFeedback,
    TextInput as RNTextInput,
} from 'react-native';

// local dependencies
import { useTheme } from 'hooks/useTheme';

interface SearchInputProps {
    value: string;
    editable?: boolean;
    placeholder?: string;
    onClear?: () => void;
    onChange: (value: string) => void;
}

const SearchInputComponent: React.FC<SearchInputProps> = ({
    value,
    onChange,
    onClear,
    editable = true,
    placeholder = 'Search',
}) => {
    const theme = useTheme();
    const inputRef = useRef<RNTextInput>(null);
    const [focused, setFocused] = useState(false);

    const handleBlur = useCallback(() => setFocused(false), []);
    const handleFocus = useCallback(() => setFocused(true), []);
    const handlePress = useCallback(() => {
        if (editable && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editable]);

    const handleClear = useCallback(() => {
        onChange('');
        onClear?.();
    }, [onChange, onClear]);

    const borderColor = focused ? theme.colors.primary : theme.colors.border;

    return (
        <TouchableWithoutFeedback onPress={handlePress}>
            <View style={[styles.container, { borderColor, backgroundColor: theme.colors.surface }]}>
                <Icon iconStyle="solid" name="search" size={14} color={theme.colors.primary} style={styles.iconSearch} />
                <RNTextInput
                    value={value}
                    maxLength={40}
                    ref={inputRef}
                    editable={editable}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.textSecondary}
                    style={[styles.text, { color: theme.colors.text }]}
                />
                {value ? (
                    <TouchableWithoutFeedback onPress={handleClear}>
                        <View style={styles.iconClear}>
                            <Icon iconStyle="solid" name="times" size={14} color={theme.colors.grey} />
                        </View>
                    </TouchableWithoutFeedback>
                ) : null}
            </View>
        </TouchableWithoutFeedback>
    );
};

export const SearchInput = memo(SearchInputComponent);
export default SearchInput;

const styles = StyleSheet.create({
    container: {
        width: '100%',
        display: 'flex',
        height: 45,
        borderWidth: 1,
        borderRadius: 25,
        flexDirection: 'row',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconSearch: {
        top: 15,
        left: 10,
        textAlign: 'center',
        position: 'absolute',
    },
    iconClear: {
        top: 0,
        right: 0,
        height: 45,
        paddingLeft: 8,
        paddingTop: 15,
        paddingRight: 8,
        position: 'absolute',
    },
    text: {
        height: 30,
        padding: 0,
        fontSize: 16,
        width: '100%',
        paddingLeft: 28,
        display: 'flex',
    },
});
