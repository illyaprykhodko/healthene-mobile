// outsource dependencies
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
    Easing,
    withDelay,
    withTiming,
    useSharedValue,
    useReducedMotion,
    useAnimatedStyle,
} from 'react-native-reanimated';

const PIECE_COUNT = 40;
const BASE_FALL_MS = 2200;
const MAX_EXTRA_FALL_MS = 700;
const MAX_START_DELAY_MS = 450;
const CONFETTI_COLORS = [
    '#22C55E',
    '#EC4899',
    '#EF4444',
    '#3B82F6',
    '#F97316',
    '#A855F7',
    '#EAB308',
    '#14B8A6',
];

interface ConfettiPieceConfig {
    spin: number;
    color: string;
    width: number;
    delay: number;
    drift: number;
    height: number;
    duration: number;
    startXRatio: number;
}

function generatePieces (): ConfettiPieceConfig[] {
    return Array.from({ length: PIECE_COUNT }, (_, index) => ({
        startXRatio: Math.random(),
        width: 7 + Math.random() * 7,
        height: 10 + Math.random() * 8,
        spin: (Math.random() - 0.5) * 900,
        drift: (Math.random() - 0.5) * 180,
        delay: Math.random() * MAX_START_DELAY_MS,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length]!,
        duration: BASE_FALL_MS + Math.random() * MAX_EXTRA_FALL_MS,
    }));
}

interface ConfettiPieceProps {
    burstId: number;
    screenWidth: number;
    screenHeight: number;
    config: ConfettiPieceConfig;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ config, screenWidth, screenHeight, burstId }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = 0;
        progress.value = withDelay(
            config.delay,
            withTiming(1, { duration: config.duration, easing: Easing.in(Easing.quad) })
        );
    }, [burstId, config.delay, config.duration, progress]);

    const animatedStyle = useAnimatedStyle(() => ({
        // Fade out only in the last 10% of the fall so pieces vanish near the bottom.
        opacity: progress.value >= 0.9 ? (1 - progress.value) / 0.1 : 1,
        transform: [
            { translateY: progress.value * (screenHeight + 60) },
            { translateX: progress.value * config.drift },
            { rotateZ: `${progress.value * config.spin}deg` },
        ],
    }));

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.piece,
                {
                    width: config.width,
                    height: config.height,
                    backgroundColor: config.color,
                    left: config.startXRatio * screenWidth,
                },
                animatedStyle,
            ]}
        />
    );
};

interface CelebrationConfettiProps {
    /** Each increment (> 0) plays exactly one confetti burst. */
    signal: number;
}

export const CelebrationConfetti: React.FC<CelebrationConfettiProps> = ({ signal }) => {
    const { width, height } = useWindowDimensions();
    const reduceMotion = useReducedMotion();
    const prevSignal = useRef(0);
    const [burst, setBurst] = useState<{ id: number; pieces: ConfettiPieceConfig[] } | null>(null);

    useEffect(() => {
        if (signal <= prevSignal.current) { return; }
        prevSignal.current = signal;
        if (reduceMotion) { return; }

        setBurst({ id: signal, pieces: generatePieces() });
        const lifetime = BASE_FALL_MS + MAX_EXTRA_FALL_MS + MAX_START_DELAY_MS + 200;
        const timer = setTimeout(() => setBurst(null), lifetime);
        return () => clearTimeout(timer);
    }, [signal, reduceMotion]);

    if (!burst) { return null; }

    return (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.overlay]}>
            {burst.pieces.map((config, index) => (
                <ConfettiPiece
                    config={config}
                    burstId={burst.id}
                    screenWidth={width}
                    screenHeight={height}
                    key={`${burst.id}-${index}`}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        zIndex: 1000,
    },
    piece: {
        top: -30,
        borderRadius: 2,
        position: 'absolute',
    },
});
