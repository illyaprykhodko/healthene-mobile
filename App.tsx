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

if (config.DEBUG) {
    require('./ReactotronConfig');
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

export default App;

const createStyles = (insets?: EdgeInsets) => StyleSheet.create({
    flex: {
        flex: 1,
    },
    safeArea: {
        paddingTop: - (insets?.top ?? 0),
        paddingBottom: Platform.OS === 'ios' ? - (insets?.bottom ?? 0) : 0
    }
});
