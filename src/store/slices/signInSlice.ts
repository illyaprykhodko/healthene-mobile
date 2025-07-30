import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SignInState {
  isSubmitting: boolean;
  error: string | null;
  formData: {
    email: string;
    password: string;
  };
}

const initialState: SignInState = {
    isSubmitting: false,
    error: null,
    formData: {
        email: '',
        password: '',
    },
};

const signInSlice = createSlice({
    name: 'signIn',
    initialState,
    reducers: {
        setSubmitting: (state, action: PayloadAction<boolean>) => {
            state.isSubmitting = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        setFormData: (state, action: PayloadAction<Partial<SignInState['formData']>>) => {
            state.formData = { ...state.formData, ...action.payload };
        },
        reset: () => initialState,
    },
});

export const { setSubmitting, setError, setFormData, reset } = signInSlice.actions;
export default signInSlice.reducer;
