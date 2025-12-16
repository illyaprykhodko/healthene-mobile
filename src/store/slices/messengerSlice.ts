// outsource dependencies
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// local dependencies
import { Attachment, MessageItem } from 'types/messenger.ts';

interface MessengerState {
    reply: MessageItem | null;
    attachments: Attachment[];
}

const initialState: MessengerState = {
    reply: null,
    attachments: []
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
        setAttachment: (state, action: PayloadAction<Attachment>) => {
            state.attachments.push(action.payload);
        },
    },
});

export const {
    clear,
    setAttachment,
    setReplyMessage,
    clearReplyMessage
} = messengerSlice.actions;

export default messengerSlice.reducer;
