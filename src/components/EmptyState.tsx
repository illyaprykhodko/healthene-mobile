// outsource dependencies
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from '@react-native-vector-icons/feather';
import Animated, { FadeInDown } from 'react-native-reanimated';
// local dependencies
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';

type FeatherIconName = React.ComponentProps<typeof Icon>['name'];

interface EmptyStateProps {
    title: string;
    subtitle?: string;
    /** Feather icon name. Defaults to a neutral "inbox". */
    icon?: FeatherIconName;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle, icon = 'inbox' }) => {
    const theme = useTheme();
    return (
        <Animated.View
            style={styles.container}
            entering={FadeInDown.duration(420).springify().mass(0.9).damping(20)}
        >
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.surfaceAlt }]}>
                <Icon name={icon} size={34} color={theme.colors.textSecondary} />
            </View>
            <Text variant="h4" textAlign="center" style={styles.title} color={theme.colors.text}>
                {title}
            </Text>
            {subtitle ? (
                <Text textAlign="center" color={theme.colors.textSecondary} style={styles.subtitle}>
                    {subtitle}
                </Text>
            ) : null}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: OFFSET.VERTICAL * 2,
        paddingHorizontal: OFFSET.HORIZONTAL * 2,
    },
    iconCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: OFFSET.VERTICAL,
    },
    title: {
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
    },
});
