// outsource dependencies
import React, { ReactNode, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, StatusBar, ViewStyle, StatusBarStyle, StyleProp } from 'react-native';
// local dependencies
import { useTheme } from 'hooks/useTheme';
import { BoxHolder } from 'components/preloader';

interface ScreenProps {
    init?: () => void;
    clear?: () => void;
    children?: ReactNode;
    initialized: boolean;
    statusBarBg?: string;
    statusBarHidden?: boolean;
    statusBarAnimated?: boolean;
    style?: StyleProp<ViewStyle>;
    statusBarVariant?: StatusBarStyle;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        display: 'flex',
    },
    screen: {
        flex: 1,
        display: 'flex',
        backgroundColor: '#F7F8FA',
    },
});

const Screen: React.FC<ScreenProps> = ({
    init,
    clear,
    style,
    children,
    initialized,
    statusBarHidden = false,
    statusBarBg = '#1A2236',
    statusBarAnimated = false,
    statusBarVariant = 'default',
}) => {
    useFocusEffect(
        useCallback(() => {
            if (typeof init === 'function') { init(); }
            return () => { if (typeof clear === 'function') { clear(); } };
        }, [init, clear])
    );

    const theme = useTheme();
    return (
        <View style={styles.container}>
            <StatusBar
                hidden={statusBarHidden}
                barStyle={statusBarVariant}
                animated={statusBarAnimated}
                backgroundColor={statusBarBg}
            />
            <BoxHolder active={!initialized}>
                <View style={StyleSheet.flatten([styles.screen, { backgroundColor: theme.colors.background }, style])}>{children}</View>
            </BoxHolder>
        </View>
    );
};

export default React.memo(Screen);
