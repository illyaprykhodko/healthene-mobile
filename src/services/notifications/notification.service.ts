// outsource dependencies
import dayjs from 'services/date';
import { Platform, Linking } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import notifee, {
    EventType,
    AndroidImportance,
    AuthorizationStatus,
    type Event as NotifeeEvent,
} from '@notifee/react-native';
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
} from 'react-native-permissions';

// local dependencies
import { store } from 'store';
import { PRIVATE, ROUTES } from 'constants/routes';
import { navigationRef } from 'services/navigation';
import {
    isWeightDeepLink,
    normalizeDeepLinkPath,
    getNotificationDeepLink,
    isMessageThreadDeepLink,
    isMessagesSectionDeepLink,
    getMessageThreadIdFromDeepLink,
} from 'services/deepLink';

const DEFAULT_CHANNEL_ID = 'default-channel-id';
// NOTE max time we wait for the navigation tree + auth state to settle before
// giving up on a tapped deep link. 80 * 250ms = 20s — same upper bound as the
// v1 saga (`waitForPrivateNavigationReady`).
const NAVIGATION_READY_MAX_ATTEMPTS = 80;
const NAVIGATION_READY_POLL_MS = 250;
// NOTE iOS mints no FCM token until APNs has handed us a device token, and that
// registration finishes asynchronously after `registerDeviceForRemoteMessages`.
// 24 * 500ms = 12s: the first launch after a fresh install can take several
// seconds to register, while a denied permission never registers at all — hence
// the bound, so the caller is not stalled forever.
const APNS_TOKEN_MAX_ATTEMPTS = 24;
const APNS_TOKEN_POLL_MS = 500;

const delay = (ms: number): Promise<void> => new Promise<void>(resolve => { setTimeout(resolve, ms); });

/**
 * Navigate to a screen that lives three levels deep: `private → Drawer →
 * <drawerScreen> → <screen>`, exactly as declared in `linking.ts`.
 *
 * NOTE a flat `navigationRef.navigate(leafName)` does NOT work here. The ref
 * dispatches to the root navigator, and an unhandled action only travels down the
 * currently focused chain — while drawer screens (`Messenger`, `DailyPlan`) are
 * mounted lazily. Tapping a push from the main screen therefore left the action
 * unhandled and the app simply stayed put ("was not handled by any navigator" in
 * the dev console). Addressing the full path also mounts the intermediate
 * navigators on the way in.
 */
const navigateNested = (drawerScreen: string, screen: string, params: object = {}): void => {
    navigationRef.dispatch(CommonActions.navigate({
        name: PRIVATE,
        params: {
            screen: ROUTES.DRAWER,
            params: {
                screen: drawerScreen,
                params: {
                    screen,
                    params,
                },
            },
        },
    }));
};

class NotificationService {
    private initialized = false;

    private readonly messaging = getMessaging();

    private unsubscribeOnMessage: (() => void) | null = null;

    private unsubscribeOpenedApp: (() => void) | null = null;

    private unsubscribeTokenRefresh: (() => void) | null = null;

    private unsubscribeForegroundEvent: (() => void) | null = null;

    private apnsToken: string | null = null;

    private tokenRefreshHandler: ((token: string) => void) | null = null;

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

        // iOS notification permission via notifee, which asks UNUserNotificationCenter directly
        // (RNFB v25 deprecated messaging().requestPermission()). NOTE: the react-native-permissions
        // 'Notifications' handler MUST stay disabled in the Podfile setup_permissions — enabling it
        // conflicts with Firebase Messaging's APNs handling and breaks push delivery. With it
        // disabled requestNotifications() rejects with `notifications_handler_not_set_up` and the
        // system prompt never appears, hence notifee here. On Android the POST_NOTIFICATIONS gate
        // above is authoritative.
        if (Platform.OS !== 'ios') { return true; }

        const { authorizationStatus } = await notifee.requestPermission();
        const authorized = authorizationStatus === AuthorizationStatus.AUTHORIZED
            || authorizationStatus === AuthorizationStatus.PROVISIONAL;

        // NOTE iOS issues no APNs device token while notifications are denied, so
        // waiting for one would only burn the timeout. The status also reflects a
        // choice made later in Settings, not just the answer to the first prompt.
        if (!authorized) {
            this.log('iOS notifications not authorized — no APNS/FCM token will be issued', { authorizationStatus });
            return false;
        }

        // NOTE must complete before anyone calls `getToken()`, otherwise Firebase
        // throws "No APNS token specified before fetching FCM Token" and the device
        // never registers for push. If APNs stays silent we still report the real
        // permission result — `onTokenRefresh` picks the token up once it appears.
        const apnsToken = await this.waitForAPNSToken();
        if (!apnsToken) {
            this.log('APNS token unavailable after waiting — FCM token fetch will be skipped');
        }

        return authorized;
    }

    /**
     * Poll `getAPNSToken` until APNs registration completes, or give up after the
     * bounded timeout. Returns the token so callers can tell "ready" from "gave up".
     */
    private async waitForAPNSToken (): Promise<string | null> {
        if (this.apnsToken) { return this.apnsToken; }
        for (let attempt = 0; attempt < APNS_TOKEN_MAX_ATTEMPTS; attempt++) {
            try {
                const apnsToken = await getAPNSToken(this.messaging);
                if (apnsToken) {
                    this.apnsToken = apnsToken;
                    return apnsToken;
                }
            } catch (error) {
                this.log('getAPNSToken failed, retrying', error);
            }
            await delay(APNS_TOKEN_POLL_MS);
        }
        return null;
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
            const date = dayjs().format('YYYY-MM-DD');
            navigateNested(ROUTES.DAILY_PLAN, ROUTES.WEIGHT_MEASUREMENT, { date });
            return;
        }

        if (isMessageThreadDeepLink(deepLink)) {
            const threadId = getMessageThreadIdFromDeepLink(deepLink);
            const numericId = threadId ? Number(threadId) : NaN;
            if (Number.isFinite(numericId)) {
                navigateNested(ROUTES.MESSENGER, ROUTES.READ_MESSAGE, { id: numericId });
                return;
            }
        }

        // NOTE the backend currently sends the message link without a thread id, so
        // there is nothing to open a specific conversation with — land on the list
        // instead of handing the URL to the OS and leaving the app. Once the id is
        // included the branch above takes over on its own.
        if (isMessagesSectionDeepLink(deepLink)) {
            navigateNested(ROUTES.MESSENGER, ROUTES.MESSAGE_LIST);
            return;
        }

        // NOTE we get here only when the link matched none of the paths above, and
        // handing an https URL to the OS means leaving the app: without a served
        // `apple-app-site-association` iOS opens Safari, which bounces to the App
        // Store. So this log is the signal that the backend's path and
        // `DEEP_LINK_PATH` drifted apart — ids are masked, the shape is what matters.
        this.log('Deep link matched no known route, handing off to the OS', {
            path: normalizeDeepLinkPath(deepLink).replace(/\d+/g, ':id'),
        });

        try {
            await Linking.openURL(deepLink);
        } catch (error) {
            this.log('Failed to open deep link', { error });
        }
    }

    /**
     * Accepts anything carrying a deep link: an FCM `RemoteMessage` (delivered by
     * `onNotificationOpenedApp` / `getInitialNotification`) or a notifee
     * `Notification` (delivered by the notifee press events). `getNotificationDeepLink`
     * walks both shapes, so the two flows stay on one code path.
     */
    private handleNotificationOpen (notification: unknown): void {
        if (!notification) { return; }
        const deepLink = getNotificationDeepLink(notification);
        if (!deepLink) { return; }
        void this.navigateFromDeepLink(deepLink);
    }

    /**
     * Handle a tap on a notification that *notifee* put on screen.
     *
     * NOTE this is the only path for banners we render ourselves — and we render
     * every foreground message (`onMessage` → `displayForegroundNotification`) plus
     * every data-only background message (`handleBackgroundMessage`). Firebase's
     * `onNotificationOpenedApp` does NOT fire for those, because APNs/FCM never
     * displayed them; without this handler tapping the banner did nothing at all.
     */
    public async handleNotifeeEvent ({ type, detail }: NotifeeEvent): Promise<void> {
        if (type !== EventType.PRESS) { return; }
        this.handleNotificationOpen(detail.notification);
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

        // NOTE covers taps on notifee-rendered banners while the app is running, and
        // on iOS also the cold-start tap (notifee replays it as a foreground PRESS).
        // Background-state taps arrive through `onBackgroundEvent`, registered in
        // `index.js` because it must sit outside the React tree.
        this.unsubscribeForegroundEvent = notifee.onForegroundEvent(event => {
            void this.handleNotifeeEvent(event);
        });

        this.unsubscribeTokenRefresh = onTokenRefresh(this.messaging, token => {
            // NOTE FCM rotates the token (reinstall, restore from backup, long
            // inactivity). Without re-sending it the backend keeps pushing to a
            // dead token, so push silently stops working. The handler is set by
            // `useNotificationTokenSync`, which owns the authenticated request.
            this.tokenRefreshHandler?.(token);
        });

        const initialMessage = await getInitialNotification(this.messaging);
        this.handleNotificationOpen(initialMessage);

        // NOTE Android only: a tap that launches a killed app from a notifee banner is
        // replayed here and nowhere else. On iOS the same tap comes back as a foreground
        // PRESS event (notifee deprecates `getInitialNotification` for iOS), so calling
        // it there would only duplicate the navigation.
        if (Platform.OS === 'android') {
            const initialNotifeeNotification = await notifee.getInitialNotification();
            this.handleNotificationOpen(initialNotifeeNotification?.notification);
        }
    }

    public setTokenRefreshHandler (handler: ((token: string) => void) | null): void {
        this.tokenRefreshHandler = handler;
    }

    public async getDeviceToken (): Promise<string | null> {
        try {
            const hasPermission = await this.ensureMessagingPermission();
            if (!hasPermission) { return null; }
            // NOTE second gate for the same race: `ensureMessagingPermission` is also
            // reached from `initialize()`, so by the time a caller asks for the token
            // the APNs wait may already have run — this keeps `getToken` from throwing
            // when it gave up back then.
            if (Platform.OS === 'ios' && !(await this.waitForAPNSToken())) {
                this.log('Skipping FCM token fetch — no APNS token yet');
                return null;
            }
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
        this.apnsToken = null;
        this.tokenRefreshHandler = null;
        this.unsubscribeForegroundEvent?.();
        this.unsubscribeForegroundEvent = null;
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
