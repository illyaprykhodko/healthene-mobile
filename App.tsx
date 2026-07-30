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
import { toastConfig } from 'components/Toast';
import { Platform, StyleSheet } from 'react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
// local dependencies
import { config } from 'constants';
import { useTheme } from 'hooks/useTheme';
import { store, useAppDispatch } from 'store';
import { useAppUpdateGate } from 'hooks/useAppUpdateGate';
import { setBirdSoundEnabled } from 'store/slices/appSlice';
import { ThemeProvider } from 'providers/ThemeProvider.tsx';
import { RootNavigator } from 'navigation/RootNavigator.tsx';
import { SoftUpdateModal } from 'components/update/SoftUpdateModal';
import { BoxHolder, MaintenanceHolder } from 'components/preloader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppInitialization } from 'hooks/useAppInitialization.ts';
// import { FeedbackProvider } from 'features/feedback';
import { WalkingSessionRunner } from 'components/WalkingSessionRunner';
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

const BIRD_SOUND_KEY = '@birdSoundEnabled';

function AppContent (): React.JSX.Element {
    const dispatch = useAppDispatch();
    // Gate on `isInitializing` (first-mount bootstrap), not `isHealthLoading`.
    // The latter flips back to `true` whenever the underlying RTK Query cache
    // is reset (e.g. logout via resetStore), which would re-show the splash
    // and trap the user on a white screen with a spinner.
    // const { isHealthLoading } = useAppInitialization();

    useEffect(() => {
        AsyncStorage.getItem(BIRD_SOUND_KEY).then(value => {
            if (value !== null) {
                dispatch(setBirdSoundEnabled(value === 'true'));
            }
        });
    }, [dispatch]);
    // const { isInitializing, isHealthy, isHealthLoading } = useAppInitialization();
    const { isInitializing, isHealthy } = useAppInitialization();
    
    const {
        softPolicy,
        openStore,
        forcePolicy,
        onSoftCancel,
        isSoftVisible,
    } = useAppUpdateGate();
    const theme = useTheme();
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
    // if (isHealthLoading) { return <BoxHolder active />; }
    if (isInitializing) { return <BoxHolder active />; }
    // Only an explicit `false` means "backend is down". `null` means "not known yet" — treating
    // it as maintenance used to trap the user on the maintenance screen right after logout,
    // since `resetStore` puts the health flag back to its initial value.
    if (isHealthy === false) { return <MaintenanceHolder active />; }
    if (forcePolicy) { return <ForceUpdateScreen policy={forcePolicy} onUpdate={openStore} />; }
    return (
        <SafeAreaView style={[styles.safeArea, styles.flex, { backgroundColor: theme.colors.background }]}>
            {/* <FeedbackProvider> */}
            <WalkingSessionRunner />
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
                    <KeyboardProvider>
                        <BottomSheetModalProvider>
                            <ThemeProvider>
                                <AppContent />
                            </ThemeProvider>
                        </BottomSheetModalProvider>
                    </KeyboardProvider>
                </GestureHandlerRootView>
            </SafeAreaProvider>
            {/* NOTE `config` carries the `warning` type MessageService.toastWarning emits — without
                it react-native-toast-message throws "Toast type: 'warning' does not exist" and
                red-screens instead of showing the message. */}
            <Toast config={toastConfig} />
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
