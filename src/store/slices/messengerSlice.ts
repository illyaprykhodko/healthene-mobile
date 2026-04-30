// outsource dependencies
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// local dependencies
import { Attachment, MessageForm, MessageItem, Recipient } from 'types/messenger.ts';

interface MessengerState {
    reply: MessageItem | null;
    /**
     * Recipient explicitly chosen by the user on the Select Recipient screen.
     * Falls back to the user's primary physician when null (see WriteMessageScreen).
     * Cleared on send/leave.
     */
    collocutor: Recipient | null;
    initialValues: MessageForm
}

const initialState: MessengerState = {
    reply: null,
    collocutor: null,
    initialValues: {
        text: '',
        subject: '',
        attachments: []
    }
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
        setCollocutor: (state, action: PayloadAction<Recipient | null>) => {
            state.collocutor = action.payload;
        },
        clearCollocutor: state => { state.collocutor = null; },
        setAttachment: (state, action: PayloadAction<Attachment>) => {
            state.initialValues.attachments.push(action.payload);
        },
        removeAttachment: (state, action: PayloadAction<number>) => {
            state.initialValues.attachments = state.initialValues.attachments
                .filter(item => item.id !== action.payload);
        },
        saveMessageForm: (state, action: PayloadAction<MessageForm>) => {
            state.initialValues = { ...state.initialValues, ...action.payload };
        }
    },
});

export const {
    clear,
    setAttachment,
    setCollocutor,
    saveMessageForm,
    setReplyMessage,
    clearCollocutor,
    removeAttachment,
    clearReplyMessage,
} = messengerSlice.actions;

export default messengerSlice.reducer;
