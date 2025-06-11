import { call, put, takeEvery, select, Effect, SelectEffect, ForkEffect } from 'redux-saga/effects';
import Toast from 'react-native-toast-message';
import { add, remove, updateMeta } from './slice';
import { Message, MessagesState } from './types';
import Config from 'react-native-config';
import { RootState } from '../../store/types';
import { PayloadAction } from '@reduxjs/toolkit';

function * removeMessageSaga ({ payload }: PayloadAction<{ uid: string }>): Generator<Effect | SelectEffect, void, unknown> {
    const messages = (yield select((state: RootState) => state.messages)) as MessagesState;
    const list = messages.list.filter((item: Message) => item.uid !== payload.uid);
    yield put(updateMeta({ list }));
}

function * addMessageSaga ({ payload }: PayloadAction<Message>): Generator<Effect | SelectEffect, void, unknown> {
    // Validate required fields
    if (!payload.message || !payload.uid) {
        return;
    }

    // Handle toast
    if (typeof payload.toast === 'function') {
        yield call(payload.toast, payload.message);
    } else if (payload.toast && typeof payload.toast === 'object') {
        yield call([Toast, 'show'], {
            type: payload.type || 'info',
            text1: payload.title,
            text2: payload.message,
            position: payload.toast.position || 'top',
            visibilityTime: payload.toast.visibilityTime || 4000,
            autoHide: payload.toast.autoHide !== false,
            topOffset: payload.toast.topOffset || 40,
            bottomOffset: payload.toast.bottomOffset || 40,
        });
    }

    // Debug mode handling
    if (Config.APP_DEBUG) {
        const messages = (yield select((state: RootState) => state.messages)) as MessagesState;
        if (!messages.list.find((item: Message) => item.uid === payload.uid)) {
            const list = [...messages.list];
            list.unshift(payload);
            yield put(updateMeta({ list }));
        }
    }
}

export function * messagesSaga (): Generator<ForkEffect<never>, void, unknown> {
    yield takeEvery(add.type, addMessageSaga);
    yield takeEvery(remove.type, removeMessageSaga);
}
