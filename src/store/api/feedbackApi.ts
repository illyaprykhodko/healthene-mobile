// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from './baseApi';
import { SubmitFeedbackRequest, SubmitFeedbackResponse } from 'types/feedback';

export const feedbackApi = createApi({
    baseQuery,
    reducerPath: 'feedbackApi',
    endpoints: builder => ({
        // Patient Feedback API — createFeedback. The patient is resolved server-side from the
        // auth token, hence the `me` path segment and no id in the payload.
        submitFeedback: builder.mutation<SubmitFeedbackResponse, SubmitFeedbackRequest>({
            query: body => ({
                body,
                method: 'POST',
                url: '/patient-service/patients/me/feedback',
            }),
        }),
    }),
});

export const { useSubmitFeedbackMutation } = feedbackApi;
