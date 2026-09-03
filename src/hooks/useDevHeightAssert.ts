// outsource dependencies
import { useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';

const TOLERANCE = 1;

// Module-level so a list of 200 rows produces ONE warning per offending label, not 200.
const reported = new Set<string>();

/**
 * Dev-only guard for the fixed row geometry that `getItemLayout` depends on.
 *
 * Rows and section headers carry an explicit `height` derived from a metrics module, so measuring
 * the container itself proves nothing — it always reports back exactly what the style set. What can
 * actually break is the CONTENT overflowing that reserved box after someone edits a padding, a font
 * size or a line height in the styles without touching the metrics. Then the row silently clips and
 * every `getItemLayout` offset below it drifts.
 *
 * Attach the returned handler to the unconstrained inner content view and pass the height actually
 * available to it (row height minus vertical padding and borders). Returns `undefined` outside dev,
 * so release builds do not subscribe to the layout event at all.
 */
export const useDevHeightAssert = (label: string, availableHeight: number) => {
    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;
        if (height <= availableHeight + TOLERANCE) { return; }

        const key = `${label}@${availableHeight}`;
        if (reported.has(key)) { return; }
        reported.add(key);

        console.warn(
            `[layout] ${label}: content measures ${Math.round(height)}px but only `
            + `${Math.round(availableHeight)}px is reserved. The row is clipping and getItemLayout `
            + 'offsets will drift — update the metrics module and the StyleSheet together.'
        );
    }, [label, availableHeight]);

    return __DEV__ ? handleLayout : undefined;
};

export default useDevHeightAssert;
