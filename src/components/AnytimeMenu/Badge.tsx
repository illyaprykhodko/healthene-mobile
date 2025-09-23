// outsource dependencies
import React from 'react';
import { View, StyleSheet } from 'react-native';
// local dependencies
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';

interface BadgeProps {
  children: React.ReactNode;
  count: number;
  showZero?: boolean;
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#f55353',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        zIndex: 1,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export const Badge: React.FC<BadgeProps> = ({
    children,
    count,
    showZero = false
}) => {
    const theme = useTheme();
    const shouldShowBadge = count > 0 || (showZero && count === 0);
    const displayCount = count > 99 ? '99+' : count.toString();

    return (
        <View style={styles.container}>
            {children}
            {shouldShowBadge && (
                <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
                    <Text style={[styles.badgeText, { color: theme.colors.white }]}>
                        {displayCount}
                    </Text>
                </View>
            )}
        </View>
    );
};

