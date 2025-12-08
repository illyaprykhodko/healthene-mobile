// outsource dependencies
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// local dependencies
import { MessageItem } from 'types/messenger.ts';

interface MessengerState {
    reply: MessageItem | null;
}

const initialState: MessengerState = {
    reply: null,
};

const messengerSlice = createSlice({
    name: 'messenger',
    initialState,
    reducers: {
        clear: () => initialState,
        clearReplyMessage: state => { state.reply = null; },
        setReplyMessage: (state, action: PayloadAction<MessageItem | null>) => {
            state.reply = action.payload;
        },
    },
});

export const {
    clear,
    setReplyMessage,
    clearReplyMessage
} = messengerSlice.actions;

export default messengerSlice.reducer;
