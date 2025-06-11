import { Theme } from '../styles/theme/types';
import { useThemeContext } from '../providers/ThemeProvider';


export const useTheme = (): Theme => {
    const { theme } = useThemeContext();
    return theme;
};
/* example */
// Access to theme
// const theme = useTheme();
// Using colors
//<View style={{ backgroundColor: theme.colors.background }}>
// Using spacing
// <View style={{ padding: theme.spacing.md }}>
// Using typography
// <Text style={{ fontFamily: theme.typography.fontFamily.regular }}>

// additional opportunity
// get theme state: const { isDark } = useThemeContext()
// toggle theme: const { toggleTheme } = useThemeContext()
