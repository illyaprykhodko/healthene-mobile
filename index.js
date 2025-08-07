/**
 * @format
 */
// outsource dependencies
import { AppRegistry } from 'react-native';

// local dependencies
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
