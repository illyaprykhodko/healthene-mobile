// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from 'store/api/baseApi.ts';
import { Habit, PatientHabit } from 'types/healthProfile.ts';

export const healthProfileApi = createApi({
    baseQuery,
    reducerPath: 'healthProfileApi',
    tagTypes: ['PatientHabits'],
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
    })
});

export const {
    useGetHabitsQuery,
    useGetPatientHabitsQuery,
    useUpdatePatientHabitsMutation,
} = healthProfileApi;
