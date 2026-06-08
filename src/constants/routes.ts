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
    UPC_SCAN: 'UPCScan',
    SHOPPING: 'Shopping',
    EDIT_FOOD: 'EditFood',
    MESSENGER: 'Messenger',
    DAILY_PLAN: 'DailyPlan',
    MY_RESULTS: 'MyResults',
    ABOUT_PLAN: 'AboutPlan',
    SMART_SCALE: 'SmartScale',
    REPLACEMENT: 'Replacement',
    DAY_OVERVIEW: 'DayOverview',
    GAMBLING_HOME: 'GamblingHome',
    GAMBLING_BANK: 'GamblingBank',
    PROFILE_STATS: 'ProfileStats',
    REPLACE_ITEMS: 'ReplaceItems',
    FOOD_ALLERGIES: 'FoodAllergies',
    GAMBLING_GAMES: 'GamblingGames',
    HEALTH_PROFILE: 'HealthProfile',
    ADD_REPLACE_ITEM: 'AddReplaceItem',
    MEAL_PREFERENCES: 'MealPreferences',
    ALL_RECORDED_DATA: 'AllRecordedData',
    GAMBLING_CASH_OUT: 'GamblingCashOut',
    MEASUREMENT_CHART: 'MeasurementChart',
    MODIFY_INGREDIENT: 'ModifyIngredient',
    ADD_REPLACE_RECIPE: 'AddReplaceRecipe',
    WEIGHT_MEASUREMENT: 'WeightMeasurement',
    HEALTH_PROFILE_STACK: 'HealthProfileStack',
    TREE_ADD_REPLACE_ITEM: 'TreeAddReplaceItem',
    CUISINE_DISTRIBUTION: 'CuisineDistribution',
    GAMBLING_SLOT_MACHINE: 'GamblingSlotMachine',
    MEAL_PREFERENCES_LIST: 'MealPreferencesList',
    GAMBLING_GIFT_CARD_LIST: 'GamblingGiftCardList',
    GAMBLING_GIFT_CARD_ORDERS: 'GamblingGiftCardOrders',
    CUISINE_DISTRIBUTION_LIST: 'CuisineDistributionList',
    GAMBLING_GIFT_CARD_SUCCESS: 'GamblingGiftCardSuccess',
    MEAL_PREFERENCES_MEALS_LIST: 'MealPreferencesMealsList',
    CUISINE_DISTRIBUTION_FAVORITES: 'CuisineDistributionFavorites',
    GAMBLING_GIFT_CARD_CONFIRMATION: 'GamblingGiftCardConfirmation',
    GAMBLING_GIFT_CARD_DENOMINATIONS: 'GamblingGiftCardDenominations',
    // Questions
    QUESTION: 'Question',
    QUESTION_LIST: 'QuestionList',
    QUESTION_CATEGORY: 'QuestionCategory',

    // Video Library
    VIDEO: 'Video',
    VIDEO_LIST: 'VideoList',
    VIDEO_LIBRARY: 'VideoLibrary',
    VIDEO_CATEGORY: 'VideoCategory',
    ROOT_VIDEO_LIBRARY: 'RootVideoLibrary',

    // Health Profile
    HEALTH_PROFILE_MAIN: 'HealthProfileMain',
    HEALTH_PROFILE_STATS: 'HealthProfileStats',
    HEALTH_PROFILE_MEDICATIONS: 'HealthProfileMedications',
    HEALTH_PROFILE_MEDICAL_PROBLEMS: 'HealthProfileMedicalProblems',
    HEALTH_PROFILE_MEDICATION_ALLERGIES: 'HealthProfileMedicationAllergies',

    // Account Settings
    ADDRESS: 'Address',
    SETTINGS: 'Settings',
    NOTIFICATIONS: 'Notifications',
    SETTINGS_STACK: 'SettingsStack',
    CHANGE_PASSWORD: 'ChangePassword',
    ACCOUNT_SETTINGS: 'AccountSettings',
    FOOD_PREFERENCES: 'FoodPreferences',
    BIOMETRIC_SETTINGS: 'BiometricSettings',
    ANIMATION_SETTINGS: 'AnimationSettings',
    APPEARANCE_SETTINGS: 'AppearanceSettings',
    PERSONAL_INFORMATION: 'PersonalInformation',

    // Messenger
    READ_MESSAGE: 'ReadMessages',
    MESSAGE_LIST: 'MessengerList',
    WRITE_MESSAGE: 'WriteMessage',
    MESSENGER_AUDIO: 'MessengerAudio',
    MESSENGER_CAMERA: 'MessengerCamera',
    SELECT_RECIPIENT: 'SelectRecipient',

    // Shopping routes
    STOCK_LIST: 'StockList',
    SHOPPING_PDF: 'ShoppingPDF',
    SHOPPING_LIST: 'ShoppingList',
    CHOOSE_ADDRESS: 'ChooseAddress',
    CONFIRM_SHOPPING: 'ConfirmShopping',
    CHOOSE_GROCERY_STORE: 'ChooseGroceryStore',
    SHOPPING_PREFERENCES: 'ShoppingPreferences',

    // Legacy routes (for compatibility)
    HOME: 'Home',
    PROFILE: 'Profile',
} as const;
export const PUBLIC = 'public' as const;
export const PRIVATE = 'private' as const;
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
    ROUTES.MEAL_PREFERENCES,
    ROUTES.HEALTH_PROFILE_STACK,
    ROUTES.CUISINE_DISTRIBUTION,
] as const;
