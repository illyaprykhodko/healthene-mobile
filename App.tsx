/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
// outsource dependencies
import React from 'react';
import { Provider } from 'react-redux';
import Toast from 'react-native-toast-message';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// local dependencies
import { store } from './src/store';
import { config } from './src/constants';
import { ThemeProvider } from './src/providers/ThemeProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { BoxHolder, MaintenanceHolder } from 'components/preloader';
import { useAppInitialization } from './src/hooks/useAppInitialization';

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
                    <BottomSheetModalProvider>
                        <ThemeProvider>
                            <AppContent />
                        </ThemeProvider>
                    </BottomSheetModalProvider>
                </GestureHandlerRootView>
            </SafeAreaProvider>
            <Toast />
        </Provider>
    );
}

export default App;
