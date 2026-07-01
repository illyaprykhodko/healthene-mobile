// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from './baseApi';
import { SubmitFeedbackRequest, SubmitFeedbackResponse } from 'types/feedback';

export const feedbackApi = createApi({
    baseQuery,
    reducerPath: 'feedbackApi',
    endpoints: builder => ({
        // TODO: confirm endpoint path and request/response contract with the backend team.
        // Guarded by FEEDBACK_ENDPOINT_ENABLED (constants/feedback.ts) until the API is live.
        submitFeedback: builder.mutation<SubmitFeedbackResponse, SubmitFeedbackRequest>({
            query: body => ({
                body,
                method: 'POST',
                url: '/patient-service/feedback',
            }),
        }),
    }),
});

export const { useSubmitFeedbackMutation } = feedbackApi;
