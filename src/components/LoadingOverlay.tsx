// outsource dependencies
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialIndicator } from 'react-native-indicators';

// local dependencies
import { useTheme } from 'hooks/useTheme.ts';

interface LoadingOverlayProps {
  init: boolean
}

const LoadingOverlay = ({ init }: LoadingOverlayProps) => {
    const theme = useTheme();
    return init
        ? <View pointerEvents="auto" style={[StyleSheet.absoluteFillObject, styles.container]}>
            <MaterialIndicator color={theme.colors.primary} size={60} />
        </View>
        : null;
};

export default LoadingOverlay;

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
});
