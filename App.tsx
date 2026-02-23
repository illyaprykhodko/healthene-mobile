/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
// outsource dependencies
import React from 'react';
import { Provider } from 'react-redux';
import * as Sentry from '@sentry/react-native';
import Toast from 'react-native-toast-message';
import { Platform, StyleSheet } from 'react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
// local dependencies
import { store } from 'store';
import { config } from 'constants';
import { ThemeProvider } from 'providers/ThemeProvider.tsx';
import { RootNavigator } from 'navigation/RootNavigator.tsx';
import { BoxHolder, MaintenanceHolder } from 'components/preloader';
import { useAppInitialization } from 'hooks/useAppInitialization.ts';

export const navigationIntegration = Sentry.reactNavigationIntegration({
    enableTimeToInitialDisplay: true,
});

if (config.DEBUG) {
    require('./ReactotronConfig');
} else {
    Sentry.init({
        environment: config.environment,
        dsn: 'https://6eec9d361bc9f719c01f5e25e3855c34@o4510911881871360.ingest.de.sentry.io/4510911893733456',
        integrations: [navigationIntegration, Sentry.reactNativeTracingIntegration()],
        // Adds more context data to events (IP address, cookies, user, etc.)
        // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
        sendDefaultPii: true,

        // Enable Logs
        enableLogs: true,

        // Configure Session Replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1,
        tracesSampleRate: 1.0,

        // uncomment the line below to enable Spotlight (https://spotlightjs.com)
        // spotlight: __DEV__,
    });
}

function AppContent (): React.JSX.Element {
    const { isInitializing, health } = useAppInitialization();
    const insets = useSafeAreaInsets();
    const styles = createStyles(insets);
    if (isInitializing) { return <BoxHolder active />; }
    if (!health) { return <MaintenanceHolder active />; }
    return (
        <SafeAreaView style={[styles.safeArea, styles.flex]}>
            <RootNavigator />
        </SafeAreaView>
    );
}

function App (): React.JSX.Element {
    const styles = createStyles();
    return (
        <Provider store={store}>
            <SafeAreaProvider>
                <GestureHandlerRootView style={styles.flex}>
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

export default Sentry.wrap(App);

const createStyles = (insets?: EdgeInsets) => StyleSheet.create({
    flex: {
        flex: 1,
    },
    safeArea: {
        paddingTop: - (insets?.top ?? 0),
        paddingBottom: Platform.OS === 'ios' ? - (insets?.bottom ?? 0) : 0
    }
});
