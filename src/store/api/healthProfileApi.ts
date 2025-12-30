// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from 'store/api/baseApi.ts';
import { Habit } from 'types/healthProfile.ts';

export const healthProfileApi = createApi({
    baseQuery,
    reducerPath: 'healthProfileApi',
    endpoints: builder => ({
        getHabits: builder.query<Habit[], void>({
            query: () => ({
                method: 'GET',
                url: '/patient-service/habit',
            }),
        }),
        getPatientHabits: builder.query<any, void>({
            query: () => ({
                method: 'GET',
                url: '/patient-service/patients/me/habit',
            }),
        }),
        updatePatientHabits: builder.mutation<any, any>({
            query: data => ({
                method: 'PUT',
                url: '/patient-service/patients/me/habit',
                data,
            }),
        }),
    })
});

export const {
    useGetHabitsQuery,
    useGetPatientHabitsQuery,
    useUpdatePatientHabitsMutation,
} = healthProfileApi;
