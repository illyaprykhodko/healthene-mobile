// outsource dependencies
import React, { memo, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';
import Checkbox from 'components/Checkbox';

interface SelectableListItemProps {
    id: number;
    name: string;
    selected: boolean;
    onToggle: (id: number, selected: boolean) => void;
}

const SelectableListItemComponent: React.FC<SelectableListItemProps> = ({
    id,
    name,
    selected,
    onToggle,
}) => {
    const theme = useTheme();

    const handleToggle = useCallback(() => {
        onToggle(id, !selected);
    }, [id, selected, onToggle]);

    return (
        <TouchableOpacity
            onPress={handleToggle}
            style={[styles.item, { borderBottomColor: theme.colors.border }]}
        >
            <View style={styles.checkboxWrapper}>
                <Checkbox value={selected} onChange={handleToggle} />
            </View>
            <View style={styles.textWrapper}>
                <Text style={[styles.name, { color: theme.colors.text }]}>{name}</Text>
            </View>
        </TouchableOpacity>
    );
};

export const SelectableListItem = memo(SelectableListItemComponent);
export default SelectableListItem;

const styles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    checkboxWrapper: {
        marginRight: 12,
    },
    textWrapper: {
        flex: 1,
    },
    name: {
        fontSize: 14,
    },
});
