/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
// outsource dependencies
import { Provider } from 'react-redux';
import React, { useEffect } from 'react';
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
// import { FeedbackProvider } from 'features/feedback';
import { useAppUpdateGate } from 'hooks/useAppUpdateGate';
import { SoftUpdateModal } from 'components/update/SoftUpdateModal';
import { ForceUpdateScreen } from 'components/update/ForceUpdateScreen';
import notificationService from 'services/notifications/notification.service';

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
    const { isHealthLoading } = useAppInitialization();
    // const { isInitializing, isHealthy, isHealthLoading } = useAppInitialization();
    const {
        softPolicy,
        openStore,
        forcePolicy,
        onSoftCancel,
        isSoftVisible,
    } = useAppUpdateGate();
    const insets = useSafeAreaInsets();
    const styles = createStyles(insets);

    // NOTE Boot the FCM/notifee pipeline once the app shell mounts. The service
    // is idempotent (`initialized` guard) and waits for `navigationRef.isReady()`
    // + auth state inside before consuming any tapped deep link, so it's safe
    // to call before the navigator is rendered.
    useEffect(() => {
        void notificationService.initialize();
        return () => {
            notificationService.cleanup();
        };
    }, []);
    // if (isInitializing) { return <BoxHolder active />; }
    if (isHealthLoading) { return <BoxHolder active />; }
    // if (!isHealthy) { return <MaintenanceHolder active />; }
    if (forcePolicy) { return <ForceUpdateScreen policy={forcePolicy} onUpdate={openStore} />; }
    return (
        <SafeAreaView style={[styles.safeArea, styles.flex]}>
            {/* <FeedbackProvider> */}
            <RootNavigator />
            <SoftUpdateModal
                policy={softPolicy}
                onUpdate={openStore}
                visible={isSoftVisible}
                onCancel={onSoftCancel}
            />
            {/* </FeedbackProvider> */}
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
