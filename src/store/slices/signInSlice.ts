import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { call, put, takeEvery, Effect } from 'redux-saga/effects';
import { MessageService } from '@services/messages';
import { ROUTES } from '@constants/routes';
import { navigate } from '@services/navigation';
import { preloadDataSaga } from '../../sagas/preload';
import { LoginData, Session, getErrorMessage } from '@store/api/types';
import { authApi } from '@store/api/authApi';
import { createSagaAction } from '@store/utils/sagaUtils';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

// Types
export interface SignInState {
  disabled: boolean;
  initialized: boolean;
  initialValues: {
    email: string;
    password: string;
  };
  data: {
    client: string;
  };
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// export interface User {
//   id: string;
//   email: string;
//   // Add other user properties as needed
// }

// export interface LoginResponse {
//   user: User;
//   token: string;
// }

// export interface LoginError {
//   message: string;
//   code?: string;
//   details?: Record<string, string>;
// }

// Constants
export const FIELDS = {
    EMAIL: 'email',
    PASSWORD: 'password',
} as const;

// Initial State
const initialState: SignInState = {
    disabled: false,
    initialized: false,
    initialValues: {
        [FIELDS.EMAIL]: '',
        [FIELDS.PASSWORD]: '',
    },
    data: { client: 'patient_application' },
    error: null,
};

// Actions
export const signInActions = {
    submit: createSagaAction<LoginData>('signIn/submit'),
    initialize: createSagaAction('signIn/initialize'),
    clear: createSagaAction('signIn/clear'),
    updateData: createSagaAction<Partial<SignInState>>('signIn/updateData'),
    setError: createSagaAction<string | null>('signIn/setError'),
};

// Slice
const signInSlice = createSlice({
    name: 'signIn',
    initialState,
    reducers: {
        submit: (_, action: PayloadAction<LoginData>) => {},
        initialize: state => {
            state.initialized = true;
        },
        clear: () => initialState,
        updateData: (state, action: PayloadAction<Partial<SignInState>>) => {
            return { ...state, ...action.payload };
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

// Actions
export const { initialize, updateData, clear, submit, setError } = signInSlice.actions;
export const selector = (state: { signIn: SignInState }) => state.signIn;

// Sagas
export function * signInSaga (): Generator<Effect, void, unknown> {
    yield takeEvery(signInActions.submit.type, submitSaga);
    yield takeEvery(signInActions.initialize.type, initializeSaga);
}

function * initializeSaga (): Generator<Effect, void, unknown> {
    try {
        yield put(signInActions.updateData({ initialized: true }));
    } catch (error) {
        const errorMessage = getErrorMessage(error);
    // yield put(MessageService.error({
    //   uid: 'SignIn',
    //   debugCode: '11095',
    //   title: 'Sign In Error',
    //   message: errorMessage,
    //   explanation: errorMessage,
    // }));
    }
}

function * submitSaga ({ payload }: PayloadAction<LoginData>): Generator<Effect, void, unknown> {
    try {
    // Start progress
        yield put({ type: 'PROGRESS/START' });
        yield put(signInActions.updateData({ disabled: true, error: null }));
        yield put({ type: 'APP/DATA', initialized: false });

        // Attempt login using RTK Query
        const result: any = yield call([authApi.endpoints.login, 'initiate'], payload);
        if ('error' in result) {
            const error = result.error as { status: string; error: string };
            throw new Error(error.error);
        }
        const session = result.data as Session;

        // Update state after successful login
        yield put(signInActions.updateData({
            initialValues: { ...payload, password: '' },
            disabled: false
        }));
    
        // Update app state
        yield put({ type: 'APP/DATA', auth: true, user: session.user });
    
        // Clear messages and preload data
        yield put(MessageService.clearAll());
        yield call(preloadDataSaga);
    
        // Finalize
        yield put({ type: 'APP/DATA', initialized: true });
        yield put({ type: 'PROGRESS/DONE' });
    
        // Navigate to private area
        yield call(navigate, ROUTES.HOME);
    } catch (error) {
        const errorMessage = getErrorMessage(error);
    
        // Handle error state
        yield put(signInActions.updateData({
            disabled: false,
            initialValues: { ...payload, password: '' },
            error: errorMessage
        }));
    
        yield put({ type: 'APP/DATA', initialized: true });
        yield put({ type: 'PROGRESS/FAIL' });
    
    // Show error message
    // yield put(MessageService.error({
    //   uid: 'SignIn',
    //   debugCode: '11095',
    //   title: 'Sign In Error',
    //   message: errorMessage,
    //   explanation: errorMessage,
    // }));
    }
}

export default signInSlice.reducer;
