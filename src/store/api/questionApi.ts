// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from './baseApi';
import { dayOverviewApi } from './dayOverviewApi';
import {
    DiseaseQuestion,
    GeneralQuestion,
    QuestionCategory,
    QuestionsVideosResponse,
    AnswerFoodQuestionRequest,
    AnswerDiseaseQuestionRequest,
    AnswerGeneralQuestionRequest,
} from 'types/question';

// Library elements response type
export interface LibraryElement {
    patientVideos?: Array<{
        id: number;
        libraryItem: any;
        alreadySeen: boolean;
    }>;
    patientQuestions?: Array<{
        id: number;
        libraryItem: any;
        alreadyAnswered: boolean;
    }>;
}

export const questionApi = createApi({
    baseQuery,
    reducerPath: 'questionApi',
    tagTypes: ['Questions', 'DiseaseQuestions', 'LibraryElements'],
    endpoints: builder => ({
        // Get disease questions by date (displayed in Day Overview)
        getDiseaseQuestions: builder.query<QuestionCategory[], string>({
            query: date => ({
                method: 'GET',
                url: `/patient-service/patient/me/disease-questions/${date}`,
            }),
            providesTags: ['Questions'],
        }),

        // Get questions and videos count for a specific date (for indicators)
        getQuestionsAndVideos: builder.query<QuestionsVideosResponse, string>({
            query: date => ({
                method: 'GET',
                url: `/patient-service/patients/me/day-overview/${date}/questions-videos`,
            }),
            providesTags: ['Questions'],
        }),

        // Get current library elements (questions/videos) for a destination
        getCurrentLibraryElements: builder.query<LibraryElement[], string[]>({
            query: destinations => ({
                method: 'POST',
                body: destinations,
                url: '/patient-service/patients/me/items-from-library-destination/current',
            }),
            providesTags: ['LibraryElements'],
        }),

        // Answer disease question
        answerDiseaseQuestion: builder.mutation<DiseaseQuestion | null, AnswerDiseaseQuestionRequest>({
            query: data => ({
                body: data,
                method: 'PUT',
                url: '/patient-service/patient/me/answer-question',
            }),
            invalidatesTags: ['Questions', 'LibraryElements'],
            async onQueryStarted (_, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(dayOverviewApi.util.invalidateTags(['PhaseItems', 'DayOverview']));
                } catch (_error) {
                    // best-effort cross-slice invalidation; ignore answer errors here
                }
            },
        }),

        // Answer food category question
        answerFoodQuestion: builder.mutation<DiseaseQuestion | null, AnswerFoodQuestionRequest>({
            query: data => ({
                body: data,
                method: 'PUT',
                url: '/patient-service/patient/me/answer-food-category-question',
            }),
            invalidatesTags: ['Questions', 'LibraryElements'],
            async onQueryStarted (_, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(dayOverviewApi.util.invalidateTags(['PhaseItems', 'DayOverview']));
                } catch (_error) {
                    // best-effort cross-slice invalidation; ignore answer errors here
                }
            },
        }),

        // Answer general tree question
        answerGeneralQuestion: builder.mutation<GeneralQuestion | null, AnswerGeneralQuestionRequest>({
            query: data => ({
                body: data,
                method: 'PUT',
                url: '/patient-service/patient/me/answer-general-tree-question',
            }),
            invalidatesTags: ['Questions', 'LibraryElements'],
        }),
    }),
});

export const {
    useGetDiseaseQuestionsQuery,
    useGetQuestionsAndVideosQuery,
    useAnswerFoodQuestionMutation,
    useAnswerDiseaseQuestionMutation,
    useAnswerGeneralQuestionMutation,
    useGetCurrentLibraryElementsQuery,
} = questionApi;
