// outsource dependencies
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// local dependencies
import { authApi } from './api/authApi';
import appReducer from './slices/appSlice';
import { videoApi } from 'store/api/videoApi';
import { planApi } from 'store/api/planApi.ts';
import reactotron from '../../ReactotronConfig';
import { shoppingApi } from './api/shoppingApi';
import { questionApi } from './api/questionApi';
import signInReducer from './slices/signInSlice';
import { publicApi } from 'store/api/publicApi.ts';
import exerciseReducer from './slices/exerciseSlice';
import shoppingReducer from './slices/shoppingSlice';
import { dayOverviewApi } from './api/dayOverviewApi';
import { settingsApi } from 'store/api/settingsApi.ts';
import { s3ServiceApi } from 'store/api/s3ServiceApi.ts';
import { messengerApi } from 'store/api/messengerApi.ts';
import messengerSlice from 'store/slices/messengerSlice.ts';
import { dayOverviewReducer } from './slices/dayOverviewSlice';
import { categoryTreeApi } from 'store/api/categoryTreeApi.ts';
import { healthProfileApi } from 'store/api/healthProfileApi.ts';
import forgotPasswordReducer from './slices/forgotPasswordSlice';
import { healthProfileApi } from 'store/api/healthProfileApi.ts';
import { mealPreferencesApi } from 'store/api/mealPreferencesApi.ts';
import foodPreferencesSlice from 'store/slices/foodPreferrencesSlice.ts';
import { cuisineDistributionApi } from 'store/api/cuisineDistributionApi.ts';

export const store = configureStore({
    reducer: {
        app: appReducer,
        signIn: signInReducer,
        shopping: shoppingReducer,
        exercise: exerciseReducer,
        messenger: messengerSlice,
        dayOverview: dayOverviewReducer,
        healthProfile: healthProfileSlice,
        forgotPassword: forgotPasswordReducer,
        foodPreferences: foodPreferencesSlice,
        [authApi.reducerPath]: authApi.reducer,
        [planApi.reducerPath]: planApi.reducer,
        [videoApi.reducerPath]: videoApi.reducer,
        [publicApi.reducerPath]: publicApi.reducer,
        [questionApi.reducerPath]: questionApi.reducer,
        [settingsApi.reducerPath]: settingsApi.reducer,
        [shoppingApi.reducerPath]: shoppingApi.reducer,
        [s3ServiceApi.reducerPath]: s3ServiceApi.reducer,
        [messengerApi.reducerPath]: messengerApi.reducer,
        [dayOverviewApi.reducerPath]: dayOverviewApi.reducer,
        [categoryTreeApi.reducerPath]: categoryTreeApi.reducer,
        [healthProfileApi.reducerPath]: healthProfileApi.reducer,
        [mealPreferencesApi.reducerPath]: mealPreferencesApi.reducer,
        [cuisineDistributionApi.reducerPath]: cuisineDistributionApi.reducer,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({ serializableCheck: false })
            .concat(
                authApi.middleware,
                planApi.middleware,
                videoApi.middleware,
                publicApi.middleware,
                questionApi.middleware,
                settingsApi.middleware,
                shoppingApi.middleware,
                messengerApi.middleware,
                s3ServiceApi.middleware,
                dayOverviewApi.middleware,
                categoryTreeApi.middleware,
                healthProfileApi.middleware,
                mealPreferencesApi.middleware,
                cuisineDistributionApi.middleware,
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
