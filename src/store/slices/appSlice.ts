// outsource dependencies
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// local dependencies
import { AppState } from '../types';
import { UserSession, User } from 'types';
// import { User, Session } from 'store/api/types';

const initialState: AppState = {
    user: null,
    auth: false,
    wakeup: false,
    health: false,
    keyboard: false,
    accessToken: null,
    initialized: false,
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
        setSession: (state, action: PayloadAction<UserSession>) => {
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
