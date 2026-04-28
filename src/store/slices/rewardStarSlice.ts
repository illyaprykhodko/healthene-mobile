// outsource dependencies
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// local dependencies
import type { RootState } from '../index';

export interface RewardStarState {
    lastTrigger: number;
    cx: number;
    cy: number;
}

const initialState: RewardStarState = {
    lastTrigger: 0,
    cx: 0,
    cy: 0,
};

export const rewardStarSlice = createSlice({
    name: 'rewardStar',
    initialState,
    reducers: {
        triggerReward: (state, action: PayloadAction<{ cx: number; cy: number }>) => {
            state.lastTrigger += 1;
            state.cx = action.payload.cx;
            state.cy = action.payload.cy;
        },
    },
});

export const { triggerReward } = rewardStarSlice.actions;

export const selectRewardStar = (state: RootState) => state.rewardStar;

export default rewardStarSlice.reducer;
