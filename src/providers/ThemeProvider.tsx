// outsource dependencies
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
// local dependencies
import { Theme } from '../styles/theme/types';
import { THEME_PREFERENCE_KEY, THEME } from '../constants';
import { lightTheme, darkTheme } from '../styles/theme/index';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextType = {
    theme: Theme;
    isDark: boolean;
    themeMode: ThemeMode;
    toggleTheme: () => void;
    setThemeMode: (mode: ThemeMode) => void;
    /** Back-compat: cycles light <-> dark. */
};

const ThemeContext = createContext<ThemeContextType>({
    isDark: false,
    theme: lightTheme,
    themeMode: 'system',
    toggleTheme: () => {},
    setThemeMode: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const colorScheme = useColorScheme(); // system 'light' | 'dark'
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

    // Load saved preference once.
    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
                if (saved === THEME.DARK || saved === THEME.LIGHT || saved === THEME.SYSTEM) {
                    setThemeModeState(saved);
                }
            } catch (error) {
                console.error('Error loading theme preference:', error);
            }
        })();
    }, []);

    const setThemeMode = useCallback((mode: ThemeMode) => {
        setThemeModeState(mode);
        AsyncStorage.setItem(THEME_PREFERENCE_KEY, mode).catch(error =>
            console.error('Error saving theme preference:', error));
    }, []);

    // 'system' follows the OS; otherwise honor the explicit choice.
    const isDark = themeMode === 'system' ? colorScheme === 'dark' : themeMode === 'dark';

    const toggleTheme = useCallback(() => {
        setThemeMode(isDark ? 'light' : 'dark');
    }, [isDark, setThemeMode]);

    const value = useMemo<ThemeContextType>(() => ({
        isDark,
        themeMode,
        toggleTheme,
        setThemeMode,
        theme: isDark ? darkTheme : lightTheme,
    }), [isDark, themeMode, setThemeMode, toggleTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
