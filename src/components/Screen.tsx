// outsource dependencies
import React, { ReactNode, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, StatusBar, ViewStyle, StatusBarStyle } from 'react-native';
// local dependencies
import { BoxHolder } from './preloader';

interface ScreenProps {
  style?: ViewStyle;
  children?: ReactNode;
  initialized: boolean;
  statusBarBg?: string;
  statusBarHidden?: boolean;
  statusBarAnimated?: boolean;
  statusBarVariant?: StatusBarStyle;
  init?: () => void;
  clear?: () => void;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        display: 'flex',
    },
    screen: {
        flex: 1,
        display: 'flex',
        backgroundColor: '#F7F8FA', // COLOR.THEME_BG.hex()
    },
});

const Screen: React.FC<ScreenProps> = ({
    children,
    style,
    initialized,
    statusBarHidden = false,
    statusBarBg = '#1A2236',
    statusBarAnimated = false,
    statusBarVariant = 'default',
    init,
    clear,
}) => {
    useFocusEffect(
        useCallback(() => {
            if (typeof init === 'function') { init(); }
            return () => { if (typeof clear === 'function') { clear(); } };
        }, [init, clear])
    );

    return (
        <View style={styles.container}>
            <StatusBar
                hidden={statusBarHidden}
                barStyle={statusBarVariant}
                animated={statusBarAnimated}
                backgroundColor={statusBarBg}
            />
            <BoxHolder active={!initialized}>
                <View style={StyleSheet.flatten([styles.screen, style])}>{children}</View>
            </BoxHolder>
        </View>
    );
};

export default React.memo(Screen);
