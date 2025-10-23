export const ROUTES = {
    // Public routes
    SIGN_IN: 'SignIn',
    SIGN_UP: 'SignUp',
    FORGOT_PASSWORD: 'ForgotPassword',
    TERMS_AND_CONDITIONS: 'TermsAndConditions',

    // Private routes - Drawer Navigator
    MAIN: 'Main',
    INFO: 'Info',
    LIBRARY: 'Library',
    SHOPPING: 'Shopping',
    DAILY_PLAN: 'DailyPlan',
    MY_RESULTS: 'MyResults',
    ABOUT_PLAN: 'AboutPlan',
    COMMUNICATION: 'Communication',
    HEALTH_PROFILE: 'HealthProfile',
    MEAL_PREFERENCES: 'MealPreferences',
    CUISINE_DISTRIBUTION: 'CuisineDistribution',

    // Legacy routes (for compatibility)
    HOME: 'Home',
    PROFILE: 'Profile',
    SETTINGS: 'Settings',
} as const;
export const PUBLIC = 'public';
export const PRIVATE = 'private';
export type Route = typeof ROUTES[keyof typeof ROUTES];

// Route groups
export const PUBLIC_ROUTES = [ROUTES.SIGN_IN, ROUTES.SIGN_UP, ROUTES.FORGOT_PASSWORD] as const;
export const PRIVATE_ROUTES = [
    ROUTES.MAIN,
    ROUTES.INFO,
    ROUTES.LIBRARY,
    ROUTES.SHOPPING,
    ROUTES.DAILY_PLAN,
    ROUTES.MY_RESULTS,
    ROUTES.ABOUT_PLAN,
    ROUTES.COMMUNICATION,
    ROUTES.HEALTH_PROFILE,
    ROUTES.MEAL_PREFERENCES,
    ROUTES.CUISINE_DISTRIBUTION,
] as const;
