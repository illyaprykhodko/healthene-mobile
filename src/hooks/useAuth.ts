// outsource dependencies
import { useCallback } from 'react';
// local dependencies
import { LoginData } from 'types';
import { resetStore, useAppDispatch } from '../store';
import { sessionManager } from '../store/api/baseApi';
import notificationService from 'services/notifications/notification.service';
import { useGetSelfQuery, useLoginMutation, useLogoutMutation } from '../store/api/authApi';

// NOTE module-level (not a ref) so the guard is shared across every `useAuth` consumer:
// the drawer button can be double-tapped, and `EmailForm` triggers logout from both the
// sheet's "Ok" handler and its dismiss handler, which fire for a single user action.
let isSigningOut = false;

export const useAuth = () => {
    const dispatch = useAppDispatch();
    const [login, { isLoading }] = useLoginMutation();
    const [logout, { isLoading: isLogoutLoading }] = useLogoutMutation();
    const { isLoading: isUserLoading } = useGetSelfQuery();

    const signIn = useCallback(async (credentials: LoginData) => {
        const session = await login(credentials).unwrap();
        return session;
    }, [login]);
    const signOut = useCallback(async () => {
        if (isSigningOut) { return; }
        isSigningOut = true;
        try {
            await logout().unwrap();
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            await notificationService.deleteDeviceToken();
            await sessionManager.update(null);
            dispatch(resetStore());
            isSigningOut = false;
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

