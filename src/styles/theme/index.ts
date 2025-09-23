import { Theme } from './types';
// import { Dimensions } from 'react-native';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Utility for normalizing sizes
// export const normalize = (size: number): number => {
//   const scale = SCREEN_WIDTH / 375; // base width for iPhone
//   return Math.round(size * scale);
// };

const baseColors = {
    red: '#F55454',
    pink: '#FEB2B2',
    darkerPink: '#dc73de',
    green: '#61BD4F',
    purple: '#C376E0',
    yellow: '#FFD83D',
    orange: '#FFAB4A',
    lightGrey: '#F3F3F3',
    lighterGrey: '#DADADA',
    grey: '#B0B0B0',
    darkGrey: '#7B7B7B',
    darkerGrey: '#C4C4C4',
    white: '#FFFFFF',
    black: '#000000',
    blue: '#2978A0',
    darkBlue: '#156F93',
    brown: '#8B3030',
    transparent: 'transparent',
    cerulean300: '#7BAAC2',
};

export const lightTheme: Theme = {
    colors: {
        ...baseColors,
        primary: baseColors.darkBlue,
        secondary: '#319FCB',
        background: baseColors.white,
        surface: baseColors.white,
        text: baseColors.black,
        textSecondary: baseColors.darkGrey,
        border: baseColors.lighterGrey,
        error: baseColors.red,
        success: baseColors.green,
        warning: baseColors.orange,
        info: baseColors.blue,
        // extensions for CTA buttons
        successAlt: '#96E072',
        muted: '#EEEEEE',
        textMuted: '#888888',
        successAltText: '#4E733C',
    },
    typography: {
        fontFamily: {
            regular: 'Outfit-Regular',
            medium: 'Outfit-Medium',
            bold: 'Outfit-Bold',
        },
        fontSize: {
            xs: 12,
            sm: 14,
            md: 16,
            lg: 18,
            xl: 20,
            xxl: 24,
        },
        lineHeight: {
            tight: 1.2,
            normal: 1.5,
            relaxed: 1.8,
        },
        letterSpacing: {
            tight: 0.15,
            normal: 0.44,
            wide: 0.5,
        },
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },
    borderRadius: {
        sm: 4,
        md: 8,
        lg: 16,
        xl: 30,
    },
    dark: false,
};

export const darkTheme: Theme = {
    colors: {
        ...baseColors,
        primary: '#319FCB',
        secondary: '#7BAAC2',
        background: '#121212',
        surface: '#1E1E1E',
        text: baseColors.white,
        textSecondary: baseColors.lightGrey,
        border: '#2C2C2C',
        error: '#FF6B6B',
        success: '#4CAF50',
        warning: '#FFB74D',
        info: '#64B5F6',
        successAlt: '#96E072',
        muted: '#2A2A2A',
        textMuted: '#888888',
        successAltText: '#4E733C',
    },
    typography: lightTheme.typography,
    spacing: lightTheme.spacing,
    borderRadius: lightTheme.borderRadius,
    dark: true,
};
