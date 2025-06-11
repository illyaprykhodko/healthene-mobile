import { configureStore } from '@reduxjs/toolkit';
const createSagaMiddleware = require('@redux-saga/core')?.default || require('redux-saga');
import { all, put, takeEvery } from 'redux-saga/effects';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import appReducer from './slices/appSlice';
import signInReducer, { signInSaga } from './slices/signInSlice';
import { createSagaAction } from './utils/sagaUtils';
import { authApi } from './api/authApi';
import forgotPasswordReducer from './slices/forgotPasswordSlice';

// Create saga middleware
const sagaMiddleware = createSagaMiddleware();

// Configure store
export const store = configureStore({
    reducer: {
        app: appReducer,
        signIn: signInReducer,
        forgotPassword: forgotPasswordReducer,
        [authApi.reducerPath]: authApi.reducer,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: false,
        }).concat(sagaMiddleware, authApi.middleware),
});

// Saga actions
export const initApp = createSagaAction('app/init');
export const checkAppHealth = createSagaAction('app/checkHealth');
export const restoreAppSession = createSagaAction('app/restoreSession');

// Root saga
function * rootSaga (): Generator {
    yield all([
        takeEvery(initApp.type, initAppSaga),
        takeEvery(checkAppHealth.type, checkAppHealthSaga),
        takeEvery(restoreAppSession.type, restoreAppSessionSaga),
        signInSaga(),
    ]);
}

// App initialization saga
function * initAppSaga (): Generator {
    try {
        yield put({ type: 'app/setInitialized', payload: true });
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

// Health check saga
function * checkAppHealthSaga (): Generator {
    try {
        const { data: health } = yield authApi.endpoints.checkHealth.initiate();
        yield put({ type: 'app/setHealth', payload: health });
    } catch (error) {
        console.error('Failed to check app health:', error);
        yield put({ type: 'app/setHealth', payload: false });
    }
}

// Session restoration saga
function * restoreAppSessionSaga (): Generator {
    try {
        const { data: session } = yield authApi.endpoints.getSession.initiate();
        if (session) {
            yield put({ type: 'app/setSession', payload: session });
            const { data: user } = yield authApi.endpoints.getSelf.initiate();
            yield put({ type: 'app/setUser', payload: user });
        }
    } catch (error) {
        console.error('Failed to restore app session:', error);
        yield put({ type: 'app/clearSession' });
    }
}

// Run saga
sagaMiddleware.run(rootSaga);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Custom hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
