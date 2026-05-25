// outsource dependencies
import env from 'react-native-config';
// API Configuration
// export const config = {
//   DEBUG: __DEV__,
//   serviceUrl: 'YOUR_API_URL', // TODO: Move to .env
//   apiPath: 'api/v1',
//   platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
// };

export const config = {
    apiPath: env.API_PATH,
    gameSlots: env.GAME_SLOTS,
    landingUrl: env.LANDING_URL,
    websiteUrl: env.WEBSITE_URL,
    serviceUrl: env.SERVICE_URL,
    environment: env.ENVIRONMENT,
    updatePolicyMockEnabled: env.UPDATE_POLICY_MOCK_ENABLED !== 'false',
    softUpdateCooldownHours: Number(env.SOFT_UPDATE_COOLDOWN_HOURS || 24),
    softUpdateShowOnLaunch: env.SOFT_UPDATE_SHOW_ON_LAUNCH !== 'false',
    // softUpdateShowOnLaunch: env.SOFT_UPDATE_SHOW_ON_LAUNCH !== 'false',
    iosStoreUrl: env.IOS_STORE_URL || 'https://apps.apple.com/app/id0000000000',
    androidStoreUrl: env.ANDROID_STORE_URL || 'https://play.google.com/store/apps/details?id=com.example.app',
    // senderFirebaseId: env.SENDER_FIREBASE_ID,
    // googleFitDataUrl: env.GOOGLE_FIT_DATA_URL,
    DEBUG: env.APP_DEBUG === String(true),
    // platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID'
    // Compile-time feature flags driven by `.env*` files (see `react-native-config`).
    // Toggle per scheme: local build keeps experiments on, customer-facing schemes ship them off.
    // Remote (runtime) toggling is intentionally NOT wired up yet — defer to a Firebase Remote
    // Config layer when we actually need kill-switches without rebuild.
    features: {
        gamblingEnabled: env.FEATURE_GAMBLING_ENABLED === String(true),
        birdAnimationEnabled: env.FEATURE_BIRD_ANIMATION_ENABLED === String(true),
    },
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

export const MEDICAL_TERM_TYPES = [
    'MEDICATION_ALLERGY',
    'MEDICAL_PROBLEMS',
    'SURGICAL_PROBLEMS',
] as const;
