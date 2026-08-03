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
    brandTeal: '#156F93',
    brandInfo: '#2978A0',
    brandFinishBg: '#FFE58A',
    brandFinishText: '#4E733C',
    brown: '#8B3030',
    transparent: 'transparent',
    cerulean300: '#7BAAC2',
    aqua: '#8EF9F3',
};

export const lightTheme: Theme = {
    colors: {
        ...baseColors,
        primary: baseColors.darkBlue,
        secondary: '#319FCB',
        background: baseColors.white,
        surface: baseColors.white,
        surfaceAlt: '#E0EBF7',
        surfaceSecond: '#f3f3f3',
        headerBg: baseColors.darkBlue,
        headerText: baseColors.white,
        skeleton: baseColors.grey,
        aqua: baseColors.aqua,
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
        finishPillBg: baseColors.brandFinishBg,
        finishPillText: '#573B00',
        // Anytime icons
        anytimeFoodBg: '#FFE0B3',
        anytimeFoodFg: '#C56A00',
        anytimeDrinkBg: '#E3F2FD',
        anytimeDrinkFg: '#1976D2',
        anytimeSupplementBg: '#F3E5F5',
        anytimeSupplementFg: '#7B1FA2',
        anytimeMeasurementBg: '#E8F5E8',
        anytimeMeasurementFg: '#388E3C',
        anytimeActivityBg: '#FFF3E0',
        anytimeActivityFg: '#F57C00',
        // Monochrome variant for footer icons
        anytimeMonoBg: '#E5EEF5',
        anytimeMonoFg: '#5F7E91',
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
        // Deep Slate + Cyan pop — cool slate surfaces, brand cyan accents.
        primary: '#4FC3E8',
        secondary: '#7BAAC2',
        background: '#0E1417',
        surface: '#161E23',
        surfaceAlt: '#1E2A30',
        surfaceSecond: '#1E2A30',
        headerBg: '#161E23',
        headerText: '#E6EDF1',
        skeleton: '#2C3A45',
        aqua: baseColors.aqua,
        text: '#E6EDF1',
        textSecondary: '#8A98A2',
        border: '#243038',
        error: '#FF6B6B',
        success: '#5DD47B',
        warning: '#FFB74D',
        info: '#64B5F6',
        // CTA / pill extensions tuned for contrast on dark
        successAlt: '#5DD47B',
        muted: '#1E2A30',
        textMuted: '#8A98A2',
        successAltText: '#BFF2C9',
        finishPillBg: '#2E3A1C',
        finishPillText: '#D7E8B0',
        // Anytime icons — slightly deepened bg, brightened fg for dark
        anytimeFoodBg: '#3A2A12',
        anytimeFoodFg: '#F0A85A',
        anytimeDrinkBg: '#12263A',
        anytimeDrinkFg: '#5FA8E8',
        anytimeSupplementBg: '#2E1E3A',
        anytimeSupplementFg: '#C58AE0',
        anytimeMeasurementBg: '#16301C',
        anytimeMeasurementFg: '#6FC97A',
        anytimeActivityBg: '#3A2A12',
        anytimeActivityFg: '#F0A85A',
        anytimeMonoBg: '#1E2A30',
        anytimeMonoFg: '#8FB0C2',
    },
    typography: lightTheme.typography,
    spacing: lightTheme.spacing,
    borderRadius: lightTheme.borderRadius,
    dark: true,
};
