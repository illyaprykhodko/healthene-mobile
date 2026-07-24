// outsource dependencies
import moment from 'moment';
import { Platform, Linking } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';
import {
    getToken,
    onMessage,
    deleteToken,
    getMessaging,
    getAPNSToken,
    onTokenRefresh,
    setAutoInitEnabled,
    getInitialNotification,
    onNotificationOpenedApp,
    type FirebaseMessagingTypes,
    registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';
import {
    check,
    request,
    RESULTS,
    Permission,
    PERMISSIONS,
    requestNotifications,
} from 'react-native-permissions';

// local dependencies
import { store } from 'store';
import { ROUTES } from 'constants/routes';
import { navigationRef } from 'services/navigation';
import {
    isWeightDeepLink,
    getNotificationDeepLink,
    isMessageThreadDeepLink,
    getMessageThreadIdFromDeepLink,
} from 'services/deepLink';

const DEFAULT_CHANNEL_ID = 'default-channel-id';
// NOTE max time we wait for the navigation tree + auth state to settle before
// giving up on a tapped deep link. 80 * 250ms = 20s — same upper bound as the
// v1 saga (`waitForPrivateNavigationReady`).
const NAVIGATION_READY_MAX_ATTEMPTS = 80;
const NAVIGATION_READY_POLL_MS = 250;

class NotificationService {
    private initialized = false;

    private readonly messaging = getMessaging();

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
        if (!permission) { return true; }
        const currentStatus = await check(permission);
        if (currentStatus === RESULTS.GRANTED) { return true; }
        const requestedStatus = await request(permission);
        return requestedStatus === RESULTS.GRANTED;
    }

    private async ensureMessagingPermission (): Promise<boolean> {
        const androidGranted = await this.ensureAndroidPermission();
        if (!androidGranted) { return false; }

        try {
            await setAutoInitEnabled(this.messaging, true);
            await registerDeviceForRemoteMessages(this.messaging);
        } catch (error) {
            this.log('registerDeviceForRemoteMessages skipped/failed', error);
        }

        // iOS notification permission via react-native-permissions (RNFB v25 deprecated
        // messaging().requestPermission()). NOTE: the react-native-permissions 'Notifications'
        // handler MUST stay disabled in the Podfile setup_permissions — enabling it conflicts
        // with Firebase Messaging's APNs handling and breaks push delivery. On Android the
        // POST_NOTIFICATIONS gate above is authoritative.
        if (Platform.OS !== 'ios') { return true; }

        const { status } = await requestNotifications(['alert', 'sound', 'badge']);
        const authorized = status === RESULTS.GRANTED || status === RESULTS.LIMITED;

        try {
            await getAPNSToken(this.messaging);
        } catch (error) {
            this.log('Failed to get APNS token', error);
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
        if (!title && !body) { return; }
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
    }

    /**
     * Block (poll) until the navigation container is mounted AND the auth
     * pipeline finished (`auth + initialized`), or give up after the timeout.
     * Mirrors v1's `waitForPrivateNavigationReady` saga so deep links opened
     * from a cold start (where `getInitialNotification()` resolves before the
     * NavigationContainer is mounted) still land on the correct screen.
     */
    private async waitForNavigationReady (): Promise<boolean> {
        for (let attempt = 0; attempt < NAVIGATION_READY_MAX_ATTEMPTS; attempt++) {
            const isReady = navigationRef.isReady();
            const { auth, initialized } = store.getState().app;
            if (isReady && auth && initialized) { return true; }
            await new Promise<void>(resolve => { setTimeout(resolve, NAVIGATION_READY_POLL_MS); });
        }
        return false;
    }

    /**
     * Translate a parsed deep link into an in-app navigation. Handles the two
     * shapes we currently emit from the backend:
     *  - weight reminder: `/public/app-redirect/measurements/weight`
     *  - message thread:  `/public/app-redirect/messages/thread/:id`
     *
     * Falls back to `Linking.openURL` for anything we don't know about — this
     * lets `linking` config in `RootNavigator` still pick it up if it matches
     * a configured path, and otherwise hands off to the OS as a last resort.
     */
    private async navigateFromDeepLink (deepLink: string): Promise<void> {
        const ready = await this.waitForNavigationReady();
        if (!ready) {
            this.log('Skipping deep link — navigation/auth not ready', { deepLink });
            return;
        }

        if (isWeightDeepLink(deepLink)) {
            const date = moment().format('YYYY-MM-DD');
            navigationRef.navigate(ROUTES.WEIGHT_MEASUREMENT, { date });
            return;
        }

        if (isMessageThreadDeepLink(deepLink)) {
            const threadId = getMessageThreadIdFromDeepLink(deepLink);
            const numericId = threadId ? Number(threadId) : NaN;
            if (Number.isFinite(numericId)) {
                navigationRef.navigate(ROUTES.READ_MESSAGE, { id: numericId });
                return;
            }
        }

        try {
            await Linking.openURL(deepLink);
        } catch (error) {
            this.log('Failed to open deep link', {
                error,
                deepLink,
            });
        }
    }

    private handleNotificationOpen (remoteMessage: FirebaseMessagingTypes.RemoteMessage | null): void {
        if (!remoteMessage) { return; }
        const deepLink = getNotificationDeepLink(remoteMessage);
        if (!deepLink) { return; }
        void this.navigateFromDeepLink(deepLink);
    }

    public async initialize (): Promise<void> {
        if (this.initialized) { return; }
        this.initialized = true;

        await this.createDefaultChannel();
        await this.ensureMessagingPermission();

        this.unsubscribeOnMessage = onMessage(this.messaging, async remoteMessage => {
            await this.displayForegroundNotification(remoteMessage);
        });

        this.unsubscribeOpenedApp = onNotificationOpenedApp(this.messaging, remoteMessage => {
            this.handleNotificationOpen(remoteMessage);
        });

        this.unsubscribeTokenRefresh = onTokenRefresh(this.messaging, () => {
            // NOTE intentionally a no-op for now — backend re-registration of the
            // refreshed token lives elsewhere (auth flow); keep the subscription
            // here only to avoid the listener being garbage-collected.
        });

        const initialMessage = await getInitialNotification(this.messaging);
        this.handleNotificationOpen(initialMessage);
    }

    public async getDeviceToken (): Promise<string | null> {
        try {
            const hasPermission = await this.ensureMessagingPermission();
            if (!hasPermission) { return null; }
            const token = await getToken(this.messaging);
            return token;
        } catch (error) {
            console.error('[NotificationService] Failed to get FCM token:', error);
            return null;
        }
    }

    public async deleteDeviceToken (): Promise<void> {
        try {
            await deleteToken(this.messaging);
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
    }
}

export const notificationService = new NotificationService();
export default notificationService;
