// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from 'store/api/baseApi.ts';

export const questionApi = createApi({
    baseQuery,
    reducerPath: 'questionApi',
    endpoints: builder => ({
        answerQuestion: builder.mutation<void, Record<string, unknown>>({
            query: data => ({
                method: 'PUT',
                url: '/patient-service/patient/me/answer-question',
                body: data,
            }),
        }),
    }),
});

export const {
    useAnswerQuestionMutation,
} = questionApi;
