// outsource dependencies
import React, { memo, useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { getClinicRoleLabel } from 'constants/spec';

interface RoleChipsProps {
    roles: string[];
    selected: string | null;
    onSelect: (role: string | null) => void;
}

const ALL_KEY = '__ALL__';

const RoleChipsComponent: React.FC<RoleChipsProps> = ({ roles, selected, onSelect }) => {
    const theme = useTheme();
    const items = useMemo(
        () => [{ key: null, label: 'All' }, ...roles.map(role => ({ key: role, label: getClinicRoleLabel(role) })),],
        [roles]
    );

    return (
        <ScrollView
            horizontal
            style={styles.wrapper}
            contentContainerStyle={styles.content}
            showsHorizontalScrollIndicator={false}
        >
            {items.map(({ key, label }) => {
                const active = selected === key;
                return (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        key={key ?? ALL_KEY}
                        onPress={() => onSelect(key)}
                        style={[
                            styles.chip,
                            { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
                            active && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
                        ]}
                    >
                        <Text
                            numberOfLines={1}
                            style={styles.chipText}
                            color={active ? COLORS.WHITE : theme.colors.primary}
                        >
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
};

export const RoleChips = memo(RoleChipsComponent);
export default RoleChips;

const CHIP_HEIGHT = 34;

const styles = StyleSheet.create({
    wrapper: {
        flexGrow: 0,
        paddingVertical: OFFSET.POINT * 2,
        marginVertical: OFFSET.POINT * 2,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    chip: {
        borderWidth: 1,
        height: CHIP_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: CHIP_HEIGHT / 2,
        marginRight: OFFSET.POINT * 2,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    chipText: {
        fontSize: 13,
        lineHeight: 16,
        // NOTE disable Android's default top/bottom font padding so the text sits
        // visually centered inside the fixed-height chip.
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
});
