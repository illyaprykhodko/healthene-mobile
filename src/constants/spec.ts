
export const OVERVIEW_TYPE = {
    MEAL: 'MEAL',
    ANYTIME: 'ANYTIME',
    QUESTION: 'QUESTION',
    MEDICATION: 'MEDICATION',
    SUPPLEMENT: 'SUPPLEMENT',
    MEASUREMENT: 'MEASUREMENT',
    ADDED_BY_PATIENT: 'ADDED_BY_PATIENT',
    PHYSICAL_ACTIVITY: 'PHYSICAL_ACTIVITY',
} as const;

export type OverviewType = typeof OVERVIEW_TYPE[keyof typeof OVERVIEW_TYPE];

export const PHASE_ITEM_STATUS = {
    DID_NOT_EAT: 'DID_NOT_EAT',
    INCOMPLETE: 'INCOMPLETE',
    PENDING: 'PENDING',
    DONE: 'DONE',
} as const;

export type PhaseItemStatus = typeof PHASE_ITEM_STATUS[keyof typeof PHASE_ITEM_STATUS];


export const ENTITY_TYPE = {
    PHYSICAL_ACTIVITY: 'PHYSICAL_ACTIVITY',
    GROUP_INGREDIENTS: 'GROUP_INGREDIENTS',
    MEDICAL_PROBLEMS: 'MEDICAL_PROBLEMS',
    RECIPE_TEMPLATE: 'RECIPE_TEMPLATE',
    RECIPE_CATALOG: 'RECIPE_CATALOG',
    TAXONOMY_NODE: 'TAXONOMY_NODE',
    TAXONOMY_TREE: 'TAXONOMY_TREE',
    TAXONOMY_ITEM: 'TAXONOMY_ITEM',
    CUSTOM_RECIPE: 'CUSTOM_RECIPE',
    INGREDIENTS: 'INGREDIENTS',
    MEASUREMENT: 'MEASUREMENT',
    RECIPE_FOOD: 'RECIPE_FOOD',
    RECIPE_MEAL: 'RECIPE_MEAL',
    SUPPLEMENT: 'SUPPLEMENT',
    MEDICATION: 'MEDICATION',
    FLAVONOIDS: 'FLAVONOIDS',
    ALLERGIES: 'ALLERGIES',
    USER_ROLE: 'USER_ROLE',
    RECIPE: 'RECIPE',
    DRINK: 'DRINK',
    FOOD: 'FOOD',
    USER: 'USER',
    TAG: 'TAG',
} as const;

// export const ENTITY_TYPE = {
//     FOOD: 'FOOD',
//     DRINK: 'DRINK',
//     RECIPE: 'RECIPE',
//     ATTACHMENT: 'ATTACHMENT',
//     SUPPLEMENT: 'SUPPLEMENT',
//     MEDICATION: 'MEDICATION',
//     MEASUREMENT: 'MEASUREMENT',
//     INGREDIENTS: 'INGREDIENTS',
//     CUSTOM_RECIPE: 'CUSTOM_RECIPE',
//     EXERCISE_AEROBIC: 'EXERCISE_AEROBIC',
//     PHYSICAL_ACTIVITY: 'PHYSICAL_ACTIVITY',
// } as const;
//   EXERCISE_RESISTANCE, EXERCISE_STRETCHING,
// FOOD, ITEMS_CATEGORY, MEASUREMENT, MEDICATION, PHYSICAL_ACTIVITY, QUESTION, RECIPE, RECIPE_TEMPLATE, RESPONSE, SUPPLEMENT, TEXT
export type EntityType = typeof ENTITY_TYPE[keyof typeof ENTITY_TYPE];

export const SECTION = {
    ADDED_BY_HEALTHENE: 'Added by HealtheNe',
    ADDED_BY_PATIENT: 'Added by Patient',
} as const;

export type SectionType = typeof SECTION[keyof typeof SECTION];

// Catalog/search constants (used by AddReplaceItem)
export const CATALOG_TAG_TYPE = {
    RESTAURANT: 'RESTAURANT',
    PATIENT_FOOD: 'PATIENT_FOOD',
    PATIENT_RECIPES: 'PATIENT_RECIPES',
} as const;

export type CatalogTagType = typeof CATALOG_TAG_TYPE[keyof typeof CATALOG_TAG_TYPE];

export const SEARCH_TYPE = {
    TREE: 'TREE',
    ITEM: 'ITEM',
} as const;

export type SearchType = typeof SEARCH_TYPE[keyof typeof SEARCH_TYPE];

export const SUBSTANCE_TYPE = {
    FOOD: 'FOOD',
    DRINK: 'DRINK',
} as const;

export type SubstanceType = typeof SUBSTANCE_TYPE[keyof typeof SUBSTANCE_TYPE];

export const REPLACEMENT_TYPE = {
    RECIPE: 'RECIPE',
    INGREDIENT: 'INGREDIENT',
    SURROGATE_RECIPE: 'SURROGATE_RECIPE',
} as const;

export type ReplacementType = typeof REPLACEMENT_TYPE[keyof typeof REPLACEMENT_TYPE];

export const TAG_TYPE = {
    MEAL: 'MEAL',
    RESTAURANT: 'RESTAURANT',
    PATIENT_FOOD: 'PATIENT_FOOD',
    PATIENT_DRINK: 'PATIENT_DRINK',
    PATIENT_RECIPES: 'PATIENT_RECIPES',
} as const;

export type TagType = typeof TAG_TYPE[keyof typeof TAG_TYPE];

export const CONTENT_TYPE = {
    FROZEN: 'FROZEN',
    ANOTHER: 'ANOTHER',
    RESTAURANT: 'RESTAURANT',
} as const;

export type ContentType = typeof CONTENT_TYPE[keyof typeof CONTENT_TYPE];

export const GENDERS_TYPE = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
};
export const GENDERS = [
    { label: 'Male', value: GENDERS_TYPE.MALE },
    { label: 'Female', value: GENDERS_TYPE.FEMALE },
];

export const PREFERRED_GENDER = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    TRANSGENDER: 'TRANSGENDER',
    OTHER: 'OTHER',
};

export const PREFERRED_GENDER_OPTIONS = [
    { label: 'Male', value: PREFERRED_GENDER.MALE },
    { label: 'Female', value: PREFERRED_GENDER.FEMALE },
    { label: 'Transgender', value: PREFERRED_GENDER.TRANSGENDER },
    { label: 'Other', value: PREFERRED_GENDER.OTHER },
];

export const PREFIXES = [
    { label: 'Mr', value: 'Mr' },
    { label: 'Mrs', value: 'Mrs' },
    { label: 'Ms', value: 'Ms' },
];

export const SUFFIXES = [
    { label: 'Jr.', value: 'Jr.' },
    { label: 'Sr.', value: 'Sr.' },
    { label: '2nd', value: '2nd' },
    { label: 'C3rd', value: 'C3rd' },
    { label: 'II', value: 'II' },
    { label: 'III', value: 'III' },
    { label: 'IV', value: 'IV' },
    { label: 'V', value: 'V' },
    { label: 'VI', value: 'VI' },
];

export const ATTACHMENT_STATUS = {
    ERROR: 'ERROR',
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
} as const;

export type AttachmentStatus = typeof ATTACHMENT_STATUS[keyof typeof ATTACHMENT_STATUS];
export const TREE_TYPE = {
    ALLERGY: 'ALLERGY',
    DISLIKE: 'DISLIKE',
    NAVIGATION: 'NAVIGATION',
    PATIENT_NAVIGATION: 'PATIENT_NAVIGATION'
} as const;

export const CATEGORY_STATUS = {
    INCLUDE: 'INCLUDE',
    EXCLUDE: 'EXCLUDE',
    I_LOVE_IT: 'I_LOVE_IT'
} as const;

// Shopping List constants
export const SHOPPING_STEP = {
    MEAL: 1,        // Preferences - People eating per meal
    MAIN: 2,        // Main shopping list view
    STOCK: 3,       // Stock list check
    CHECK: 4,       // Final review
    STORE: 5,       // Choose grocery store
    CONFIRMED: 6,   // Order confirmed
} as const;

export type ShoppingStep = typeof SHOPPING_STEP[keyof typeof SHOPPING_STEP];

export const SHOPPING_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    SHOP_ON_MY_OWN: 'SHOP_ON_MY_OWN',
} as const;

export type ShoppingStatus = typeof SHOPPING_STATUS[keyof typeof SHOPPING_STATUS];

export const SHOPPING_CONFIRMED_ITEM_TYPE = {
    NONE: 'NONE',
    ALL: 'ALL',
    RESCUE: 'RESCUE',
    ORIGINAL: 'ORIGINAL',
} as const;

export type ShoppingConfirmedItemType = typeof SHOPPING_CONFIRMED_ITEM_TYPE[keyof typeof SHOPPING_CONFIRMED_ITEM_TYPE];

export const SHOPPING_ITEM_TYPE = {
    RESCUE: 'RESCUE',
    ORIGINAL: 'ORIGINAL',
} as const;

export type ShoppingItemType = typeof SHOPPING_ITEM_TYPE[keyof typeof SHOPPING_ITEM_TYPE];

export const SHOPPING_LIST_TAB = {
    ORIGINAL: 'My List',
    RESCUE: 'Rescue Foods',
} as const;

export type ShoppingListTab = typeof SHOPPING_LIST_TAB[keyof typeof SHOPPING_LIST_TAB];

export const ORIENTATION = {
    PORTRAIT: 'PORTRAIT',
    LANDSCAPE: 'LANDSCAPE',
} as const;

export type Orientation = typeof ORIENTATION[keyof typeof ORIENTATION];
