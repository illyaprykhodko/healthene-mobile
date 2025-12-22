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
    EDIT_FOOD: 'EditFood',
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
    MODIFY_INGREDIENT: 'ModifyIngredient',
    ADD_REPLACE_RECIPE: 'AddReplaceRecipe',
    TREE_ADD_REPLACE_ITEM: 'TreeAddReplaceItem',
    CUISINE_DISTRIBUTION: 'CuisineDistribution',

    // Account Settings
    ADDRESS: 'Address',
    SETTINGS: 'Settings',
    ACCOUNT_SETTINGS: 'AccountSettings',
    FOOD_PREFERENCES: 'FoodPreferences',
    BIOMETRIC_SETTINGS: 'BiometricSettings',
    PERSONAL_INFORMATION: 'PersonalInformation',

    // Messanger
    READ_MESSAGE: 'ReadMessages',
    MESSAGE_LIST: 'MessengerList',
    WRITE_MESSAGE: 'WriteMessage',
    MESSENGER_AUDIO: 'MessengerAudio',
    MESSENGER_CAMERA: 'MessengerCamera',

    // Legacy routes (for compatibility)
    HOME: 'Home',
    PROFILE: 'Profile',
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
