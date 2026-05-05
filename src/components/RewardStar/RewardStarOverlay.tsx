// outsource dependencies
import {
    Text,
    View,
    Image,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import Animated, {
    Easing,
    withTiming,
    withSequence,
    useSharedValue,
    cancelAnimation,
    useAnimatedStyle,
    type SharedValue,
} from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
// local dependencies
import { useAppSelector } from 'store';
import { selectRewardStar } from 'store/slices/rewardStarSlice';
import { useGetPatientGamblingPointsQuery } from 'store/api/gamblingPointsApi';
import { ANIMATION_CONFIG, COUNTER_CONFIG, STAR_CONFIG, getGrainFlightTotalDurationMs } from './config';

type DeferCancelHandle = { cancel: () => void };

/**
 * Two RAFs after tap: enough separation from CheckboxBurstEffect’s Modal mount without blocking on
 * InteractionManager (logs showed ~400ms deferral then `finished:false` at progress 0 — IM was a bad fit).
 */
function deferTwoFramesCancelable (onReady: () => void): DeferCancelHandle {
    let cancelled = false;
    let id2: number | null = null;
    const raf = globalThis.requestAnimationFrame.bind(globalThis);
    const craf = globalThis.cancelAnimationFrame.bind(globalThis);
    const id1 = raf(() => {
        if (cancelled) {
            return;
        }
        id2 = raf(() => {
            if (cancelled) {
                return;
            }
            id2 = null;
            onReady();
        });
    });
    return {
        cancel () {
            cancelled = true;
            craf(id1);
            if (id2 != null) {
                craf(id2);
            }
        },
    };
}

const STAR_PULSE_PEAK = STAR_CONFIG.SCALE_ANIMATION;
const GRAIN_SIZE = 20;
const GRAIN_HALF = GRAIN_SIZE / 2;
const ARC_CAP_PX = 36;

const seedImage = require('../../../assets/seed.png');

/** Star center in window space when the star view has not laid out yet (uses overlay rect from measure). */
function getStarFallbackCenterWindow (
    overlayOx: number,
    overlayOy: number,
    overlayW: number
): { cx: number; cy: number } {
    const { WIDTH, HEIGHT, POSITION } = STAR_CONFIG;
    const cy = overlayOy + POSITION.TOP_FROM_SAFE_AREA + HEIGHT / 2;
    const align = POSITION.ALIGN_HORIZONTAL ?? 'center';
    const { OFFSET_X } = POSITION;
    let cx: number;
    if (align === 'left') {
        cx = overlayOx + OFFSET_X + WIDTH / 2;
    } else if (align === 'right') {
        cx = overlayOx + overlayW - WIDTH / 2 + OFFSET_X;
    } else {
        cx = overlayOx + overlayW / 2 + OFFSET_X;
    }
    return { cx, cy };
}

function buildStarPolygonPoints (width: number, height: number, rays: number, rayLength: number): string {
    const cx = width / 2;
    const cy = height / 2;
    const fit = Math.min(width, height);
    const innerR = Math.max(4, fit * 0.12);
    const outerR = innerR + rayLength;
    const pts: string[] = [];
    const steps = rays * 2;
    for (let i = 0; i < steps; i++) {
        const angle = (i * Math.PI) / rays - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        pts.push(`${x},${y}`);
    }
    return pts.join(' ');
}

interface FlyingGrainProps {
    index: number;
    masterProgress: SharedValue<number>;
    startX: SharedValue<number>;
    startY: SharedValue<number>;
    endX: SharedValue<number>;
    endY: SharedValue<number>;
}

type FlightLayout = {
    ox: number;
    oy: number;
    cxWin: number;
    cyWin: number;
    endXWin: number;
    endYWin: number;
};

/** One grain: staggered segment of master timeline; absolute left/top in overlay space. */
const FlyingGrain = memo(({ index, masterProgress, startX, startY, endX, endY }: FlyingGrainProps) => {
    const n = ANIMATION_CONFIG.GRAIN_COUNT;
    const stagger = ANIMATION_CONFIG.GRAIN_STAGGER_MS;
    const flyDur = ANIMATION_CONFIG.FLY_DURATION;
    const totalMs = getGrainFlightTotalDurationMs();
    const spread = ANIMATION_CONFIG.SEED_SPREAD_PX;

    const style = useAnimatedStyle(() => {
        const m = masterProgress.value;
        const elapsed = m * totalMs;
        const t0 = index * stagger;
        let grainP = (elapsed - t0) / flyDur;
        if (grainP < 0) {
            grainP = 0;
        }
        if (grainP > 1) {
            grainP = 1;
        }

        const sx = startX.value;
        const sy = startY.value;
        const ex = endX.value;
        const ey = endY.value;
        const dx = ex - sx;
        const dy = ey - sy;
        const len = Math.hypot(dx, dy) || 1;
        const px = -dy / len;
        const py = dx / len;
        const arc = Math.sin(grainP * Math.PI)
            * Math.min(ANIMATION_CONFIG.PARTICLE_RADIUS * 0.35, ARC_CAP_PX);
        const fan = (index - (n - 1) / 2) * spread;
        const x = sx + dx * grainP + px * arc + fan * (1 - grainP);
        const y = sy + dy * grainP + py * arc;

        let sc = 1;
        if (grainP < 0.4) {
            sc = 0.4 + (1 - 0.4) * (grainP / 0.4);
        } else if (grainP < 0.55) {
            sc = 1;
        } else {
            sc = 1 + (0.35 - 1) * ((grainP - 0.55) / 0.45);
        }
        const op = grainP <= 0 ? 0 : Math.min(1, grainP * 14) * (1 - grainP);
        return {
            position: 'absolute' as const,
            left: x - GRAIN_HALF,
            top: y - GRAIN_HALF,
            width: GRAIN_SIZE,
            height: GRAIN_SIZE,
            opacity: op,
            transform: [{ scale: sc }],
        };
    }, [index, n, spread, stagger, flyDur, totalMs]);

    return (
        <Animated.View pointerEvents="none" style={style}>
            <Image source={seedImage} style={styles.grainImg} resizeMode="contain" />
        </Animated.View>
    );
});

export interface RewardStarOverlayProps {
    /** When true, counter reflects GET /gambling-points; when false, counter shows 0 (query skipped). */
    gamblingPointsQueryEnabled?: boolean;
}

export const RewardStarOverlay: React.FC<RewardStarOverlayProps> = ({
    gamblingPointsQueryEnabled = false,
}) => {
    const { lastTrigger, cx: triggerCx, cy: triggerCy } = useAppSelector(selectRewardStar);
    const { data: gamblingPointsData } = useGetPatientGamblingPointsQuery(undefined, {
        skip: !gamblingPointsQueryEnabled,
    });
    const counterDisplay = gamblingPointsQueryEnabled ? (gamblingPointsData ?? 0) : 0;

    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const overlayRef = useRef<View>(null);
    const starMeasureRef = useRef<View>(null);

    const masterProgress = useSharedValue(0);
    const startX = useSharedValue(0);
    const startY = useSharedValue(0);
    const endX = useSharedValue(0);
    const endY = useSharedValue(0);
    const starScale = useSharedValue(1);
    const starOpacity = useSharedValue(0);
    const counterBump = useSharedValue(1);

    const queueRef = useRef<{ cx: number; cy: number }[]>([]);
    const runningRef = useRef(false);
    const hasRevealedStarRef = useRef(false);
    const mountedRef = useRef(true);
    const deferCancelHandleRef = useRef<DeferCancelHandle | null>(null);

    const starPolygonPoints = useMemo(
        () => buildStarPolygonPoints(
            STAR_CONFIG.WIDTH,
            STAR_CONFIG.HEIGHT,
            STAR_CONFIG.RAYS_COUNT,
            STAR_CONFIG.RAY_LENGTH
        ),
        []
    );

    const halfPulse = STAR_CONFIG.SCALE_DURATION / 2;
    const totalFlightMs = useMemo(() => getGrainFlightTotalDurationMs(), []);

    const startFlightRef = useRef<(cx: number, cy: number) => void>(() => {});

    const finishChain = useCallback(() => {
        runningRef.current = false;
        const next = queueRef.current.shift();
        if (next) {
            runningRef.current = true;
            startFlightRef.current(next.cx, next.cy);
        }
    }, []);

    const afterCounterBumpAndStarHidden = useCallback(() => {
        hasRevealedStarRef.current = false;
        finishChain();
    }, [finishChain]);

    const applyCounterAfterPulse = useCallback(() => {
        const fadeMs = STAR_CONFIG.FADE_OUT_AFTER_REWARD_MS;
        counterBump.value = withSequence(
            withTiming(1.12, { duration: 90, easing: Easing.out(Easing.quad) }),
            withTiming(1, { duration: 110, easing: Easing.inOut(Easing.quad) }, bumpDone => {
                if (bumpDone === false) {
                    scheduleOnRN(finishChain);
                    return;
                }
                starOpacity.value = withTiming(0, {
                    duration: fadeMs,
                    easing: Easing.in(Easing.quad),
                }, hideDone => {
                    if (hideDone === false) {
                        scheduleOnRN(finishChain);
                        return;
                    }
                    scheduleOnRN(afterCounterBumpAndStarHidden);
                });
            })
        );
    }, [afterCounterBumpAndStarHidden, counterBump, finishChain, starOpacity]);

    const flyFromMeasuredLayout = useCallback(
        (layout: FlightLayout) => {
            const { ox, oy, cxWin, cyWin, endXWin, endYWin } = layout;
            startX.value = cxWin - ox;
            startY.value = cyWin - oy;
            endX.value = endXWin - ox;
            endY.value = endYWin - oy;

            /** Measure callback runs on JS; starting the driver on the UI runtime keeps Reanimated from cancelling the grain timeline immediately. */
            const grainFlightOnUI = () => {
                'worklet';
                cancelAnimation(masterProgress);
                masterProgress.value = 0;
                masterProgress.value = withTiming(1, {
                    duration: totalFlightMs,
                    easing: Easing.out(Easing.cubic),
                }, finished => {
                    // Only bail on explicit failure; `finished` can be undefined in some Reanimated paths.
                    if (finished === false) {
                        scheduleOnRN(finishChain);
                        return;
                    }
                    starScale.value = withSequence(
                        withTiming(STAR_PULSE_PEAK, {
                            duration: halfPulse,
                            easing: Easing.out(Easing.quad),
                        }),
                        withTiming(1, {
                            duration: halfPulse,
                            easing: Easing.inOut(Easing.quad),
                        }, pulseDone => {
                            if (pulseDone === false) {
                                scheduleOnRN(finishChain);
                                return;
                            }
                            scheduleOnRN(applyCounterAfterPulse);
                        })
                    );
                });
            };
            scheduleOnUI(grainFlightOnUI);
        },
        [
            applyCounterAfterPulse,
            endX,
            endY,
            finishChain,
            halfPulse,
            masterProgress,
            startX,
            startY,
            starScale,
            totalFlightMs,
        ]
    );

    const startFlightWork = useCallback(
        (cxWin: number, cyWin: number) => {
            if (!hasRevealedStarRef.current) {
                hasRevealedStarRef.current = true;
                starOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
            }

            const overlayNode = overlayRef.current;
            const starNode = starMeasureRef.current;
            if (!overlayNode || !starNode) {
                finishChain();
                return;
            }
            /** Prevents a second measure callback from calling flyFrom → cancelAnimation and killing the first withTiming (log showed finished:false mid-duration). */
            let flightLayoutCommitted = false;
            overlayNode.measureInWindow((ox, oy, ow, oh) => {
                starNode.measureInWindow((sx, sy, sw, sh) => {
                    if (flightLayoutCommitted) {
                        return;
                    }
                    flightLayoutCommitted = true;
                    const { cx: fallbackCenterX, cy: fallbackCenterY } = getStarFallbackCenterWindow(ox, oy, ow);
                    const endXWin = sw > 1 ? sx + sw / 2 : fallbackCenterX;
                    const endYWin = sh > 1 ? sy + sh / 2 : fallbackCenterY;
                    flyFromMeasuredLayout({ ox, oy, cxWin, cyWin, endXWin, endYWin });
                });
            });
        },
        [finishChain, flyFromMeasuredLayout, starOpacity, windowWidth]
    );

    useEffect(() => {
        startFlightRef.current = startFlightWork;
    }, [startFlightWork]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            deferCancelHandleRef.current?.cancel();
            deferCancelHandleRef.current = null;
            runningRef.current = false;
            queueRef.current = [];
        };
    }, []);

    const schedule = useCallback(
        (cx: number, cy: number) => {
            // While a flight runs, queue further taps so pulses/counters stay in order (no overlap).
            if (runningRef.current) {
                queueRef.current.push({ cx, cy });
                return;
            }
            runningRef.current = true;
            /**
             * CheckboxBurstEffect mounts a full-screen Modal on the same tap; two RAFs defer
             * measure + flight slightly without InteractionManager (which blocked ~400ms and still
             * yielded `finished:false` at progress 0 in logs).
             */
            const cxArg = cx;
            const cyArg = cy;
            deferCancelHandleRef.current?.cancel();
            deferCancelHandleRef.current = deferTwoFramesCancelable(() => {
                deferCancelHandleRef.current = null;
                if (!mountedRef.current) {
                    runningRef.current = false;
                    queueRef.current = [];
                    return;
                }
                startFlightWork(cxArg, cyArg);
            });
        },
        [startFlightWork]
    );

    /**
     * First effect run per overlay instance: align with store only (no animation).
     * Avoids replaying an accumulated `lastTrigger` when this component remounts (e.g. opening Edit).
     */
    const prevTriggerRef = useRef<number | null>(null);
    useEffect(() => {
        if (prevTriggerRef.current === null) {
            prevTriggerRef.current = lastTrigger;
            return;
        }
        if (lastTrigger <= prevTriggerRef.current) {
            return;
        }
        prevTriggerRef.current = lastTrigger;
        schedule(triggerCx, triggerCy);
    }, [lastTrigger, triggerCx, triggerCy, schedule]);

    /** After reward, the star is hidden (`starOpacity` 0) so Redux counter changes are invisible — briefly show it on decrease. */
    const prevStarPointsRef = useRef<number | null>(null);
    useEffect(() => {
        if (prevStarPointsRef.current === null) {
            prevStarPointsRef.current = counterDisplay;
            return;
        }
        if (counterDisplay < prevStarPointsRef.current && !runningRef.current) {
            scheduleOnUI(() => {
                'worklet';
                cancelAnimation(starOpacity);
                cancelAnimation(counterBump);
                starOpacity.value = withSequence(
                    withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }),
                    withTiming(1, { duration: 550 }),
                    withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) })
                );
                counterBump.value = withSequence(
                    withTiming(0.86, { duration: 120, easing: Easing.out(Easing.quad) }),
                    withTiming(1, { duration: 180, easing: Easing.inOut(Easing.quad) })
                );
            });
        }
        prevStarPointsRef.current = counterDisplay;
    }, [counterDisplay, counterBump, starOpacity]);

    const starWrapStyle = useMemo(() => {
        const { WIDTH, HEIGHT, POSITION } = STAR_CONFIG;
        /** Offset from top of the overlay view (safe area is outside this coordinate system). */
        const top = POSITION.TOP_FROM_SAFE_AREA;
        const base = { top, width: WIDTH, height: HEIGHT };
        const { ALIGN_HORIZONTAL, OFFSET_X } = POSITION;
        if (ALIGN_HORIZONTAL === 'left') {
            return [styles.starWrap, { ...base, left: OFFSET_X }];
        }
        if (ALIGN_HORIZONTAL === 'right') {
            return [styles.starWrap, { ...base, left: windowWidth - WIDTH + OFFSET_X }];
        }
        return [
            styles.starWrap,
            {
                ...base,
                left: 0,
                marginLeft: (windowWidth - WIDTH) / 2 + OFFSET_X,
            },
        ];
    }, [windowWidth]);

    const starAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: starScale.value }],
    }));

    const starVisibilityStyle = useAnimatedStyle(() => ({
        opacity: starOpacity.value,
    }));

    const counterTextStyle = useAnimatedStyle(() => ({
        transform: [{ scale: counterBump.value }],
    }));

    const grains = useMemo(
        () => Array.from({ length: ANIMATION_CONFIG.GRAIN_COUNT }, (_, i) => i),
        []
    );

    return (
        <View
            ref={overlayRef}
            style={[styles.overlay, { width: windowWidth, height: windowHeight }]}
            pointerEvents="box-none"
            collapsable={false}
        >
            <Animated.View style={starVisibilityStyle} pointerEvents="none">
                <View ref={starMeasureRef} style={starWrapStyle} pointerEvents="none" collapsable={false}>
                    <Animated.View style={[styles.starInner, starAnimatedStyle]}>
                        <Svg width={STAR_CONFIG.WIDTH} height={STAR_CONFIG.HEIGHT}>
                            <Polygon points={starPolygonPoints} fill="#DC2626" />
                        </Svg>
                        <Animated.View style={[styles.counterHit, counterTextStyle]}>
                            <Text style={styles.counterText} pointerEvents="none">
                                {counterDisplay}
                            </Text>
                        </Animated.View>
                    </Animated.View>
                </View>
            </Animated.View>
            {grains.map(i => (
                <FlyingGrain
                    key={i}
                    index={i}
                    masterProgress={masterProgress}
                    startX={startX}
                    startY={startY}
                    endX={endX}
                    endY={endY}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 50,
    },
    starWrap: {
        position: 'absolute',
        left: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    starInner: {
        width: STAR_CONFIG.WIDTH,
        height: STAR_CONFIG.HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterHit: {
        position: 'absolute',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        width: STAR_CONFIG.WIDTH,
        height: STAR_CONFIG.HEIGHT,
    },
    counterText: {
        fontSize: COUNTER_CONFIG.FONT_SIZE,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        minWidth: 28,
        includeFontPadding: false,
    },
    grainImg: {
        width: GRAIN_SIZE,
        height: GRAIN_SIZE,
    },
});
