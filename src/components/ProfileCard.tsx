// outsource dependencies
import React, { memo, ReactNode } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { StyleSheet, View, TouchableOpacity } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';

interface ProfileCardProps {
    title: string;
    onEdit?: () => void;
    children?: ReactNode;
    showEditButton?: boolean;
}

const ProfileCardComponent: React.FC<ProfileCardProps> = ({
    title,
    onEdit,
    children,
    showEditButton = true,
}) => {
    const theme = useTheme();

    return (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.cardHeader, { backgroundColor: theme.colors.lighterGrey }]}>
                <Text variant="bold" style={[styles.cardTitle, { color: theme.colors.blue }]}>
                    {title}
                </Text>
                {showEditButton && onEdit && (
                    <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
                        <Icon iconStyle="solid" name="pencil-alt" color={theme.colors.darkGrey} size={16} />
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.cardContent}>
                {children}
            </View>
        </View>
    );
};

export const ProfileCard = memo(ProfileCardComponent);
export default ProfileCard;

const styles = StyleSheet.create({
    card: {
        width: '100%',
        marginBottom: 16,
        borderRadius: 8,
        overflow: 'hidden',
    },
    cardHeader: {
        width: '100%',
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardTitle: {
        fontSize: 16,
    },
    cardContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    editBtn: {
        padding: 8,
    },
});
