// outsource dependencies
import { useCallback } from 'react';
// local dependencies
import { LoginData } from 'types';
import { resetStore, useAppDispatch } from '../store';
import { MessageService } from '../services/messages';
import { sessionManager } from '../store/api/baseApi';
import notificationService from 'services/notifications/notification.service';
import { useGetSelfQuery, useLoginMutation, useLogoutMutation } from '../store/api/authApi';

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
            await notificationService.deleteDeviceToken();
            await sessionManager.update(null);
            dispatch(resetStore());
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

