// outsource dependencies
import { useCallback, useRef, type Key } from 'react';

export interface ListEntrance {
    /** Keys that have already played their entrance. Stable instance — never invalidates memoization. */
    seenKeys: Set<Key>;
    /** Ends the staggered wave — later rows fade in without a positional delay. */
    endFirstWave: () => void;
    /** Replays the wave for a fresh dataset (category switch, item-type switch, pull-to-refresh). */
    resetEntrance: () => void;
    /** Read at row mount time; true only until the user scrolls or a new page lands. */
    firstWaveRef: { current: boolean };
}

/**
 * Bookkeeping for one-shot row entrance animations in a virtualized list.
 *
 * Without it, a Reanimated `entering` animation re-fires every time virtualization remounts a cell,
 * so rows scrolled into view sit blank for the length of the stagger and read as "not loaded yet".
 */
export const useListEntrance = (): ListEntrance => {
    const seenKeys = useRef(new Set<Key>()).current;
    const firstWaveRef = useRef(true);

    const endFirstWave = useCallback(() => { firstWaveRef.current = false; }, []);

    const resetEntrance = useCallback(() => {
        seenKeys.clear();
        firstWaveRef.current = true;
    }, [seenKeys]);

    return { seenKeys, firstWaveRef, endFirstWave, resetEntrance };
};

export default useListEntrance;
