// outsource dependencies
import { useColorScheme } from 'react-native';
import React, { createContext, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// local dependencies
import { Theme } from '../styles/theme/types';
import { THEME_PREFERENCE_KEY, THEME } from '../constants';
import { lightTheme, darkTheme } from '../styles/theme/index';


type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
    isDark: false,
    theme: lightTheme,
    toggleTheme: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const colorScheme = useColorScheme(); // 'light' or 'dark' system theme
    console.log('colorScheme', colorScheme);
    // colorScheme === THEME.DARK
    const [isDark, setIsDark] = React.useState(false);

    // Load saved theme preference
    useEffect(() => {
        const loadThemePreference = async () => {
            try {
                const savedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
                if (savedPreference !== null) {
                    setIsDark(savedPreference === THEME.DARK);
                }
            } catch (error) {
                console.error('Error loading theme preference:', error);
            }
        };
        loadThemePreference();
    }, []);

    // Sync with system theme changes
    useEffect(() => {
        const savedPreference = AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (savedPreference === null) {
            setIsDark(colorScheme === THEME.DARK);
        }
    }, [colorScheme]);

    const toggleTheme = async () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        try {
            await AsyncStorage.setItem(THEME_PREFERENCE_KEY, newTheme ? THEME.DARK : THEME.LIGHT);
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    };

    const theme = isDark ? darkTheme : lightTheme;
    console.log('isDark', isDark);
    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
