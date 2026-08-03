// outsource dependencies
import { TextStyle } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
// local dependencies
import Text, { type TextVariant } from 'components/Text';

interface AnimatedCountProps {
    /** Target integer value to display. */
    value: number;
    /** Tween duration in ms. */
    duration?: number;
    variant?: TextVariant;
    style?: TextStyle | TextStyle[];
}

/**
 * Smoothly "counts up" (or down) the displayed integer toward `value` with an easeOut tween.
 * Sensors report steps in batches (e.g. 5 → 12 → 15); this only smooths the on-screen number —
 * the underlying value is unchanged. Honours Reduce Motion (jumps straight to the value).
 */
export function AnimatedCount ({ value, duration = 450, variant, style }: AnimatedCountProps): React.JSX.Element {
    const reduceMotion = useReducedMotion();
    const [display, setDisplay] = useState(value);
    const displayRef = useRef(value);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const raf = globalThis.requestAnimationFrame.bind(globalThis);
        const caf = globalThis.cancelAnimationFrame.bind(globalThis);

        const setBoth = (next: number) => {
            displayRef.current = next;
            setDisplay(next);
        };

        if (reduceMotion || duration <= 0) {
            setBoth(value);
            return;
        }

        const from = displayRef.current;
        const to = value;
        if (from === to) { return; }

        let startTs = 0;
        const tick = (ts: number) => {
            if (!startTs) { startTs = ts; }
            const t = Math.min(1, (ts - startTs) / duration);
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            setBoth(Math.round(from + (to - from) * eased));
            if (t < 1) { rafRef.current = raf(tick); }
        };
        rafRef.current = raf(tick);

        return () => {
            if (rafRef.current != null) { caf(rafRef.current); }
        };
    }, [value, duration, reduceMotion]);

    return <Text variant={variant} style={style}>{display}</Text>;
}
