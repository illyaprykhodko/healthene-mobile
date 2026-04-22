// outsource dependencies
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// local dependencies
import type { RootState } from '../index';
import { ANIMATION_CONFIG } from '../../components/RewardStar/config';

export interface RewardStarState {
    lastTrigger: number;
    cx: number;
    cy: number;
    starPoints: number;
}

const initialState: RewardStarState = {
    lastTrigger: 0,
    cx: 0,
    cy: 0,
    starPoints: 0,
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
        addStarPoints: (state, action: PayloadAction<number | undefined>) => {
            const delta = action.payload ?? ANIMATION_CONFIG.COUNTER_INCREMENT;
            state.starPoints += delta;
        },
    },
});

export const { triggerReward, addStarPoints } = rewardStarSlice.actions;

export const selectRewardStar = (state: RootState) => state.rewardStar;

export const selectStarPoints = (state: RootState) => state.rewardStar.starPoints;

export default rewardStarSlice.reducer;
