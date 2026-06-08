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
    },
});

const Screen: React.FC<ScreenProps> = ({
    init,
    clear,
    style,
    children,
    statusBarBg, //'#1A2236'
    initialized,
    statusBarHidden = false,
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
    // Honor an explicit variant; otherwise pick icon contrast from the active theme.
    const barStyle: StatusBarStyle = statusBarVariant !== 'default'
        ? statusBarVariant
        : (theme.dark ? 'light-content' : 'dark-content');
    return (
        <View style={styles.container}>
            <StatusBar
                barStyle={barStyle}
                hidden={statusBarHidden}
                animated={statusBarAnimated}
                backgroundColor={statusBarBg ?? theme.colors.background}
            />
            <BoxHolder active={!initialized}>
                <View style={StyleSheet.flatten([styles.screen, { backgroundColor: theme.colors.background }, style])}>{children}</View>
            </BoxHolder>
        </View>
    );
};

export default React.memo(Screen);
