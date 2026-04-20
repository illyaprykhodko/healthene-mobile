// outsource dependencies
import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Easing as RNEasing,
    Modal,
    Platform,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';

export const PARTICLE_CONFIG = {
    COUNT: 6,
    /** Fixed travel distance from checkbox center (px); all particles use this value. */
    MAX_RADIUS: 200,
    SIZE: 40,
    DURATION: 700,
    /** Stagger between particle start times (ms): delay = index * STAGGER_MS. Use 0 so all particles start together. */
    STAGGER_MS: 0,
    COLORS: [
        '#22C55E',
        '#EC4899',
        '#EF4444',
        '#3B82F6',
        '#F97316',
        '#A855F7',
        '#EAB308',
        '#14B8A6',
        '#F43F5E',
        '#6366F1',
    ],
} as const;

type ParticleShape = 'circle' | 'square' | 'triangle' | 'cross';

export interface BurstParticleConfig {
    angle: number;
    distance: number;
    delay: number;
    shape: ParticleShape;
    color: string;
}

const SHAPES: ParticleShape[] = ['circle', 'square', 'triangle', 'cross'];

/** Even angles: 360° / COUNT (e.g. 6 → 0°, 60°, …). Fixed distance. Optional stagger via STAGGER_MS. */
function generateBurstParticles (): BurstParticleConfig[] {
    const { COUNT, MAX_RADIUS, STAGGER_MS } = PARTICLE_CONFIG;
    const angleStepRad = (Math.PI * 2) / COUNT;
    return Array.from({ length: COUNT }, (_, index) => {
        const angle = index * angleStepRad;
        const delay = index * STAGGER_MS;
        const shape = SHAPES[index % SHAPES.length]!;
        const color = PARTICLE_CONFIG.COLORS[index % PARTICLE_CONFIG.COLORS.length]!;
        return {
            angle,
            distance: MAX_RADIUS,
            delay,
            shape,
            color,
        };
    });
}

interface BurstParticleProps {
    config: BurstParticleConfig;
    burstId: number;
}

/** Single timeline t ∈ [0,1]: translate is strictly outward (linear); scale/opacity handle pop + vanish in place. */
const BurstParticle: React.FC<BurstParticleProps> = memo(({ config, burstId }) => {
    const t = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        t.setValue(0);
        const { delay } = config;
        const duration = PARTICLE_CONFIG.DURATION;
        const anim = Animated.sequence([
            Animated.delay(delay),
            Animated.timing(t, {
                toValue: 1,
                duration,
                easing: RNEasing.linear,
                useNativeDriver: true,
            }),
        ]);
        anim.start();
        return () => {
            anim.stop();
        };
    }, [burstId, config.delay, PARTICLE_CONFIG.DURATION, t]);

    const tx = t.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.cos(config.angle) * config.distance],
    });
    const ty = t.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.sin(config.angle) * config.distance],
    });
    /** 0 → 1 → 0 with peak at ~50% (max visual size mid-flight). */
    const scale = t.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 1, 0],
    });
    /** Visible while moving; fade out in the last segment at the outer position (no return motion). */
    const opacity = t.interpolate({
        inputRange: [0, 0.65, 1],
        outputRange: [1, 1, 0],
    });

    const shapeEl = useMemo(() => {
        const s = PARTICLE_CONFIG.SIZE;
        const { color, shape } = config;
        switch (shape) {
            case 'circle':
                return (
                    <View
                        style={{
                            width: s,
                            height: s,
                            borderRadius: s / 2,
                            backgroundColor: color,
                        }}
                    />
                );
            case 'square':
                return (
                    <View
                        style={{
                            width: s * 0.85,
                            height: s * 0.85,
                            borderRadius: 4,
                            backgroundColor: color,
                        }}
                    />
                );
            case 'triangle':
                return (
                    <View
                        style={{
                            width: 0,
                            height: 0,
                            backgroundColor: 'transparent',
                            borderStyle: 'solid',
                            borderLeftWidth: s / 2,
                            borderRightWidth: s / 2,
                            borderBottomWidth: s * 0.866,
                            borderLeftColor: 'transparent',
                            borderRightColor: 'transparent',
                            borderBottomColor: color,
                        }}
                    />
                );
            case 'cross':
            default:
                return (
                    <View style={{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }}>
                        <View
                            style={{
                                position: 'absolute',
                                width: s * 0.75,
                                height: s * 0.12,
                                backgroundColor: color,
                                borderRadius: 1,
                                transform: [{ rotate: '45deg' }],
                            }}
                        />
                        <View
                            style={{
                                position: 'absolute',
                                width: s * 0.75,
                                height: s * 0.12,
                                backgroundColor: color,
                                borderRadius: 1,
                                transform: [{ rotate: '-45deg' }],
                            }}
                        />
                    </View>
                );
        }
    }, [config.color, config.shape]);

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.particle,
                {
                    opacity,
                    transform: [{ translateX: tx }, { translateY: ty }, { scale }],
                },
            ]}
        >
            <View style={styles.particleInner}>
                {shapeEl}
            </View>
        </Animated.View>
    );
});

export interface CheckboxBurstEffectProps {
    /** Increment on each tap that marks the item DONE (drives the burst; avoids list remount / async status issues). */
    burstSignal: number;
    /** When false, clears any running burst (e.g. user unchecked). */
    checked: boolean;
    /** Wraps the checkbox; used to position the burst in a screen Modal (avoids FlatList/swipe row clipping). */
    anchorRef: React.RefObject<View | null>;
}

const CheckboxBurstEffectInner: React.FC<CheckboxBurstEffectProps> = ({ burstSignal, checked, anchorRef }) => {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const prevBurstSignalRef = useRef(0);
    const prevCheckedRef = useRef<boolean | undefined>(undefined);
    const [burstId, setBurstId] = useState(0);
    const [windowOrigin, setWindowOrigin] = useState<{ x: number; y: number } | null>(null);
    const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearCleanupTimer = useCallback(() => {
        if (cleanupTimerRef.current != null) {
            clearTimeout(cleanupTimerRef.current);
            cleanupTimerRef.current = null;
        }
    }, []);

    const scheduleCleanup = useCallback(() => {
        clearCleanupTimer();
        const lastStart = (PARTICLE_CONFIG.COUNT - 1) * PARTICLE_CONFIG.STAGGER_MS;
        const waitMs = lastStart + PARTICLE_CONFIG.DURATION + 80;
        cleanupTimerRef.current = setTimeout(() => {
            setBurstId(0);
            cleanupTimerRef.current = null;
        }, waitMs);
    }, [clearCleanupTimer]);

    useEffect(() => () => {
        clearCleanupTimer();
    }, [clearCleanupTimer]);

    useEffect(() => {
        if (prevCheckedRef.current === undefined) {
            prevCheckedRef.current = checked;
            return;
        }
        if (prevCheckedRef.current && !checked) {
            clearCleanupTimer();
            setBurstId(0);
        }
        prevCheckedRef.current = checked;
    }, [checked, clearCleanupTimer]);

    useEffect(() => {
        if (burstSignal <= prevBurstSignalRef.current) {
            return;
        }
        prevBurstSignalRef.current = burstSignal;
        setBurstId(id => (id !== 0 ? id : Date.now()));
    }, [burstSignal]);

    useEffect(() => {
        if (burstId === 0) {
            return;
        }
        scheduleCleanup();
        return () => {
            clearCleanupTimer();
        };
    }, [burstId, scheduleCleanup, clearCleanupTimer]);

    useLayoutEffect(() => {
        if (burstId === 0) {
            setWindowOrigin(null);
            return;
        }
        const node = anchorRef?.current;
        if (!node) {
            return;
        }
        node.measureInWindow((x, y, w, h) => {
            const cx = x + w / 2;
            const cy = y + h / 2;
            setWindowOrigin({ x: cx, y: cy });
        });
    }, [burstId, anchorRef]);

    const particles = useMemo(() => {
        if (burstId === 0) {
            return null;
        }
        return generateBurstParticles();
    }, [burstId]);

    const modalRootStyle = useMemo(() => [
        styles.modalRoot,
        {
            width: windowWidth,
            height: windowHeight,
        },
    ], [windowWidth, windowHeight]);

    if (!particles || burstId === 0) {
        return null;
    }

    if (!windowOrigin) {
        return null;
    }

    return (
        <Modal
            visible
            transparent
            animationType="none"
            statusBarTranslucent
            {...(Platform.OS === 'ios' ? { presentationStyle: 'overFullScreen' as const } : {})}
        >
            <View style={modalRootStyle} pointerEvents="box-none">
                <View
                    pointerEvents="none"
                    style={[
                        styles.overlayModal,
                        {
                            left: windowOrigin.x - OVERLAY_SIDE / 2,
                            top: windowOrigin.y - OVERLAY_SIDE / 2,
                        },
                    ]}
                >
                    {particles.map((config, index) => (
                        <BurstParticle key={`${burstId}-${index}`} burstId={burstId} config={config} />
                    ))}
                </View>
            </View>
        </Modal>
    );
};

/** Burst canvas: large enough for ~MAX_RADIUS travel from center; origin is exact pixel center. */
const OVERLAY_SIDE = PARTICLE_CONFIG.MAX_RADIUS * 2 + PARTICLE_CONFIG.SIZE;
const PARTICLE_ORIGIN_XY = OVERLAY_SIDE / 2 - PARTICLE_CONFIG.SIZE / 2;

const styles = StyleSheet.create({
    modalRoot: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    overlayModal: {
        position: 'absolute',
        width: OVERLAY_SIDE,
        height: OVERLAY_SIDE,
        elevation: 24,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
    },
    particle: {
        position: 'absolute',
        left: PARTICLE_ORIGIN_XY,
        top: PARTICLE_ORIGIN_XY,
        width: PARTICLE_CONFIG.SIZE,
        height: PARTICLE_CONFIG.SIZE,
        overflow: 'visible',
    },
    particleInner: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

const CheckboxBurstEffectMemo = memo(CheckboxBurstEffectInner, (prev, next) => (
    prev.burstSignal === next.burstSignal
    && prev.checked === next.checked
    && prev.anchorRef === next.anchorRef
));

export function CheckboxBurstEffect (props: CheckboxBurstEffectProps) {
    return <CheckboxBurstEffectMemo {...props} />;
}
