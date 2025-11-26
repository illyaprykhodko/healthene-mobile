// outsource dependencies
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
// local dependencies
import { authApi } from './api/authApi';
import appReducer from './slices/appSlice';
import reactotron from '../../ReactotronConfig';
import signInReducer from './slices/signInSlice';
import { publicApi } from 'store/api/publicApi.ts';
import exerciseReducer from './slices/exerciseSlice';
import { dayOverviewApi } from './api/dayOverviewApi';
import { settingsApi } from 'store/api/settingsApi.ts';
import { s3ServiceApi } from 'store/api/s3ServiceApi.ts';
import { dayOverviewReducer } from './slices/dayOverviewSlice';
import { categoryTreeApi } from 'store/api/categoryTreeApi.ts';
import { messengerApi } from 'store/api/messengerApi.ts';
import forgotPasswordReducer from './slices/forgotPasswordSlice';
import foodPreferencesSlice from 'store/slices/foodPreferrencesSlice.ts';

export const store = configureStore({
    reducer: {
        app: appReducer,
        signIn: signInReducer,
        exercise: exerciseReducer,
        dayOverview: dayOverviewReducer,
        forgotPassword: forgotPasswordReducer,
        foodPreferences: foodPreferencesSlice,
        [authApi.reducerPath]: authApi.reducer,
        [publicApi.reducerPath]: publicApi.reducer,
        [settingsApi.reducerPath]: settingsApi.reducer,
        [s3ServiceApi.reducerPath]: s3ServiceApi.reducer,
        [messengerApi.reducerPath]: messengerApi.reducer,
        [dayOverviewApi.reducerPath]: dayOverviewApi.reducer,
        [categoryTreeApi.reducerPath]: categoryTreeApi.reducer,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({ serializableCheck: false })
            .concat(
                authApi.middleware,
                publicApi.middleware,
                settingsApi.middleware,
                messengerApi.middleware,
                s3ServiceApi.middleware,
                dayOverviewApi.middleware,
                categoryTreeApi.middleware,
            ),
    enhancers: getDefaultEnhancers =>
        getDefaultEnhancers().concat(reactotron.createEnhancer()),
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Custom hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
