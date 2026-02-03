// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';
// local dependencies
import { baseQuery } from './baseApi';
import type {
    FoodTreeItem,
    DestinationTreeItem,
    MedicalTermWithVideos,
} from 'types/video';

export const videoApi = createApi({
    reducerPath: 'videoApi',
    baseQuery,
    tagTypes: ['Video', 'VideoLibrary'],
    endpoints: builder => ({
        // Get food tree with videos
        getFoodTree: builder.query<FoodTreeItem[], void>({
            query: () => '/patient-service/patient/me/food-tree',
            providesTags: ['VideoLibrary'],
        }),

        // Get patient medical problems (with videos)
        getMedicalProblems: builder.query<MedicalTermWithVideos[], void>({
            query: () => '/patient-service/patients/me/medical-problems',
            providesTags: ['VideoLibrary'],
        }),

        // Get patient medication allergies (with videos)
        getMedicationAllergies: builder.query<MedicalTermWithVideos[], void>({
            query: () => '/patient-service/patients/me/medication-allergies',
            providesTags: ['VideoLibrary'],
        }),

        // Get general attachments (destination tree)
        getDestinationTree: builder.query<DestinationTreeItem[], void>({
            query: () => '/patient-service/patient/me/destination-tree',
            providesTags: ['VideoLibrary'],
        }),

        // Mark health profile video as watched
        markHealthProfileVideoWatched: builder.mutation<void, number>({
            query: id => ({
                url: `/patient-service/patients/me/attachment-watch/${id}`,
                method: 'GET',
            }),
            invalidatesTags: ['Video', 'VideoLibrary'],
        }),

        // Mark general video as watched
        markGeneralVideoWatched: builder.mutation<void, number>({
            query: id => ({
                url: `/patient-service/patients/me/attachment-from-library-destination-watch/${id}`,
                method: 'PUT',
            }),
            invalidatesTags: ['Video', 'VideoLibrary'],
        }),

        // Mark day overview food video as watched
        markOverviewVideoWatched: builder.mutation<void, number>({
            query: id => ({
                url: `/patient-service/patient/me/food-attachments/attachment-watch/${id}`,
                method: 'PUT',
            }),
            invalidatesTags: ['Video', 'VideoLibrary'],
        }),
    }),
});

export const {
    useGetFoodTreeQuery,
    useGetDestinationTreeQuery,
    useGetMedicalProblemsQuery,
    useGetMedicationAllergiesQuery,
    useMarkGeneralVideoWatchedMutation,
    useMarkOverviewVideoWatchedMutation,
    useMarkHealthProfileVideoWatchedMutation,
} = videoApi;
