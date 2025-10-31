// outsource dependencies
import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Text } from 'react-native';
// local dependencies
import { useTheme } from 'hooks/useTheme';
import { COLORS } from 'constants/colors';

interface SwipeablePanelProps {
    style?: any;
    isActive: boolean;
    onClose: () => void;
    // fullWidth?: boolean;
    // openLarge?: boolean;
    // onlyLarge?: boolean;
    closeIconStyle?: any;
    closeRootStyle?: any;
    children: React.ReactNode;
    showCloseButton?: boolean;
    closeOnTouchOutside?: boolean;
    onPressCloseButton?: () => void;
}

export const SwipeablePanel: React.FC<SwipeablePanelProps> = ({
    style,
    onClose,
    isActive,
    children,
    closeIconStyle,
    closeRootStyle,
    onPressCloseButton,
    showCloseButton = true,
    closeOnTouchOutside = true,
}) => {
    const theme = useTheme();
    if (!isActive) { return null; }

    return (
        <Modal
            transparent
            visible={isActive}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.overlayTouchable}
                    onPress={closeOnTouchOutside ? onClose : undefined}
                />
                <View style={[styles.panel, { backgroundColor: theme.colors.surface }, style]}>
                    {showCloseButton && (
                        <TouchableOpacity
                            onPress={onPressCloseButton || onClose}
                            style={[styles.closeButton, closeIconStyle]}
                        >
                            <Text style={[styles.closeButtonText, { color: theme.colors.white }]}>×</Text>
                        </TouchableOpacity>
                    )}
                    {children}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    overlayTouchable: {
        flex: 1,
    },
    panel: {
        backgroundColor: COLORS.WHITE,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        minHeight: '50%',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#A5A5A5',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    closeButtonText: {
        color: COLORS.WHITE,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
