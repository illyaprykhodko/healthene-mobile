// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { User } from 'types';
import { baseQuery } from 'store/api/baseApi.ts';

export const settingsApi = createApi({
    reducerPath: 'settingsApi',
    baseQuery,
    endpoints: builder => ({
        updateUserData: builder.mutation<any, Partial<User>>({
            query: body => ({
                url: '/patient-service/patients/me',
                method: 'PUT',
                body,
            }),
        }),
    })
});

export const { useUpdateUserDataMutation } = settingsApi;
