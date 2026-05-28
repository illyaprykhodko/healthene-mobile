// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from './baseApi';
import {
    Meal,
    MealPreferenceType,
    MealTemplatePreference,
} from 'types/mealPreferences';

export const mealPreferencesApi = createApi({
    reducerPath: 'mealPreferencesApi',
    baseQuery,
    tagTypes: ['Meals', 'MealPreferences', 'MealTemplates'],
    endpoints: builder => ({
        // Get list of meals (Breakfast, Lunch, Dinner, etc.)
        getMeals: builder.query<Meal[], MealPreferenceType>({
            query: type => ({
                method: 'GET',
                params: { type },
                url: '/patient-service/patients/me/meal',
            }),
            providesTags: ['Meals'],
        }),

        // Get selected preferences for a specific meal
        getMealPreferences: builder.query<MealTemplatePreference[], {
            type: MealPreferenceType;
            meal: string;
        }>({
            query: ({ type, meal }) => ({
                method: 'GET',
                params: { type, meal },
                url: '/patient-service/patient/me/meal-template-preference',
            }),
            providesTags: (result, error, { meal }) => [
                { type: 'MealPreferences', id: meal },
            ],
        }),

        // Get available new templates for a specific meal
        getNewMealTemplates: builder.query<MealTemplatePreference[], {
            type: MealPreferenceType;
            meal: string;
        }>({
            query: ({ type, meal }) => ({
                method: 'GET',
                params: { type, meal },
                url: '/patient-service/patient/me/meal-template-preference/new',
            }),
            providesTags: ['MealTemplates'],
        }),

        // Create/update meal preferences
        saveMealPreferences: builder.mutation<MealTemplatePreference[], MealTemplatePreference[]>({
            query: data => ({
                body: data,
                method: 'POST',
                url: '/patient-service/patient/me/meal-template-preference',
            }),
            invalidatesTags: ['MealPreferences', 'Meals'],
        }),

        // Update frequency for existing preferences
        updateMealPreferencesFrequency: builder.mutation<void, MealTemplatePreference[]>({
            query: data => ({
                body: data,
                method: 'PUT',
                url: '/patient-service/patient/me/meal-template-preference',
            }),
            invalidatesTags: ['MealPreferences'],
        }),

        // Delete all preferences for a specific meal
        deleteMealPreferences: builder.mutation<void, {
            type: MealPreferenceType;
            meal: string;
        }>({
            query: ({ type, meal }) => ({
                method: 'DELETE',
                params: { type, meal },
                url: '/patient-service/patient/me/meal-template-preference',
            }),
            invalidatesTags: ['MealPreferences', 'Meals'],
        }),

        // Reset preferences for a specific meal back to default templates
        resetMealPreferencesToDefault: builder.mutation<void, { mealId: number }>({
            query: ({ mealId }) => ({
                method: 'POST',
                url: `/patient-service/patient/me/meals/${mealId}/meal-template-preferences/default`,
            }),
            invalidatesTags: ['MealPreferences', 'MealTemplates', 'Meals'],
        }),
    }),
});

export const {
    useGetMealsQuery,
    useGetMealPreferencesQuery,
    useGetNewMealTemplatesQuery,
    useSaveMealPreferencesMutation,
    useDeleteMealPreferencesMutation,
    useUpdateMealPreferencesFrequencyMutation,
    useResetMealPreferencesToDefaultMutation,
} = mealPreferencesApi;
