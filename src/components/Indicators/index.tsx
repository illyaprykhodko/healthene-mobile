/**
 * Local loading indicators built on Reanimated (+ react-native-svg for the material
 * spinner). Drop-in replacement for the abandoned `react-native-indicators` package,
 * which broke on RN 0.86 (it relied on the removed `StyleSheet.absoluteFillObject`).
 *
 * Exposes the two indicators the app actually used — SkypeIndicator (orbiting dots,
 * the branded preloader) and MaterialIndicator (circular spinner) — with the same
 * props (`color`, `size`, `style`, `count`) so call sites need no changes.
 *
 * Author: Viktor
 */
import Svg, { Circle } from 'react-native-svg';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
    Easing,
    withTiming,
    withRepeat,
    interpolate,
    useSharedValue,
    useAnimatedStyle,
    type SharedValue,
} from 'react-native-reanimated';

interface IndicatorProps {
    size?: number;
    color?: string;
    count?: number;
    style?: ViewStyle;
}

const DEFAULT_COLOR = 'rgb(0, 0, 0)';

// ---------------------------------------------------------------------------
// SkypeIndicator — `count` dots orbiting on a circle, each with a phase-shifted
// bezier easing so they bunch and trail (the original library's signature look).
// ---------------------------------------------------------------------------

const SKYPE_DURATION = 1600;
const SKYPE_MIN_SCALE = 0.2;
const SKYPE_MAX_SCALE = 1.0;

interface SkypeDotProps {
    size: number;
    index: number;
    count: number;
    color: string;
    progress: SharedValue<number>;
}

const SkypeDot: React.FC<SkypeDotProps> = ({ index, count, size, color, progress }) => {
    const offset = index / (count - 1);
    // Reanimated bezier easing is a worklet-safe function; memoize per dot.
    const ease = useMemo(() => Easing.bezierFn(0.5, offset, 0.5, 1.0), [offset]);
    const ballSize = size / 5;

    const startScale = SKYPE_MAX_SCALE - (SKYPE_MAX_SCALE - SKYPE_MIN_SCALE) * offset;
    const endScale = SKYPE_MIN_SCALE + (SKYPE_MAX_SCALE - SKYPE_MIN_SCALE) * offset;

    const layerStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${ease(progress.value) * 360}deg` }],
    }));

    const ballStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(progress.value, [0, 1], [startScale, endScale]) }],
    }));

    return (
        <Animated.View style={[styles.skypeLayer, layerStyle]}>
            <Animated.View
                style={[
                    {
                        width: ballSize,
                        height: ballSize,
                        backgroundColor: color,
                        borderRadius: ballSize / 2,
                    },
                    ballStyle,
                ]}
            />
        </Animated.View>
    );
};

export const SkypeIndicator: React.FC<IndicatorProps> = ({ color = DEFAULT_COLOR, size = 40, count = 5, style }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withRepeat(withTiming(1, { duration: SKYPE_DURATION, easing: Easing.linear }), -1, false);
    }, [progress]);

    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            {Array.from({ length: count }, (_, index) => (
                <SkypeDot key={index} index={index} count={count} size={size} color={color} progress={progress} />
            ))}
        </View>
    );
};

// ---------------------------------------------------------------------------
// MaterialIndicator — a continuously rotating arc ring (SVG). Reads as the
// standard indeterminate circular spinner.
// ---------------------------------------------------------------------------

const MATERIAL_DURATION = 900;

export const MaterialIndicator: React.FC<IndicatorProps> = ({ color = DEFAULT_COLOR, size = 40, style }) => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(withTiming(1, { duration: MATERIAL_DURATION, easing: Easing.linear }), -1, false);
    }, [rotation]);

    const spinStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value * 360}deg` }],
    }));

    const strokeWidth = Math.max(2, size / 10);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    // Show ~70% of the ring so the rotation is clearly visible.
    const dash = circumference * 0.7;

    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            <Animated.View style={spinStyle}>
                <Svg width={size} height={size}>
                    <Circle
                        r={radius}
                        fill="none"
                        cx={size / 2}
                        cy={size / 2}
                        stroke={color}
                        strokeLinecap="round"
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${dash} ${circumference}`}
                    />
                </Svg>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    skypeLayer: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
});
