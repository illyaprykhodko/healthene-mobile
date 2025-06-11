import { all, put } from 'redux-saga/effects';
import { Action } from '@reduxjs/toolkit';

// Import all slice actions
import { clear as clearSignIn } from '../store/slices/signInSlice';
import { clear as clearMessages } from '../services/messages/slice';

// Define action types for preload
export const PRELOAD_ACTIONS = {
    START: 'PRELOAD/START',
    DONE: 'PRELOAD/DONE',
    FAIL: 'PRELOAD/FAIL',
    CLEAR: 'PRELOAD/CLEAR',
} as const;

// Action creators
export const preloadActions = {
    start: () => ({ type: PRELOAD_ACTIONS.START }),
    done: () => ({ type: PRELOAD_ACTIONS.DONE }),
    fail: (error: Error) => ({ type: PRELOAD_ACTIONS.FAIL, payload: error }),
    clear: () => ({ type: PRELOAD_ACTIONS.CLEAR }),
};

// Preload saga
export function * preloadDataSaga () {
    try {
        yield put(preloadActions.start());
    
        // For example:
        // yield call(fetchUserData);
        // yield call(fetchSettings);
    
        yield put(preloadActions.done());
    } catch (error) {
        yield put(preloadActions.fail(error instanceof Error ? error : new Error('Unknown error')));
    }
}

// Clear preload data saga
export function * clearPreloadDataSaga () {
    yield all([
    // Clear all slices
        put(clearSignIn()),
        put(clearMessages()),
    
    // Add other clear actions as needed
    ]);
}
