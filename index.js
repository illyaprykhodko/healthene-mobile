/**
 * @format
 */
// outsource dependencies
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

AppRegistry.registerComponent(appName, () => App);
