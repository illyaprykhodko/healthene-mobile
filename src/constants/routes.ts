export const ROUTES = {
    // Public routes
    SIGN_IN: 'SignIn',
    SIGN_UP: 'SignUp',
    FORGOT_PASSWORD: 'ForgotPassword',
    TERMS_AND_CONDITIONS: 'TermsAndConditions',

    // Private routes - Drawer Navigator
    MAIN: 'Main',
    EDIT: 'Edit',
    INFO: 'Info',
    LIBRARY: 'Library',
    SHOPPING: 'Shopping',
    MESSENGER: 'Messenger',
    DAILY_PLAN: 'DailyPlan',
    MY_RESULTS: 'MyResults',
    ABOUT_PLAN: 'AboutPlan',
    SMART_SCALE: 'SmartScale',
    REPLACEMENT: 'Replacement',
    DAY_OVERVIEW: 'DayOverview',
    REPLACE_ITEMS: 'ReplaceItems',
    FOOD_ALLERGIES: 'FoodAllergies',
    HEALTH_PROFILE: 'HealthProfile',
    ADD_REPLACE_ITEM: 'AddReplaceItem',
    MEAL_PREFERENCES: 'MealPreferences',
    ALL_RECORDED_DATA: 'AllRecordedData',
    MEASUREMENT_CHART: 'MeasurementChart',
    ADD_REPLACE_RECIPE: 'AddReplaceRecipe',
    TREE_ADD_REPLACE_ITEM: 'TreeAddReplaceItem',
    CUISINE_DISTRIBUTION: 'CuisineDistribution',

    // Account Settings
    ADDRESS: 'Address',
    ACCOUNT_SETTINGS: 'AccountSettings',
    BIOMETRIC_SETTINGS: 'BiometricSettings',
    FOOD_PREFERENCES: 'FoodPreferences',
    PERSONAL_INFORMATION: 'PersonalInformation',

    // Messanger
    MESSAGE_LIST: 'MessengerList',
    DOCUMENTS_VIEWER: 'DocumentsViewerScreen',
    READ_MESSAGE_SCREEN: 'ReadMessagesScreen',
    WRITE_MESSAGE_SCREEN: 'WriteMessageScreen',

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
    ROUTES.MESSENGER,
    ROUTES.DAILY_PLAN,
    ROUTES.MY_RESULTS,
    ROUTES.ABOUT_PLAN,
    ROUTES.HEALTH_PROFILE,
    ROUTES.MEAL_PREFERENCES,
    ROUTES.CUISINE_DISTRIBUTION,
] as const;
