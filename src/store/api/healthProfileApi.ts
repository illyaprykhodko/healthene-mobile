// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from 'store/api/baseApi.ts';
import { PaginatedParams, PaginatedResponse, TransformData } from 'types/common/interfaces';
import { Habit, MedicalTermItem, PatientHabit, MedicalTermType, MedicationAllergy } from 'types/healthProfile.ts';

export const healthProfileApi = createApi({
    baseQuery,
    reducerPath: 'healthProfileApi',
    tagTypes: ['PatientHabits', 'MedicationAllergies'],
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
        updatePatientHabits: builder.mutation<any, any>({
            invalidatesTags: ['PatientHabits'],
            query: body => ({
                body,
                method: 'PUT',
                url: '/patient-service/patients/me/habit',
            }),
        }),
        getMedicationAllergies: builder.query<MedicationAllergy[], void>({
            providesTags: ['MedicationAllergies'],
            query: () => ({
                method: 'GET',
                url: '/patient-service/patients/me/medication-allergies',
            }),
        }),
        addMedicationAllergies: builder.mutation<any, { id: number }>({
            invalidatesTags: ['MedicationAllergies'],
            query: ({ id }) => ({
                body: { id },
                method: 'POST',
                url: '/patient-service/patients/me/medication-allergies',
            }),
        }),
        deleteMedicationAllergies: builder.mutation<any, { id: number }>({
            invalidatesTags: ['MedicationAllergies'],
            query: ({ id }) => ({
                body: { id },
                method: 'DELETE',
                url: '/patient-service/patients/me/medication-allergies',
            }),
        }),
        findMedicalTerm: builder.query<TransformData<MedicalTermItem>, {
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
                return `${endpointName}-${searchName}`;
            },
            transformResponse: (response: PaginatedResponse<MedicalTermItem>, _, args) => {
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
    })
});

export const {
    useGetHabitsQuery,
    useFindMedicalTermQuery,
    useGetPatientHabitsQuery,
    useUpdatePatientHabitsMutation,
    useGetMedicationAllergiesQuery,
    useAddMedicationAllergiesMutation,
    useDeleteMedicationAllergiesMutation,
} = healthProfileApi;
