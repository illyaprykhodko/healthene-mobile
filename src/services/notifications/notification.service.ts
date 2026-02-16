// outsource dependencies
import { Platform } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { PERMISSIONS, RESULTS, check, request, Permission } from 'react-native-permissions';

const DEFAULT_CHANNEL_ID = 'default-channel-id';

class NotificationService {
    private initialized = false;

    private unsubscribeOnMessage: (() => void) | null = null;

    private unsubscribeOpenedApp: (() => void) | null = null;

    private unsubscribeTokenRefresh: (() => void) | null = null;

    private readonly logPrefix = '[NotificationService]';

    private log (message: string, payload?: unknown): void {
        if (payload !== undefined) {
            // eslint-disable-next-line no-console
            console.log(`${this.logPrefix} ${message}`, payload);
            return;
        }
        // eslint-disable-next-line no-console
        console.log(`${this.logPrefix} ${message}`);
    }

    private static normalizeNotificationData (data: FirebaseMessagingTypes.RemoteMessage['data']): Record<string, string> | undefined {
        if (!data) { return undefined; }
        return Object.entries(data).reduce<Record<string, string>>((acc, [key, value]) => {
            if (value === undefined || value === null) { return acc; }
            acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
            return acc;
        }, {});
    }

    private async ensureAndroidPermission (): Promise<boolean> {
        if (Platform.OS !== 'android') { return true; }
        const permission = (PERMISSIONS.ANDROID as Record<string, Permission>).POST_NOTIFICATIONS;
        if (!permission) {
            // this.log('POST_NOTIFICATIONS is not available in current permissions package');
            return true;
        }
        const currentStatus = await check(permission);
        // this.log(`Android POST_NOTIFICATIONS status: ${currentStatus}`);
        if (currentStatus === RESULTS.GRANTED) { return true; }
        const requestedStatus = await request(permission);
        // this.log(`Android POST_NOTIFICATIONS request result: ${requestedStatus}`);
        return requestedStatus === RESULTS.GRANTED;
    }

    private async ensureMessagingPermission (): Promise<boolean> {
        const androidGranted = await this.ensureAndroidPermission();
        if (!androidGranted) {
            // this.log('Messaging permission blocked by Android permission');
            return false;
        }

        try {
            await messaging().setAutoInitEnabled(true);
            await messaging().registerDeviceForRemoteMessages();
            // this.log('Device registered for remote messages');
        } catch (error) {
            this.log('registerDeviceForRemoteMessages skipped/failed', error);
        }

        const status = await messaging().requestPermission();
        const authorized = (
            status === messaging.AuthorizationStatus.AUTHORIZED
            || status === messaging.AuthorizationStatus.PROVISIONAL
        );
        // this.log(`Messaging authorization status: ${status}. Authorized: ${authorized}`);

        if (Platform.OS === 'ios') {
            try {
                const apnsToken = await messaging().getAPNSToken();
                // this.log('APNS token', apnsToken);
            } catch (error) {
                this.log('Failed to get APNS token', error);
            }
        }

        return authorized;
    }

    private async createDefaultChannel (): Promise<void> {
        if (Platform.OS !== 'android') { return; }
        await notifee.createChannel({
            vibration: true,
            sound: 'default',
            id: DEFAULT_CHANNEL_ID,
            name: 'Default channel',
            description: 'A default channel',
            importance: AndroidImportance.HIGH,
        });
        // this.log(`Android channel ensured: ${DEFAULT_CHANNEL_ID}`);
    }

    private async displayForegroundNotification (remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
        const dataTitle = remoteMessage.data?.title;
        const dataMessage = remoteMessage.data?.message;
        const dataBody = remoteMessage.data?.body;
        const title = remoteMessage.notification?.title || (typeof dataTitle === 'string' ? dataTitle : undefined);
        const body = remoteMessage.notification?.body
            || (typeof dataMessage === 'string' ? dataMessage : undefined)
            || (typeof dataBody === 'string' ? dataBody : undefined);
        const normalizedData = NotificationService.normalizeNotificationData(remoteMessage.data);
        // this.log('Incoming message for local display', {
        //     messageId: remoteMessage.messageId,
        //     from: remoteMessage.from,
        //     title,
        //     body,
        //     data: normalizedData,
        // });
        if (!title && !body) {
            // this.log('Message has no visible content, skip local display');
            return;
        }
        await notifee.displayNotification({
            body: body || '',
            data: normalizedData,
            title: title || 'Notification',
            android: {
                channelId: DEFAULT_CHANNEL_ID,
                pressAction: {
                    id: 'default',
                },
                smallIcon: 'ic_launcher',
            },
        });
        // this.log('Local notification displayed');
    }

    private handleNotificationOpen (remoteMessage: FirebaseMessagingTypes.RemoteMessage | null): void {
        if (!remoteMessage) { return; }
        // TODO: map payload -> route and navigate when notification deep-link contract is finalized.
        // this.log('Opened notification', {
        //     messageId: remoteMessage.messageId,
        //     data: remoteMessage.data,
        // });
    }

    public async initialize (): Promise<void> {
        if (this.initialized) {
            // this.log('initialize skipped (already initialized)');
            return;
        }
        this.initialized = true;

        await this.createDefaultChannel();
        const hasPermission = await this.ensureMessagingPermission();
        // this.log(`initialize permission granted: ${hasPermission}`);

        this.unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
            // this.log('onMessage received', {
            //     data: remoteMessage.data,
            //     messageId: remoteMessage.messageId,
            //     notification: remoteMessage.notification,
            // });
            await this.displayForegroundNotification(remoteMessage);
        });

        this.unsubscribeOpenedApp = messaging().onNotificationOpenedApp(remoteMessage => {
            // this.log('onNotificationOpenedApp received', {
            //     messageId: remoteMessage?.messageId,
            //     data: remoteMessage?.data,
            // });
            this.handleNotificationOpen(remoteMessage);
        });

        this.unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
            // this.log('FCM token refreshed', token);
        });

        const initialMessage = await messaging().getInitialNotification();
        // this.log('getInitialNotification result', {
        //     messageId: initialMessage?.messageId,
        //     data: initialMessage?.data,
        // });
        this.handleNotificationOpen(initialMessage);
        // this.log('initialize complete');
    }

    public async getDeviceToken (): Promise<string | null> {
        try {
            const hasPermission = await this.ensureMessagingPermission();
            if (!hasPermission) {
                // this.log('getDeviceToken aborted: permission denied');
                return null;
            }
            const token = await messaging().getToken();
            // this.log('FCM token obtained', token);
            return token;
        } catch (error) {
            console.error('[NotificationService] Failed to get FCM token:', error);
            return null;
        }
    }

    public async deleteDeviceToken (): Promise<void> {
        try {
            await messaging().deleteToken();
            // this.log('FCM token deleted');
        } catch (error) {
            console.error('[NotificationService] Failed to delete FCM token:', error);
        }
    }

    public async handleBackgroundMessage (remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
        this.log('Background message received', {
            data: remoteMessage.data,
            messageId: remoteMessage.messageId,
            notification: remoteMessage.notification,
        });
        await this.createDefaultChannel();
        await this.displayForegroundNotification(remoteMessage);
    }

    public cleanup (): void {
        this.unsubscribeOnMessage?.();
        this.unsubscribeOnMessage = null;
        this.unsubscribeOpenedApp?.();
        this.unsubscribeOpenedApp = null;
        this.unsubscribeTokenRefresh?.();
        this.unsubscribeTokenRefresh = null;
        this.initialized = false;
        // this.log('cleanup complete');
    }
}

export const notificationService = new NotificationService();
export default notificationService;
