// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';
// local dependencies
import { baseQuery } from './baseApi';

const GAMBLING_POINTS_URL = '/patient-service/patients/me/gambling-points';

export type UpdateGamblingPointsBody = {
  amount: number;
  action: 'EARN' | 'SPEND';
};

export const gamblingPointsApi = createApi({
    baseQuery,
    tagTypes: ['GamblingPoints'],
    reducerPath: 'gamblingPointsApi',
    endpoints: builder => ({
        getPatientGamblingPoints: builder.query<number, void>({
            query: () => ({
                method: 'GET',
                url: GAMBLING_POINTS_URL,
            }),
            providesTags: ['GamblingPoints'],
        }),

        updatePatientGamblingPoints: builder.mutation<unknown, UpdateGamblingPointsBody>({
            query: body => ({
                body,
                method: 'PUT',
                url: GAMBLING_POINTS_URL,
            }),
            invalidatesTags: ['GamblingPoints'],
        }),
    }),
});

export const {
    useGetPatientGamblingPointsQuery,
    useUpdatePatientGamblingPointsMutation,
} = gamblingPointsApi;
