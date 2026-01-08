// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { BUSINESS_PROPERTIES } from 'types';
import { baseQueryPub } from 'store/api/baseApi.ts';

interface WelcomeImage {
    id: number;
    url: string;
}

interface WelcomeData {
    image: WelcomeImage | null;
}

export const publicApi = createApi({
    reducerPath: 'publicApi',
    baseQuery: baseQueryPub,
    endpoints: builder => ({
        getTerms: builder.query<{ value: string }, BUSINESS_PROPERTIES>({
            query: property => ({
                method: 'GET',
                url: `patient-service/public/business-properties/key/${property}`
            }),
        }),
        getWelcome: builder.query<WelcomeData, void>({
            query: () => ({
                method: 'GET',
                url: 'patient-service/public/patients/welcome'
            }),
        }),
    }),
});

export const {
    useGetTermsQuery,
    useGetWelcomeQuery,
} = publicApi;
