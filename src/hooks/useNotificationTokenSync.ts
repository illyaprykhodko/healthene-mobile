// outsource dependencies
import { useEffect } from 'react';
// local dependencies
import { RootState, useAppSelector } from 'store';
import { useRegisterNotificationTokenMutation } from 'store/api/authApi';
import notificationService from 'services/notifications/notification.service';

/**
 * Sends the device's FCM token to the backend so it can address push notifications
 * at this installation.
 *
 * NOTE the timing mirrors v1, which dispatched `REGISTER_NOTIFICATION` when the user
 * entered the private area (never from the sign-in screen): the endpoint lives behind
 * auth, so the token can only be registered once a session exists. Re-registering on
 * every authenticated mount is intentional and cheap — the backend upserts by token,
 * and it repairs installations whose token rotated while the app was closed.
 */
export const useNotificationTokenSync = (): void => {
    const isAuthenticated = useAppSelector((state: RootState) => state.app.auth);
    const [registerNotificationToken] = useRegisterNotificationTokenMutation();

    useEffect(() => {
        if (!isAuthenticated) {
            notificationService.setTokenRefreshHandler(null);
            return;
        }

        let cancelled = false;

        // NOTE never surface a failure here to the patient: a token that did not
        // register costs push delivery, not access to the app. Log the status only —
        // the token itself is a device identifier and must not reach the logs.
        const register = async (token: string): Promise<void> => {
            try {
                await registerNotificationToken({ token }).unwrap();
            } catch (error) {
                const status = (error as { status?: unknown })?.status;
                console.warn('[useNotificationTokenSync] Failed to register FCM token, status:', status);
            }
        };

        const sync = async (): Promise<void> => {
            const token = await notificationService.getDeviceToken();
            if (!token || cancelled) { return; }
            await register(token);
        };

        notificationService.setTokenRefreshHandler(token => { void register(token); });
        void sync();

        return () => {
            cancelled = true;
            notificationService.setTokenRefreshHandler(null);
        };
    }, [
        isAuthenticated,
        registerNotificationToken,
    ]);
};
