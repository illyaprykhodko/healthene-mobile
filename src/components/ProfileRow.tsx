// outsource dependencies
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';

interface ProfileRowProps {
    label: string;
    hideDivider?: boolean;
    value?: string | number | null;
}

const ProfileRowComponent: React.FC<ProfileRowProps> = ({ label, value, hideDivider = false }) => {
    const theme = useTheme();
    const displayValue = value ?? '—';

    return (
        <View
            style={[
                styles.row,
                {
                    borderBottomColor: hideDivider ? 'transparent' : theme.colors.border,
                },
            ]}
        >
            <Text variant="bold" style={[styles.label, { color: theme.colors.darkGrey }]}>
                {label}
            </Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>
                {displayValue}
            </Text>
        </View>
    );
};

export const ProfileRow = memo(ProfileRowComponent);
export default ProfileRow;

const styles = StyleSheet.create({
    row: {
        width: '100%',
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
    },
    label: {
        flex: 1,
        fontSize: 14,
    },
    value: {
        flex: 1,
        fontSize: 14,
        textAlign: 'right',
    },
});
