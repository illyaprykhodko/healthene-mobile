// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { PlanInfo } from 'types';
import { baseQuery } from 'store/api/baseApi.ts';

export const planApi = createApi({
    baseQuery,
    reducerPath: 'planApi',
    endpoints: builder => ({
        getPlanInfo: builder.query<PlanInfo, void>({
            query: () => ({
                method: 'GET',
                url: '/patient-service/patients/me/plans/description',
            })
        }),
    })
});

export const { useGetPlanInfoQuery } = planApi;
