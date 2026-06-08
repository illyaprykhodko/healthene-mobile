// outsource dependencies
// (no external imports — pure helpers operating on day-overview phase items)

// local dependencies
import { PHASE_ITEM_STATUS } from 'constants/spec';

/**
 * True when a phase item is one of the exercise shapes (`EXERCISE_*` types or the
 * legacy `PHYSICAL_ACTIVITY` wrapper). Used to slice ANYTIME phase items into the
 * exercise subset for the Anytime Activity modal.
 */
export function isAnytimeExerciseItem (item: any): boolean {
    return Boolean(item?.type?.startsWith?.('EXERCISE_')) || item?.type === 'PHYSICAL_ACTIVITY';
}

/**
 * Treats a phase item as "fully done" when its own status is DONE/DID_NOT_EAT
 * AND every nested item (if any) is also fully done. Used both for category
 * roll-ups and for deriving phase status after edits.
 */
export function isItemFullyDone (item: any): boolean {
    if (!item) { return false; }
    if (![PHASE_ITEM_STATUS.DONE, PHASE_ITEM_STATUS.DID_NOT_EAT].includes(item.status)) { return false; }
    if (Array.isArray(item.list) && item.list.length) { return item.list.every(isItemFullyDone); }
    return true;
}

export function areAllItemsFullyDone (items: any[] = []): boolean {
    return items.every(isItemFullyDone);
}

/**
 * Roll a list of exercises up to a single phase-level status. On past days we
 * surface INCOMPLETE instead of PENDING so the UI doesn't pretend the day is
 * still actionable.
 */
export function getPhaseNewStatus (exercises: any[] = [], isToday: boolean): string {
    if (areAllItemsFullyDone(exercises)) {
        return PHASE_ITEM_STATUS.DONE;
    }
    return isToday ? PHASE_ITEM_STATUS.PENDING : PHASE_ITEM_STATUS.INCOMPLETE;
}

/**
 * Category-level status for a group of exercise items:
 *   - DONE       — every child is DONE
 *   - INCOMPLETE — at least one child is INCOMPLETE/DONE (mixed state)
 *   - null       — everything still pending / empty group (caller renders chevron)
 */
export function getCategoryStatus (items: any[]): string | null {
    if (!items?.length) {
        return null;
    }

    const allSkipped = items.every(item => item.status === PHASE_ITEM_STATUS.DID_NOT_EAT);
    if (allSkipped) {
        return PHASE_ITEM_STATUS.DID_NOT_EAT;
    }

    const allDone = items.every(item => item.status === PHASE_ITEM_STATUS.DONE);
    if (allDone) {
        return PHASE_ITEM_STATUS.DONE;
    }

    const hasDone = items.some(item =>
        item.status === PHASE_ITEM_STATUS.INCOMPLETE || item.status === PHASE_ITEM_STATUS.DONE);
    if (hasDone) {
        return PHASE_ITEM_STATUS.INCOMPLETE;
    }

    return null;
}

/**
 * Normalises a raw phase-item into the shape exercise screens consume.
 *
 *   - Nested categories (item.list[]) are walked recursively.
 *   - Items carrying a `physicalActivity` payload (PHYSICAL_ACTIVITY phase) are
 *     flattened with their activity data merged in.
 *   - Items carrying an `exercise` payload (EXERCISE_* types) are flattened
 *     with the exercise data merged in.
 *
 * The phase-item's own id/type/status/title always wins over the nested
 * payload so the UI keeps a stable identity to mutate against.
 */
export function extractExercise (item: any): any {
    if (!item) {
        return null;
    }

    // Category node — recurse into its list, drop nulls.
    if (Array.isArray(item.list) && item.list.length > 0) {
        return {
            ...item,
            id: item.id,
            type: item.type,
            title: item.title || item.name,
            status: item.status || PHASE_ITEM_STATUS.PENDING,
            list: item.list.map(extractExercise).filter(Boolean),
        };
    }

    if (item.physicalActivity) {
        return {
            ...item.physicalActivity,
            id: item.id,
            type: item.type,
            status: item.status,
            title: item.title || item.physicalActivity?.title,
        };
    }

    return {
        ...item?.exercise,
        id: item.id,
        type: item?.type,
        status: item?.status,
        title: item.title || item?.exercise?.title,
    };
}
