// outsource dependencies
import React, { forwardRef, useCallback } from 'react';
import {
    View,
    Pressable,
    ViewStyle,
    StyleProp,
    PressableProps,
    GestureResponderEvent,
} from 'react-native';
import Animated, {
    withSpring,
    useSharedValue,
    useAnimatedStyle,
    useReducedMotion,
} from 'react-native-reanimated';

// local dependencies
import { useHaptic, HapticType } from 'hooks/useHaptic';

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
    /** Final scale on press (defaults to 0.97). 1 disables the scale animation. */
    scale?: number;
    /** Semantic haptic on pressIn. `null` opts out. Defaults to 'light'. */
    haptic?: HapticType | null;
    /** Style applied directly to the Pressable touch target (full padding/background lives here). */
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
}

// Reanimated spring config tuned for "snappy but not jittery" — feels close to iOS standard
// system spring used in Mail / Photos buttons.
const SPRING_CONFIG = {
    mass: 0.5,
    damping: 14,
    stiffness: 220,
};

// AnimatedPressable: scale + style applied to the SAME component, so the touch target == styled area.
// Earlier we wrapped Pressable in an Animated.View and only the View carried the style — Pressable
// collapsed to children width and only the inner text responded to taps. With createAnimatedComponent
// the Pressable itself receives both the user style and the animated transform.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Drop-in replacement for TouchableOpacity / Pressable that adds a subtle scale animation
 * and an optional haptic on pressIn. Use as the default tappable surface across the app —
 * any one-off without scale/haptic can pass `scale={1} haptic={null}` to opt out.
 */
const PressableScaleComponent = forwardRef<View, PressableScaleProps>(({
    style,
    disabled,
    children,
    onPressIn,
    onPressOut,
    scale = 0.97,
    haptic = 'light',
    ...rest
}, ref) => {
    const haptics = useHaptic();
    const reduced = useReducedMotion();
    const progress = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: progress.value }],
    }));

    const handlePressIn = useCallback((event: GestureResponderEvent) => {
        if (!disabled) {
            if (haptic) {
                haptics[haptic]();
            }
            // Skip scale animation if user enabled Reduce Motion. Press handlers still run.
            if (!reduced && scale !== 1) {
                progress.value = withSpring(scale, SPRING_CONFIG);
            }
        }
        onPressIn?.(event);
    }, [disabled, haptic, haptics, reduced, scale, progress, onPressIn]);

    const handlePressOut = useCallback((event: GestureResponderEvent) => {
        if (!reduced && scale !== 1) {
            progress.value = withSpring(1, SPRING_CONFIG);
        }
        onPressOut?.(event);
    }, [reduced, scale, progress, onPressOut]);

    return (
        <AnimatedPressable
            ref={ref}
            disabled={disabled}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[style, animatedStyle]}
            {...rest}
        >
            {children}
        </AnimatedPressable>
    );
});

PressableScaleComponent.displayName = 'PressableScale';

export const PressableScale = React.memo(PressableScaleComponent);
export default PressableScale;
