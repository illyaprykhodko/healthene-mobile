// outsource dependencies
import { useCallback } from 'react';
// local dependencies
import { LoginData } from 'types';
import { useAppDispatch } from '../store';
import { MessageService } from '../services/messages';
import { clearSession, setUser, setAuth } from '../store/slices/appSlice';
import { authApi, useGetSelfQuery, useLoginMutation, useLogoutMutation } from '../store/api/authApi';

export const useAuth = () => {
    const dispatch = useAppDispatch();
    const [login, { isLoading }] = useLoginMutation();
    const [logout, { isLoading: isLogoutLoading }] = useLogoutMutation();
    const { isLoading: isUserLoading } = useGetSelfQuery();
    
    const signIn = useCallback(async (credentials: LoginData) => {
        try {
            const session = await login(credentials).unwrap();
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
        try {
            await logout().unwrap();
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            dispatch(clearSession());
            dispatch(setUser(null));
            dispatch(setAuth(false));
            
            // Reset all cache
            dispatch(authApi.util.resetApiState());
        }
    }, [logout, dispatch]);

    return {
        signIn,
        signOut,
        isLoading,
        isUserLoading,
        isLogoutLoading,
    };
};

