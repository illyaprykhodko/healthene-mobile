// outsource dependencies
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// local dependencies
import { Attachment, MessageForm, MessageItem } from 'types/messenger.ts';

interface MessengerState {
    reply: MessageItem | null;
    initialValues: MessageForm
}

const initialState: MessengerState = {
    reply: null,
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
    saveMessageForm,
    setReplyMessage,
    removeAttachment,
    clearReplyMessage
} = messengerSlice.actions;

export default messengerSlice.reducer;
