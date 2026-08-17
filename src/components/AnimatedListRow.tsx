// outsource dependencies
import React, { memo, useEffect, useState, type Key, type ReactNode } from 'react';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';

const STAGGER_MS = 60;
const MAX_STAGGER_STEPS = 8;

// Entrance configs are built ONCE at module scope. Building them inside `renderItem` allocated a new
// builder per row per parent render, which also broke React.memo on the row body.
// Pre-built staggered variants for the first paint wave only — worst-case delay is 8 * 60 = 480ms.
const ENTERING_WAVE = Array.from({ length: MAX_STAGGER_STEPS + 1 }, (_, step) =>
    FadeInDown.delay(step * STAGGER_MS).springify().mass(1.2).damping(30));

// Rows that arrive later (pagination) fade in without a positional delay — a delay there reads as
// "this row failed to load", because the user is already looking at that part of the list.
const ENTERING_PLAIN = FadeIn.duration(180);

interface AnimatedListRowProps {
    /** Stable identity — the row animates its entrance only the first time this key mounts. */
    itemKey: Key;
    /** Index within the section; used only for the first-wave stagger. */
    index: number;
    /** Set of keys that have already played their entrance. Owned by `useListEntrance`. */
    seenKeys: Set<Key>;
    children: ReactNode;
    /** True until the user scrolls / a new page lands. Read at mount only. */
    isFirstWave: boolean;
}

/**
 * Virtualization-aware entrance wrapper for list rows.
 *
 * Deliberately has no `exiting` and no `layout`: rows here are never removed locally and never
 * reflow (heights are fixed), so `FadeOut` would only ever keep a virtualized-away native view
 * alive mid-fling, and `LinearTransition` would be pure cost.
 *
 * Dev-only nuance: under React 19 StrictMode the double mount consumes the "unseen" flag on the
 * discarded first mount, so the entrance may not play in a dev build. Release builds are unaffected.
 */
const AnimatedListRowComponent: React.FC<AnimatedListRowProps> = ({
    index,
    itemKey,
    seenKeys,
    children,
    isFirstWave,
}) => {
    const reduceMotion = useReducedMotion();
    // Lazy initializer runs once per mount. A cell recycled by virtualization re-mounts with its key
    // already in `seenKeys`, so it appears instantly instead of re-firing the entrance.
    const [entering] = useState(() => {
        if (reduceMotion || seenKeys.has(itemKey)) { return undefined; }
        return isFirstWave ? ENTERING_WAVE[Math.min(index, MAX_STAGGER_STEPS)] : ENTERING_PLAIN;
    });

    useEffect(() => {
        seenKeys.add(itemKey);
    }, [seenKeys, itemKey]);

    return <Animated.View entering={entering}>{children}</Animated.View>;
};

AnimatedListRowComponent.displayName = 'AnimatedListRow';

export const AnimatedListRow = memo(AnimatedListRowComponent);
export default AnimatedListRow;
