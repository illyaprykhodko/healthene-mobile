// outsource dependencies
import { Habit } from 'types/healthProfile.ts';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface HealthProfileState {
    selectedHabits: Habit[]
}

const initialState: HealthProfileState = {
    selectedHabits: [],
};

const healthProfileSlice = createSlice({
    name: 'healthProfile',
    initialState,
    reducers: {
        clear: () => initialState,
        setSelectedHabits: (state, action: PayloadAction<Habit[]>) => {
            state.selectedHabits = action.payload;
        },
        toggleHabit: (state, action: PayloadAction<Habit>) => {
            const exists = state.selectedHabits.some(
                habit => habit.id === action.payload.id
            );

            if (exists) {
                state.selectedHabits = state.selectedHabits.filter(
                    habit => habit.id !== action.payload.id
                );
            } else {
                state.selectedHabits.push(action.payload);
            }
        },
    },
});

export const {
    clear,
    toggleHabit,
    setSelectedHabits
} = healthProfileSlice.actions;

export default healthProfileSlice.reducer;
