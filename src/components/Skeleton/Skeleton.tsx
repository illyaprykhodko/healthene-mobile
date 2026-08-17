// outsource dependencies
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
    Easing,
    withRepeat,
    withTiming,
    useSharedValue,
    useReducedMotion,
    useAnimatedStyle,
    type SharedValue,
} from 'react-native-reanimated';

// local dependencies
import { useTheme } from 'hooks/useTheme';

export const SHIMMER_DURATION = 1500;
const SHIMMER_EASING = Easing.bezier(0.25, 0.1, 0.25, 1);

/**
 * One repeating 0->1 pulse, meant to be handed to a whole group of `<Skeleton>` blocks.
 *
 * Each Skeleton otherwise owns its own `withRepeat` loop started on its own mount tick, so a
 * full-screen skeleton runs dozens of loops drifting out of phase — that reads as noise rather than
 * a pulse. Same driver pattern as `SkypeIndicator` -> `SkypeDot` in `components/Indicators`.
 */
export const useShimmerProgress = (): SharedValue<number> => {
    const progress = useSharedValue(0);
    const reduceMotion = useReducedMotion();

    React.useEffect(() => {
        if (reduceMotion) {
            progress.value = 0.5;
            return;
        }
        progress.value = withRepeat(
            withTiming(1, { duration: SHIMMER_DURATION, easing: SHIMMER_EASING }),
            -1,
            false
        );
    }, [progress, reduceMotion]);

    return progress;
};

interface SkeletonProps {
    width?: ViewStyle['width'];
    height?: ViewStyle['height'];
    style?: StyleProp<ViewStyle>;
    borderRadius?: ViewStyle['borderRadius'];
    /**
     * External pulse driver from `useShimmerProgress`. Screen-level skeletons pass ONE value down so
     * every block pulses in phase on a single loop. Omit it and the block drives itself, as before.
     */
    progress?: SharedValue<number>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    style,
    progress,
    height = 20,
    width = '100%',
    borderRadius = 4,
}) => {
    const theme = useTheme();
    const ownValue = useSharedValue(0);
    const shimmerValue = progress ?? ownValue;

    React.useEffect(() => {
        // Driven from outside — leave the local value idle.
        if (progress) { return; }
        ownValue.value = withRepeat(
            withTiming(1, { duration: SHIMMER_DURATION, easing: SHIMMER_EASING }),
            -1,
            false
        );
    }, [progress, ownValue]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: 0.5 + shimmerValue.value * 0.5,
        };
    });

    return (
        <View style={[styles.container, { width, height, borderRadius }, style]}>
            <Animated.View
                style={[
                    styles.shimmer,
                    {
                        borderRadius,
                        backgroundColor: theme.colors.skeleton ?? theme.colors.grey,
                    },
                    animatedStyle,
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    shimmer: {
        width: '100%',
        height: '100%',
    },
});
