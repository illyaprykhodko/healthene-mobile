/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
// outsource dependencies
import { Provider } from 'react-redux';
// import './ReactotronConfig';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// local dependencies
import { store } from './src/store';
import { ThemeProvider } from './src/providers/ThemeProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAppInitialization } from './src/hooks/useAppInitialization';

import { config } from './src/constants';
import { BoxHolder, MaintenanceHolder } from 'components/preloader';
if (config.DEBUG) {
    require('./ReactotronConfig');
}
function AppContent (): React.JSX.Element {
    const { isInitializing, health, healthError } = useAppInitialization();
    if (isInitializing) { return <BoxHolder active />; }
    if (!health) { return <MaintenanceHolder active />; }
    return <RootNavigator />;
}

function App (): React.JSX.Element {
    return (
        <Provider store={store}>
            <SafeAreaProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <ThemeProvider>
                        <AppContent />
                    </ThemeProvider>
                </GestureHandlerRootView>
            </SafeAreaProvider>
        </Provider>
    );
}

export default App;
