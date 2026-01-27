// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from 'store/api/baseApi.ts';
import { PaginatedParams, PaginatedResponse, TransformData } from 'types/common/interfaces';
import { Habit, MedicalEntityItem, PatientHabit, MedicalTermType, MedicalEntity } from 'types/healthProfile.ts';

export const healthProfileApi = createApi({
    baseQuery,
    reducerPath: 'healthProfileApi',
    tagTypes: ['PatientHabits', 'MedicationAllergies', 'MedicalProblems', 'Medications'],
    endpoints: builder => ({
        getHabits: builder.query<Habit[], void>({
            query: () => ({
                method: 'GET',
                url: '/patient-service/habit',
            }),
        }),
        getPatientHabits: builder.query<PatientHabit[], void>({
            providesTags: ['PatientHabits'],
            query: () => ({
                method: 'GET',
                url: '/patient-service/patients/me/habit',
            }),
        }),
        updatePatientHabits: builder.mutation<void, Array<{ id: number | null; entity: { id: number } }>>({
            invalidatesTags: ['PatientHabits'],
            query: body => ({
                body,
                method: 'PUT',
                url: '/patient-service/patients/me/habit',
            }),
        }),
        getMedicationAllergies: builder.query<MedicalEntity[], void>({
            providesTags: ['MedicationAllergies'],
            query: () => ({
                method: 'GET',
                url: '/patient-service/patients/me/medication-allergies',
            }),
        }),
        addMedicationAllergies: builder.mutation<void, { id: number }>({
            invalidatesTags: ['MedicationAllergies'],
            query: ({ id }) => ({
                body: { id },
                method: 'POST',
                url: '/patient-service/patients/me/medication-allergies',
            }),
        }),
        deleteMedicationAllergies: builder.mutation<void, { id: number }>({
            invalidatesTags: ['MedicationAllergies'],
            query: ({ id }) => ({
                body: { id },
                method: 'DELETE',
                url: '/patient-service/patients/me/medication-allergies',
            }),
        }),
        getMedicalProblems: builder.query<MedicalEntity[], void>({
            providesTags: ['MedicalProblems'],
            query: () => ({
                method: 'GET',
                url: '/patient-service/patients/me/medical-problems',
            }),
        }),
        addMedicalProblems: builder.mutation<void, { id: number }>({
            invalidatesTags: ['MedicalProblems'],
            query: ({ id }) => ({
                body: { id },
                method: 'POST',
                url: '/patient-service/patients/me/medical-problems',
            }),
        }),
        deleteMedicalProblems: builder.mutation<void, { id: number }>({
            invalidatesTags: ['MedicalProblems'],
            query: ({ id }) => ({
                body: { id },
                method: 'DELETE',
                url: '/patient-service/patients/me/medical-problems',
            }),
        }),
        getMedications: builder.query<MedicalEntity[], void>({
            providesTags: ['Medications'],
            query: () => ({
                method: 'GET',
                url: '/patient-service/patients/me/medications',
            }),
        }),
        addMedications: builder.mutation<void, { id: number }>({
            invalidatesTags: ['Medications'],
            query: ({ id }) => ({
                body: { id },
                method: 'POST',
                url: '/patient-service/patients/me/medications',
            }),
        }),
        deleteMedications: builder.mutation<void, { id: number }>({
            invalidatesTags: ['Medications'],
            query: ({ id }) => ({
                body: { id },
                method: 'DELETE',
                url: '/patient-service/patients/me/medications',
            }),
        }),
        findMedications: builder.query<TransformData<MedicalEntityItem>, {
            data: { name: string };
            params: PaginatedParams;
        }>({
            query: ({ data, params }) => ({
                body: data,
                method: 'POST',
                url: '/patient-service/medications/filter',
                params: { sort: 'name,ASC', size: 20, ...params },
            }),
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const searchName = queryArgs.data.name ?? '';
                return `${endpointName}-${searchName}`;
            },
            transformResponse: (response: PaginatedResponse<MedicalEntityItem>, _, args) => {
                return {
                    data: response.content,
                    page: args.params.page ?? 0,
                    totalPages: response.totalPages,
                };
            },
            merge: (currentCache, newResponse) => {
                if (newResponse.page === 0) {
                    currentCache.data = newResponse.data;
                } else {
                    currentCache.data = [...currentCache.data, ...newResponse.data];
                }
                currentCache.page = newResponse.page;
                currentCache.totalPages = newResponse.totalPages;
            },
            forceRefetch: ({ currentArg, previousArg }) => {
                if (!currentArg || !previousArg) {
                    return true;
                }
                const currentName = currentArg.data.name ?? '';
                const previousName = previousArg.data.name ?? '';
                const currentPage = currentArg.params.page ?? 0;
                const previousPage = previousArg.params.page ?? 0;
                // Refetch if search term changes or page changes
                return currentName !== previousName || currentPage !== previousPage;
            },
        }),
        findMedicalTerm: builder.query<TransformData<MedicalEntityItem>, {
            data: {name: string, type: MedicalTermType};
            params: PaginatedParams
        }>({
            query: ({ data, params }) => ({
                body: data,
                method: 'POST',
                url: '/patient-service/medical-terms/filter',
                params: { sort: 'name,ASC', size: 20, ...params },
            }),
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const searchName = queryArgs.data.name ?? '';
                const type = queryArgs.data.type ?? '';
                return `${endpointName}-${type}-${searchName}`;
            },
            transformResponse: (response: PaginatedResponse<MedicalEntityItem>, _, args) => {
                return {
                    data: response.content,
                    page: args.params.page ?? 0,
                    totalPages: response.totalPages,
                };
            },
            merge: (currentCache, newResponse) => {
                if (newResponse.page === 0) {
                    currentCache.data = newResponse.data;
                } else {
                    currentCache.data = [...currentCache.data, ...newResponse.data];
                }
                currentCache.page = newResponse.page;
                currentCache.totalPages = newResponse.totalPages;
            },
            forceRefetch: ({ currentArg, previousArg }) => {
                if (!currentArg || !previousArg) {
                    return true;
                }
                const currentName = currentArg.data.name ?? '';
                const previousName = previousArg.data.name ?? '';
                const currentType = currentArg.data.type ?? '';
                const previousType = previousArg.data.type ?? '';
                const currentPage = currentArg.params.page ?? 0;
                const previousPage = previousArg.params.page ?? 0;
                // Refetch if search term changes, type changes, or page changes
                return currentName !== previousName || currentType !== previousType || currentPage !== previousPage;
            },
        }),
    })
});

export const {
    useGetHabitsQuery,
    useGetMedicationsQuery,
    useFindMedicalTermQuery,
    useFindMedicationsQuery,
    useGetPatientHabitsQuery,
    useAddMedicationsMutation,
    useGetMedicalProblemsQuery,
    useDeleteMedicationsMutation,
    useAddMedicalProblemsMutation,
    useUpdatePatientHabitsMutation,
    useGetMedicationAllergiesQuery,
    useDeleteMedicalProblemsMutation,
    useAddMedicationAllergiesMutation,
    useDeleteMedicationAllergiesMutation,
} = healthProfileApi;
