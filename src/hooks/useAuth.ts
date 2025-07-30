// outsource dependencies
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
// local dependencies
import { LoginData } from 'types';
import { MessageService } from '../services/messages';
import { setSession, clearSession, setUser, setAuth } from '../store/slices/appSlice';
import { useGetSelfQuery, useLoginMutation, useLogoutMutation } from '../store/api/authApi';

export const useAuth = () => {
    const dispatch = useDispatch();
    const [login, { isLoading }] = useLoginMutation();
    const [logout, { isLoading: isLogoutLoading }] = useLogoutMutation();
    const { data: user, isLoading: isUserLoading } = useGetSelfQuery();
    const signIn = useCallback(async (credentials: LoginData) => {
        try {
            const session = await login(credentials).unwrap();
            dispatch(setSession(session));
            dispatch(setUser(user || null));
            return session;
        } catch (error) {
            MessageService.error({
                uid: 'SignIn',
                title: 'Sign In Error',
                message: error instanceof Error ? error.message : 'Authentication failed',
            });
            throw error;
        }
    }, [login]);

    const signOut = useCallback(async () => {
        await logout().unwrap();
        dispatch(clearSession());
        dispatch(setUser(null));
        dispatch(setAuth(false));
    }, [logout, dispatch]);

    return {
        signIn,
        signOut,
        isLoading,
        isUserLoading,
        isLogoutLoading,
    };
};

