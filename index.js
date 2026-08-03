/**
 * @format
 */
// outsource dependencies
import notifee from '@notifee/react-native';
import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

// local dependencies
import App from './App';
import { name as appName } from './app.json';
import notificationService from './src/services/notifications/notification.service';

// NOTE Background/quit-state FCM messages are delivered outside the React tree
// — the handler MUST live in `index.js` (registered before AppRegistry) to
// silence the "No background message handler" RNFirebase warning and to make
// sure Android still shows a heads-up notification when the app is killed.
setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
    await notificationService.handleBackgroundMessage(remoteMessage);
});

// NOTE Taps on notifee-rendered banners while the app sits in the background are
// delivered here — `onNotificationOpenedApp` never fires for them, since APNs/FCM
// did not display those notifications. Like the handler above, this MUST be
// registered outside the React tree. Foreground taps go through `onForegroundEvent`
// inside `notificationService.initialize()`.
notifee.onBackgroundEvent(async event => {
    await notificationService.handleNotifeeEvent(event);
});

AppRegistry.registerComponent(appName, () => App);
