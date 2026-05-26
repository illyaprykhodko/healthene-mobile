// outsource dependencies
import { useMemo } from 'react';
// local dependencies
import { PHASE_ITEM_STATUS } from 'constants/spec';
import { useGetDayOverviewQuery } from 'store/api/dayOverviewApi';

export type AdherenceKey = 'meals' | 'activity' | 'supplements';

export interface AdherenceRing {
    done: number;
    label: string;
    color: string;
    total: number;
    key: AdherenceKey;
    /** 0..1 */
    progress: number;
}

// Apple-Health-style vivid ring colors, outer -> inner.
const RING_META: Record<AdherenceKey, { label: string; color: string }> = {
    meals: { label: 'Meals', color: '#FF4D6D' },
    activity: { label: 'Activity', color: '#22C55E' },
    supplements: { label: 'Supplements', color: '#3B82F6' },
};

const RING_ORDER: AdherenceKey[] = ['meals', 'activity', 'supplements'];

// Maps a scheduled phase to an adherence bucket. ANYTIME / QUESTION / MEASUREMENT
// phases are intentionally excluded — rings reflect the scheduled daily plan only.
function bucketForPhase (phaseType?: string): AdherenceKey | null {
    switch (phaseType) {
        case 'MEAL':
        case 'ADDED_BY_PATIENT':
            return 'meals';
        case 'PHYSICAL_ACTIVITY':
            return 'activity';
        case 'SUPPLEMENT':
        case 'MEDICATION':
            return 'supplements';
        default:
            return null;
    }
}

const isResolved = (status?: string) =>
    status === PHASE_ITEM_STATUS.DONE || status === PHASE_ITEM_STATUS.DID_NOT_EAT;

export function useDayAdherence (date: string) {
    const { data, isLoading, isFetching } = useGetDayOverviewQuery(date, { skip: !date });

    return useMemo(() => {
        const counts: Record<AdherenceKey, { done: number; total: number }> = {
            meals: { done: 0, total: 0 },
            activity: { done: 0, total: 0 },
            supplements: { done: 0, total: 0 },
        };

        for (const phase of data?.phases ?? []) {
            const bucket = bucketForPhase(phase?.type);
            if (!bucket) { continue; }
            for (const item of phase.items ?? []) {
                counts[bucket].total += 1;
                if (isResolved(item?.status)) { counts[bucket].done += 1; }
            }
        }

        const rings: AdherenceRing[] = RING_ORDER.map(key => {
            const { done, total } = counts[key];
            return {
                key,
                done,
                total,
                label: RING_META[key].label,
                color: RING_META[key].color,
                progress: total > 0 ? done / total : 0,
            };
        });

        const totalAll = rings.reduce((sum, ring) => sum + ring.total, 0);
        const doneAll = rings.reduce((sum, ring) => sum + ring.done, 0);

        return {
            rings,
            isLoading,
            isFetching,
            hasData: totalAll > 0,
            overall: totalAll > 0 ? doneAll / totalAll : 0,
        };
    }, [data, isLoading, isFetching]);
}
