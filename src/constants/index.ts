// outsource dependencies
import env from 'react-native-config';
import { Platform } from 'react-native';
// API Configuration
// export const config = {
//   DEBUG: __DEV__,
//   serviceUrl: 'YOUR_API_URL', // TODO: Move to .env
//   apiPath: 'api/v1',
//   platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
// };

export const config = {
    apiPath: env.API_PATH,
    landingUrl: env.LANDING_URL,
    websiteUrl: env.WEBSITE_URL,
    serviceUrl: env.SERVICE_URL,
    environment: env.ENVIRONMENT,
    // senderFirebaseId: env.SENDER_FIREBASE_ID,
    // googleFitDataUrl: env.GOOGLE_FIT_DATA_URL,
    DEBUG: env.APP_DEBUG === String(true),
    // platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID'
};

// Navigation Routes
export const ROUTES = {
    PUBLIC: 'Public',
    PRIVATE: 'Private',
    SIGN_IN: 'SignIn',
    SIGN_UP: 'SignUp',
    FORGOT_PASSWORD: 'ForgotPassword',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error occurred. Please check your connection.',
    UNAUTHORIZED: 'Your session has expired. Please sign in again.',
    UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
} as const;

// Theme Preferences
export const THEME = {
    DARK: 'dark',
    LIGHT: 'light',
} as const;

export const THEME_PREFERENCE_KEY = 'theme_preference';
