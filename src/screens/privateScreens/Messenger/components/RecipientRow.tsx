// outsource dependencies
import React, { memo, useCallback } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { Recipient } from 'types/messenger';
import ProfileImage from 'components/ProfileImage';

interface RecipientRowProps {
    data: Recipient;
    selected?: boolean;
    isPrimary?: boolean;
    onPress: (data: Recipient) => void;
}

const buildName = (data: Recipient): string => {
    if (data.name) { return data.name; }
    const composed = `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim();
    return composed || 'Unknown';
};

const RecipientRowComponent: React.FC<RecipientRowProps> = ({
    data,
    onPress,
    selected = false,
    isPrimary = false,
}) => {
    const theme = useTheme();
    const handlePress = useCallback(() => onPress(data), [onPress, data]);
    const name = buildName(data);
    const clinicName = data.clinic?.name;

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePress}
            style={[
                styles.row,
                { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
                selected && { backgroundColor: theme.colors.surfaceAlt },
            ]}
        >
            <ProfileImage
                width={44}
                height={44}
                style={styles.avatar}
                uri={data.coverImage?.url}
            />
            <View style={styles.body}>
                <View style={styles.nameRow}>
                    <Text variant="bold" numberOfLines={1} style={styles.name} color={theme.colors.text}>{name}</Text>
                    {isPrimary && (
                        <Icon
                            size={12}
                            name="star"
                            iconStyle="solid"
                            style={styles.primaryBadge}
                            color={COLORS.YELLOW}
                        />
                    )}
                </View>
                {!!clinicName && (
                    <Text numberOfLines={1} style={styles.meta} color={theme.colors.textSecondary}>
                        {clinicName}
                    </Text>
                )}
            </View>
            {selected && (
                <Icon
                    size={16}
                    name="check"
                    iconStyle="solid"
                    style={styles.checkmark}
                    color={theme.colors.primary}
                />
            )}
        </TouchableOpacity>
    );
};

export const RecipientRow = memo(RecipientRowComponent);
export default RecipientRow;

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: OFFSET.VERTICAL / 2,
        paddingHorizontal: OFFSET.HORIZONTAL,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    avatar: {
        marginRight: OFFSET.HORIZONTAL,
    },
    body: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    name: {
        fontSize: 15,
        flexShrink: 1,
    },
    meta: {
        fontSize: 13,
        marginTop: 2,
    },
    primaryBadge: {
        marginLeft: OFFSET.POINT,
    },
    checkmark: {
        marginLeft: OFFSET.HORIZONTAL,
    },
});
