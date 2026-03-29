// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQueryPub } from 'store/api/baseApi.ts';
import { BUSINESS_PROPERTIES, MobileUpdateConfig } from 'types';

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
        getUpdatePolicy: builder.query<MobileUpdateConfig, void>({
            query: () => ({
                method: 'GET',
                url: 'patient-service/public/mobile-config',
            }),
        }),
    }),
});

export const {
    useGetTermsQuery,
    useGetWelcomeQuery,
    useGetUpdatePolicyQuery,
} = publicApi;
