import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ForgotPasswordState {
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  email: string;
}

const initialState: ForgotPasswordState = {
    email: '',
    error: null,
    success: false,
    isSubmitting: false,
};

const forgotPasswordSlice = createSlice({
    name: 'forgotPassword',
    initialState,
    reducers: {
        setSubmitting: (state, action: PayloadAction<boolean>) => {
            state.isSubmitting = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        setSuccess: (state, action: PayloadAction<boolean>) => {
            state.success = action.payload;
        },
        setEmail: (state, action: PayloadAction<string>) => {
            state.email = action.payload;
        },
        reset: () => initialState,
    },
});

export const {
    setSubmitting,
    setSuccess,
    setError,
    setEmail,
    reset,
} = forgotPasswordSlice.actions;

export default forgotPasswordSlice.reducer;
