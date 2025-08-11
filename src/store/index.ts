// outsource dependencies
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
// local dependencies
import { authApi } from './api/authApi';
import appReducer from './slices/appSlice';
import signInReducer from './slices/signInSlice';
import { dayOverviewApi } from './api/dayOverviewApi';
import { dayOverviewReducer } from './slices/dayOverviewSlice';
import forgotPasswordReducer from './slices/forgotPasswordSlice';

export const store = configureStore({
    reducer: {
        app: appReducer,
        signIn: signInReducer,
        dayOverview: dayOverviewReducer,
        forgotPassword: forgotPasswordReducer,
        [authApi.reducerPath]: authApi.reducer,
        [dayOverviewApi.reducerPath]: dayOverviewApi.reducer,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({ serializableCheck: false })
            .concat(authApi.middleware, dayOverviewApi.middleware),
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Custom hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
