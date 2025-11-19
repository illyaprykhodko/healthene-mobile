
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

// Centralized entity and section constants
export const ENTITY_TYPE = {
    FOOD: 'FOOD',
    RECIPE: 'RECIPE',
    SUPPLEMENT: 'SUPPLEMENT',
    MEDICATION: 'MEDICATION',
    MEASUREMENT: 'MEASUREMENT',
    INGREDIENTS: 'INGREDIENTS',
    CUSTOM_RECIPE: 'CUSTOM_RECIPE',
    PHYSICAL_ACTIVITY: 'PHYSICAL_ACTIVITY',
} as const;

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

export const GENDERS = [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
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
