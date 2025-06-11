/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
// outsource dependencies
import { Provider } from 'react-redux';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// local dependencies
import { SplashScreen } from './src/components/SplashScreen';
import { ThemeProvider } from './src/providers/ThemeProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { store, initApp, checkAppHealth, restoreAppSession, useAppDispatch } from './src/store';

function AppContent(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize app
    dispatch(initApp());
    dispatch(checkAppHealth());
    dispatch(restoreAppSession());
    setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  }, [dispatch]);

  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return <RootNavigator />;
}

function App(): React.JSX.Element {
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
