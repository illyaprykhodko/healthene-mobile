// outsource dependencies
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// local dependencies
import { PatientCategories } from 'store/api/categoryTreeApi.ts';

interface FoodPreferencesSlice {
    categories: PatientCategories[],
}

const initialState: FoodPreferencesSlice = {
    categories: [],
};

export const foodPreferencesSlice = createSlice({
    name: 'foodPreferences',
    initialState,
    reducers: {
        setCategories: (state, action: PayloadAction<PatientCategories[]>) => {
            state.categories = action.payload;
        },
    }
});

export const {
    setCategories
} = foodPreferencesSlice.actions;

export default foodPreferencesSlice.reducer;
