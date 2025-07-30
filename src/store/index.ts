// outsource dependencies
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
// local dependencies
import { authApi } from './api/authApi';
import appReducer from './slices/appSlice';
import signInReducer from './slices/signInSlice';
import forgotPasswordReducer from './slices/forgotPasswordSlice';

export const store = configureStore({
    reducer: {
        app: appReducer,
        signIn: signInReducer,
        forgotPassword: forgotPasswordReducer,
        [authApi.reducerPath]: authApi.reducer,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(authApi.middleware),
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Custom hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Saga actions
// export const initApp = createSagaAction('app/init');
// export const checkAppHealth = createSagaAction('app/checkHealth');
// export const restoreAppSession = createSagaAction('app/restoreSession');
