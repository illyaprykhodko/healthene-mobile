// outsource dependencies
import AsyncStorage from '@react-native-async-storage/async-storage';
// local dependencies
import { TOKEN_KEYS } from 'store/api/baseApi';

export const saveSession = async (session: any) => {
    await AsyncStorage.setItem(TOKEN_KEYS.STORE, JSON.stringify(session));
};

export const loadSession = async () => {
    const session = await AsyncStorage.getItem(TOKEN_KEYS.STORE);
    return session ? JSON.parse(session) : null;
};

export const clearSession = async () => {
    await AsyncStorage.removeItem(TOKEN_KEYS.STORE);
};
