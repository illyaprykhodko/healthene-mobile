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
import { StatusBar, StyleSheet } from 'react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
// local dependencies
import { store } from './src/store';
import { config } from './src/constants';
import { useTheme } from 'hooks/useTheme';
import { ThemeProvider } from './src/providers/ThemeProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { BoxHolder, MaintenanceHolder } from 'components/preloader';
import { useAppInitialization } from './src/hooks/useAppInitialization';

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
    const theme = useTheme();
    const styles = createStyles();
    return (
        <Provider store={store}>
            <SafeAreaProvider>
                <GestureHandlerRootView style={styles.flex}>
                    <BottomSheetModalProvider>
                        <ThemeProvider>
                            <StatusBar
                                animated={false}
                                barStyle="light-content"
                                backgroundColor={theme.colors.primary}
                            />
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
    }
});
