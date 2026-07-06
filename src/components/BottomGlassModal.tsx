// outsource dependencies
import React from 'react';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

// local dependencies
import { useTheme } from 'hooks/useTheme';
import { GlassSurface } from 'components/GlassSurface';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomGlassModalProps {
    /** Whether the modal is visible. When false the component returns null. */
    visible: boolean;
    /** Backdrop tap / system back triggers this. */
    onClose: () => void;
    /** Modal body. Header + scroll content + sticky footer are all caller-owned. */
    children: React.ReactNode;
    /**
     * Full-height (default) anchors the modal from `topOffset` down to the bottom
     * inset. Partial mode anchors to the bottom and shows `maxHeight` (default 80%).
     */
    fullScreen?: boolean;
    /** Maximum height in partial mode. Defaults to 80% of screen height. */
    maxHeight?: number;
    /** Distance from the top of the screen in full-screen mode. Includes safe-area. */
    topOffset?: number;
}

/**
 * Slide-up modal shell with a frosted (Glass) backdrop. Shared between AnytimeModal
 * and AnytimeExercisesModal — they both use a native <Modal> + GlassSurface tint
 * + spring slide-in/slide-out animation + tap-to-close backdrop.
 *
 * Caller is responsible for the modal's *contents* (header, list, footer) — this
 * component only owns the chrome (overlay, backdrop, slide animation, surface).
 */
export const BottomGlassModal: React.FC<BottomGlassModalProps> = ({
    visible,
    onClose,
    children,
    maxHeight,
    topOffset = 50,
    fullScreen = true,
}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    if (!visible) { return null; }

    const modalStyle = fullScreen
        ? [styles.modal, { paddingBottom: insets.bottom, backgroundColor: theme.colors.surface }]
        : [
            styles.modal,
            {
                bottom: 0,
                top: undefined,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                height: maxHeight || SCREEN_HEIGHT * 0.8,
            },
        ];

    return (
        <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={onClose}>
            <Animated.View style={[styles.overlay, { top: insets.top + topOffset }]} >
                <GlassSurface
                    tint="dark"
                    intensity={18}
                    style={StyleSheet.absoluteFill}
                />
                <TouchableOpacity
                    onPress={onClose}
                    activeOpacity={1}
                    style={StyleSheet.absoluteFill}
                />

                <Animated.View style={modalStyle} >
                    {children}
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
    },
    modal: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        elevation: 7,
        shadowRadius: 3.84,
        shadowOpacity: 0.25,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -2 },
    },
});
