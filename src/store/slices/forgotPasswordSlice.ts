import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch } from '../index';
import { authApi } from '../api/authApi';

interface ForgotPasswordState {
  email: string | null;
  error: string | null;
  success: boolean;
  isSubmitting: boolean;
  disabled: boolean;
  initialized: boolean;
  initialValues: {
    email: string;
  };
}

const initialState: ForgotPasswordState = {
    email: null,
    error: null,
    success: false,
    isSubmitting: false,
    disabled: true,
    initialized: false,
    initialValues: {
        email: '',
    },
};

const forgotPasswordSlice = createSlice({
    name: 'forgotPassword',
    initialState,
    reducers: {
        setEmail: (state, action: PayloadAction<string>) => {
            state.email = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        setSuccess: (state, action: PayloadAction<boolean>) => {
            state.success = action.payload;
        },
        setSubmitting: (state, action: PayloadAction<boolean>) => {
            state.isSubmitting = action.payload;
        },
        reset: state => {
            Object.assign(state, initialState);
        },
        setInitialized: (state, action: PayloadAction<boolean>) => {
            state.initialized = action.payload;
        },
        setDisabled: (state, action: PayloadAction<boolean>) => {
            state.disabled = action.payload;
        },
    },
});

export const {
    setEmail,
    setError,
    setSuccess,
    setSubmitting,
    reset,
    setInitialized,
    setDisabled,
} = forgotPasswordSlice.actions;

// Thunks
export const initialize = () => (dispatch: AppDispatch) => {
    dispatch(setInitialized(true));
    dispatch(setDisabled(false));
};

export const sendEmail = (formData: { email: string }) => async (dispatch: AppDispatch) => {
    try {
        dispatch(setSubmitting(true));
        dispatch(setError(null));
    
        await authApi.endpoints.forgotPassword.initiate({ email: formData.email });
    
        dispatch(setEmail(formData.email));
        dispatch(setSuccess(true));
    } catch (error: any) {
        dispatch(setError(error.message || 'Failed to send reset email'));
    } finally {
        dispatch(setSubmitting(false));
    }
};

export default forgotPasswordSlice.reducer;
