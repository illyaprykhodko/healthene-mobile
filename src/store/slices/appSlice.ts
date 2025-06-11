import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppState } from '../types';
import { User, Session } from 'store/api/types';

const initialState: AppState = {
    initialized: false,
    health: false,
    auth: false,
    user: null,
    accessToken: null,
    wakeup: false,
    keyboard: false,
};

export const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setInitialized: (state, action: PayloadAction<boolean>) => {
            state.initialized = action.payload;
        },
        setHealth: (state, action: PayloadAction<boolean>) => {
            state.health = action.payload;
        },
        setAuth: (state, action: PayloadAction<boolean>) => {
            state.auth = action.payload;
        },
        setUser: (state, action: PayloadAction<User | null>) => {
            state.user = action.payload;
        },
        setSession: (state, action: PayloadAction<Session>) => {
            state.accessToken = action.payload.accessToken;
            state.auth = true;
            // state.user = action.payload.user;
        },
        clearSession: state => {
            state.accessToken = null;
            state.auth = false;
            state.user = null;
        },
        setWakeup: (state, action: PayloadAction<boolean>) => {
            state.wakeup = action.payload;
        },
        setKeyboardState: (state, action: PayloadAction<boolean>) => {
            state.keyboard = action.payload;
        },
    },
});

export const {
    setInitialized,
    setHealth,
    setAuth,
    setUser,
    setSession,
    clearSession,
    setWakeup,
    setKeyboardState,
} = appSlice.actions;

export default appSlice.reducer;
