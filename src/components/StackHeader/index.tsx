// outsource dependencies
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// local dependencies
import Text from 'components/Text';
import BackBtn from 'components/BackBtn';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { Hamburger } from 'components/Hamburger';

interface StackHeaderProps {
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
    onOpenDrawer: () => void;
    centerContent?: React.ReactNode;
}

const StackHeader: React.FC<StackHeaderProps> = ({
    title,
    onBack,
    onOpenDrawer,
    centerContent,
    showBack = true,
}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const paddingTop = Platform.OS === 'android'
        ? insets.top + OFFSET.VERTICAL
        : insets.top;

    return (
        <View style={[styles.header, { paddingTop, backgroundColor: theme.colors.primary }]}>
            <View style={styles.side}>
                {showBack && onBack ? (
                    <BackBtn onPress={onBack} color={theme.colors.white} />
                ) : null}
            </View>
            <View style={styles.center}>
                {centerContent ?? (
                    <Text variant="h4" style={{ color: theme.colors.white }}>
                        {title}
                    </Text>
                )}
            </View>
            <View style={[styles.side, styles.sideRight]}>
                <Hamburger onPress={onOpenDrawer} />
            </View>
        </View>
    );
};

export default StackHeader;

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        paddingBottom: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    side: {
        flex: 1,
        alignItems: 'flex-start',
    },
    sideRight: {
        alignItems: 'flex-end',
    },
    center: {
        flex: 2,
        alignItems: 'center',
    },
});
