import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MESSAGE_TYPES, MessagesState, Message } from './types';

const initialState: MessagesState = {
    list: [],
};

const messagesSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        clear: () => initialState,
        updateMeta: (state, action: PayloadAction<Partial<MessagesState>>) => {
            return { ...state, ...action.payload };
        },
        add: (state, action: PayloadAction<Message>) => {
            state.list.push(action.payload);
        },
        remove: (state, action: PayloadAction<{ uid: string }>) => {
            state.list = state.list.filter(msg => msg.uid !== action.payload.uid);
        },
    },
});

export const { clear, updateMeta, add, remove } = messagesSlice.actions;
export const selector = (state: { messages: MessagesState }) => state.messages;
export default messagesSlice.reducer;
