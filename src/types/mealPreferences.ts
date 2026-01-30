// Types for Meal Preferences feature

export enum MealPreferenceType {
    OTHER = 'OTHER',
    CUISINE = 'CUISINE',
    PREFERENCE = 'PREFERENCE',
}

export interface MealTemplate {
    id: number;
    displayName: string;
}

export interface MealTemplatePreference {
    id: number | null;
    mealTemplate: MealTemplate;
    relativeFrequency: number; // 1-10
}

export interface Meal {
    id: number;
    name: string;
    order: number;
    coverImage?: {
        url: string;
    };
    existInPatientPreferences?: boolean;
}

export interface MealWithPreferences extends Meal {
    preferences: MealTemplatePreference[];
}

export interface MealPreferencesState {
    selected: any;
    mealsList: Meal[];
    disabled: boolean;
    initialized: boolean;
    list: MealTemplatePreference[];
    favoriteList: MealTemplatePreference[];
    mealsWithPreferences: MealWithPreferences[];
}
