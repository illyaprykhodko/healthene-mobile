import { Message } from './types';
import Toast from 'react-native-toast-message';
import {
    Alert, Platform, AlertType
} from 'react-native';

// Constants
const DEFAULT_TITLE = 'Whoops!';
const DEFAULT_MESSAGE = 'Something went wrong.\n We are working to fix it.';

const DEFAULT_TOAST_CONFIG = {
    position: 'top' as const,
    visibilityTime: 4000,
    bottomOffset: 40,
    autoHide: true,
    topOffset: 40,
} as const;

const showToast = (type: Message['type'], title: string, message: string, options?: any) =>
    Toast.show({
        type,
        text1: title,
        text2: message,
        ...DEFAULT_TOAST_CONFIG,
        ...options
    });

// Message service functions
export const MessageService = {
    confirmation: (options: Message) =>
        MessageService.confirm(options)
            .then(() => ({ value: true }))
            .catch(() => ({ value: false })),

    alert: (options: Message) =>
        MessageService.redirect(options)
            .then(() => ({ value: true })),

    toastWarning: (message: string, options?: any) =>
        showToast('warning', 'Warning', message, options),

    toastSuccess: (message: string, options?: any) =>
        showToast('success', 'Success', message, options),

    dispatch: (options: Message) => {
        if (!options?.message) {
            return;
        }

        const type = options.type || 'info';
        const title = options.title || (type === 'warning' ? 'Warning' : type === 'success' ? 'Success' : 'Info');

        if (typeof options.toast === 'function') {
            options.toast(options.message);
            return;
        }

        showToast(type, title, options.message, options.toast);
    },

    clearAll: () => Toast.hide(),

    error: (options: Message) => {
        const message = options.debugCode
            ? `${options.message || DEFAULT_MESSAGE} \n ${options.debugCode}`
            : `${options.message || DEFAULT_MESSAGE}`;

        Alert.alert(
            DEFAULT_TITLE,
            message,
            [{ text: 'OK' }],
            { cancelable: false }
        );
    },

    warning: (options: Message) =>
        MessageService.toastWarning(options.message, options.toast),

    success: (options: Message) =>
        MessageService.toastSuccess(options.message, options.toast),

    confirm: (options: Message) =>
        new Promise<void>((resolve, reject) =>
            Alert.alert(
                options.title || 'Alert Title',
                options.message || 'Alert Msg',
                Platform.OS === 'ios'
                    ? [{ text: options.okText || 'Ok', onPress: () => resolve() }, { text: options.cancelText || 'Cancel', style: 'cancel', onPress: () => reject() },]
                    : [{ text: options.cancelText || 'Cancel', style: 'cancel', onPress: () => reject() }, { text: options.okText || 'Ok', onPress: () => resolve() },],
                { cancelable: false }
            )),

    redirect: (options: Message) =>
        new Promise<void>(resolve =>
            Alert.alert(
                options.title || 'Alert Title',
                options.message || 'Alert Msg',
                [{ text: options.okText || 'Ok', onPress: () => resolve() }],
                { cancelable: false }
            )),

    prompt: (options: Message) =>
        new Promise<string>((resolve, reject) => {
            const userInput = options.defaultValue || '';
            Alert.prompt(
                options.title,
                options.message,
                [
                    {
                        style: 'cancel',
                        text: options.cancelText || 'Cancel',
                        onPress: () => reject(new Error('User cancelled prompt')),
                    },
                    {
                        text: options.okText || 'OK',
                        onPress: (value?: string) => resolve(value || userInput),
                    },
                ],
        'default' as AlertType,
        options.defaultValue,
        options.keyboardType
            );
        }),
};
