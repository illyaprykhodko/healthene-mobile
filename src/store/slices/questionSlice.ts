// outsource dependencies
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface QuestionState {
    responseText: string;
}

const initialState: QuestionState = {
    responseText: '',
};

const questionSlice = createSlice({
    name: 'question',
    initialState,
    reducers: {
        setResponseText: (state, action: PayloadAction<string>) => {
            state.responseText = action.payload;
        },
        reset: () => initialState,
    },
});

export const {
    setResponseText,
    reset,
} = questionSlice.actions;

export default questionSlice.reducer;
