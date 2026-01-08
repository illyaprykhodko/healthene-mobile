// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from 'store/api/baseApi.ts';
import { Country, User, State, ChangePassword } from 'types';

export const settingsApi = createApi({
    baseQuery,
    reducerPath: 'settingsApi',
    endpoints: builder => ({
        updateUserData: builder.mutation<User, Partial<User>>({
            query: body => ({
                body,
                method: 'PUT',
                url: '/patient-service/patients/me',
            }),
        }),
        filterCountry: builder.mutation<Country[], void >({
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
        changePassword: builder.mutation<void, Omit<ChangePassword, 'checkPassword'>>({
            query: body => ({
                body,
                method: 'PUT',
                url: '/patient-service/user/account/password',
            }),
        }),
    })
});

export const { useUpdateUserDataMutation, useFilterCountryMutation, useFilterStateMutation, useChangePasswordMutation } = settingsApi;
