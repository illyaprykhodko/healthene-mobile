// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from './baseApi';
import {
    // Habit,
    UserStats,
    // Supplement,
    // MedicalProblem,
    FilterParams,
    FilteredResponse,
    PatientMedication,
    MedicationAllergy,
    MedicationFilterRequest,
} from 'types/healthProfile';
import { Habit, MedicalProblem, Supplement } from 'types';

export const healthProfileApi = createApi({
    reducerPath: 'healthProfileApi',
    baseQuery,
    tagTypes: ['Profile', 'Medications', 'MedicalProblems', 'MedicationAllergies', 'Supplements', 'Habits'],
    endpoints: builder => ({
        // Get patient's medications
        getPatientMedications: builder.query<PatientMedication[], void>({
            query: () => ({
                method: 'GET',
                url: '/patient-service/patients/me/medications',
            }),
            providesTags: ['Medications'],
        }),

        // Get patient's medical problems
        getPatientMedicalProblems: builder.query<MedicalProblem[], void>({
            query: () => ({
                method: 'GET',
                url: '/patient-service/patients/me/medical-problems',
            }),
            providesTags: ['MedicalProblems'],
        }),

        // Get patient's medication allergies
        getPatientMedicationAllergies: builder.query<MedicationAllergy[], void>({
            query: () => ({
                method: 'GET',
                url: '/patient-service/patients/me/medication-allergies',
            }),
            providesTags: ['MedicationAllergies'],
        }),

        // Get patient's supplements
        getPatientSupplements: builder.query<Supplement[], void>({
            query: () => ({
                method: 'GET',
                url: '/patient-service/patients/me/supplements',
            }),
            providesTags: ['Supplements'],
        }),

        // Get all habits
        getHabits: builder.query<Habit[], void>({
            query: () => ({
                method: 'GET',
                url: '/patient-service/habit',
            }),
            providesTags: ['Habits'],
        }),

        // Get patient's habits
        getPatientHabits: builder.query<Array<{ id: number; habit: { id: number } }>, void>({
            query: () => ({
                method: 'GET',
                url: '/patient-service/patients/me/habit',
            }),
            providesTags: ['Habits'],
        }),

        // Update patient stats
        updatePatientStats: builder.mutation<void, UserStats>({
            query: data => ({
                body: data,
                method: 'PUT',
                url: '/patient-service/patients/me',
            }),
            invalidatesTags: ['Profile'],
        }),

        // Update patient habits
        updatePatientHabits: builder.mutation<void, Array<{ entity: { id: number } }>>({
            query: data => ({
                body: data,
                method: 'PUT',
                url: '/patient-service/patients/me/habit',
            }),
            invalidatesTags: ['Habits'],
        }),

        // Filter medications (for selection)
        filterMedications: builder.query<FilteredResponse<{ id: number; name: string }>, {
            filter: MedicationFilterRequest;
            params?: FilterParams;
        }>({
            query: ({ filter, params = {} }) => ({
                body: { name: filter.name ?? '' },
                method: 'POST',
                url: '/patient-service/medications/filter',
                params: {
                    page: params.page ?? 0,
                    size: params.size ?? 10,
                    sort: params.sort ?? 'name,ASC',
                },
            }),
            keepUnusedDataFor: 0,
        }),

        // Filter medical terms (for medical problems and medication allergies)
        filterMedicalTerms: builder.query<FilteredResponse<{ id: number; name: string }>, {
            filter: { name?: string; types?: string[] };
            params?: FilterParams;
        }>({
            query: ({ filter, params = {} }) => ({
                body: { name: filter.name ?? '', types: filter.types ?? [] },
                method: 'POST',
                url: '/patient-service/medical-terms/filter',
                params: {
                    page: params.page ?? 0,
                    size: params.size ?? 10,
                    sort: params.sort ?? 'name,ASC',
                },
            }),
            keepUnusedDataFor: 0,
        }),

        // Add medication
        addPatientMedication: builder.mutation<PatientMedication, { id: number }>({
            query: data => ({
                body: data,
                method: 'POST',
                url: '/patient-service/patients/me/medications',
            }),
            invalidatesTags: ['Medications'],
        }),

        // Remove medication
        removePatientMedication: builder.mutation<void, { id: number }>({
            query: data => ({
                body: data,
                method: 'DELETE',
                url: '/patient-service/patients/me/medications',
            }),
            invalidatesTags: ['Medications'],
        }),

        // Add medical problem
        addPatientMedicalProblem: builder.mutation<MedicalProblem, { id: number }>({
            query: data => ({
                body: data,
                method: 'POST',
                url: '/patient-service/patients/me/medical-problems',
            }),
            invalidatesTags: ['MedicalProblems'],
        }),

        // Remove medical problem
        removePatientMedicalProblem: builder.mutation<void, { id: number }>({
            query: data => ({
                body: data,
                method: 'DELETE',
                url: '/patient-service/patients/me/medical-problems',
            }),
            invalidatesTags: ['MedicalProblems'],
        }),

        // Add medication allergy
        addPatientMedicationAllergy: builder.mutation<MedicationAllergy, { id: number }>({
            query: data => ({
                body: data,
                method: 'POST',
                url: '/patient-service/patients/me/medication-allergies',
            }),
            invalidatesTags: ['MedicationAllergies'],
        }),

        // Remove medication allergy
        removePatientMedicationAllergy: builder.mutation<void, { id: number }>({
            query: data => ({
                body: data,
                method: 'DELETE',
                url: '/patient-service/patients/me/medication-allergies',
            }),
            invalidatesTags: ['MedicationAllergies'],
        }),
    }),
});

export const {
    useGetHabitsQuery,
    useGetPatientHabitsQuery,
    useFilterMedicationsQuery,
    useFilterMedicalTermsQuery,
    useGetPatientMedicationsQuery,
    useGetPatientSupplementsQuery,
    useUpdatePatientStatsMutation,
    useUpdatePatientHabitsMutation,
    useAddPatientMedicationMutation,
    useGetPatientMedicalProblemsQuery,
    useRemovePatientMedicationMutation,
    useAddPatientMedicalProblemMutation,
    useGetPatientMedicationAllergiesQuery,
    useRemovePatientMedicalProblemMutation,
    useAddPatientMedicationAllergyMutation,
    useRemovePatientMedicationAllergyMutation,
} = healthProfileApi;
