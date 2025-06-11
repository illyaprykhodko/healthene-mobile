// outsource dependencies
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
// local dependencies
import { LoginData } from 'store/api/types';
import { PRIVATE } from '../constants/routes';
import { navigate } from '../services/navigation';
import { MessageService } from '../services/messages';
import { useLoginMutation } from '../store/api/authApi';

export const useAuth = () => {
    const dispatch = useDispatch();
    const [login, { isLoading }] = useLoginMutation();

    const signIn = useCallback(async (credentials: LoginData) => {
        try {
            const result = await login(credentials).unwrap();
            navigate(PRIVATE);
            return result;
        } catch (error) {
            MessageService.error({
                uid: 'SignIn',
                title: 'Sign In Error',
                message: error instanceof Error ? error.message : 'Authentication failed',
            });
            throw error;
        }
    }, [login]);

    return {
        signIn,
        isLoading,
    };
};
