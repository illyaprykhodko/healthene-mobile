// outsource dependencies
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// local dependencies
import { WALKING_TYPE, type WalkingTypeValue } from 'constants/spec';

export interface WalkingActivityState {
    distance: number;
    stopwatch: string;
    stepCount: number;
    disabled: boolean;
    goalProgress: number;
    start: string | null;
    pause: string | null;
    initialized: boolean;
    activityCount: number;
    pauseDuration: number;
    isCurrentDate: boolean;
    status: WalkingTypeValue;
    activityCountUnit: string;
    activityId: number | null;
    activityEntityId: number | null;
    /** Steps committed from completed (paused) walking segments; the live segment is added on top. */
    accumulatedSteps: number;
    /** User-facing reason the live step counter is unavailable (permission denied / no sensor), or null. */
    stepError: string | null;
    /** Phase-item essentials kept so the background controller can mark it DONE when the goal is hit off-screen. */
    sessionItem: { id: number | string; type?: string; title?: string } | null;
    sessionPhaseId: number | string | null;
    sessionDate: string | null;
}

const initialState: WalkingActivityState = {
    start: null,
    pause: null,
    distance: 0,
    stepCount: 0,
    stepError: null,
    goalProgress: 0,
    disabled: false,
    activityCount: 0,
    activityId: null,
    pauseDuration: 0,
    sessionItem: null,
    sessionDate: null,
    initialized: false,
    isCurrentDate: true,
    accumulatedSteps: 0,
    sessionPhaseId: null,
    stopwatch: '00:00.00',
    activityEntityId: null,
    activityCountUnit: 'steps',
    status: WALKING_TYPE.PENDING,
};

const walkingActivitySlice = createSlice({
    name: 'walkingActivity',
    initialState,
    reducers: {
        setWalkingMeta (state, action: PayloadAction<Partial<WalkingActivityState>>) {
            return { ...state, ...action.payload };
        },
        resetWalking () {
            return initialState;
        },
    },
});

export const { setWalkingMeta, resetWalking } = walkingActivitySlice.actions;
export default walkingActivitySlice.reducer;
