import { Image, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import React, { memo } from 'react';
import { ANIMATION_CONFIG, getGrainFlightTotalDurationMs } from './config';
import { ARC_CAP_PX, GRAIN_HALF, GRAIN_SIZE } from './rewardStarOverlayHelpers';

const seedImage = require('../../../assets/seed.png');

export interface FlyingGrainProps {
    index: number;
    masterProgress: SharedValue<number>;
    startX: SharedValue<number>;
    startY: SharedValue<number>;
    endX: SharedValue<number>;
    endY: SharedValue<number>;
}

/** One grain: staggered segment of master timeline; absolute left/top in overlay space. */
export const FlyingGrain = memo(({ index, masterProgress, startX, startY, endX, endY }: FlyingGrainProps) => {
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
            <Image resizeMode="contain" source={seedImage} style={styles.grainImg} />
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    grainImg: {
        width: GRAIN_SIZE,
        height: GRAIN_SIZE,
    },
});
