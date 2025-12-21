// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { Country, User, State } from 'types';
import { baseQuery } from 'store/api/baseApi.ts';

export const settingsApi = createApi({
    baseQuery,
    reducerPath: 'settingsApi',
    endpoints: builder => ({
        updateUserData: builder.mutation<any, Partial<User>>({
            query: body => ({
                body,
                method: 'PUT',
                url: '/patient-service/patients/me',
            }),
        }),
        filterCountry: builder.mutation<Country[], any >({
            query: body => {
                return {
                    body,
                    method: 'POST',
                    url: '/patient-service/country/filter',
                };
            },
        }),
        filterState: builder.mutation<State[], {country: number} >({
            query: body => {
                return {
                    body,
                    method: 'POST',
                    url: '/patient-service/country/state/filter',
                };
            },
        }),
    })
});

export const { useUpdateUserDataMutation, useFilterCountryMutation, useFilterStateMutation } = settingsApi;
