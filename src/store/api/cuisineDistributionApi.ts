// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from './baseApi';
import {
    TagType,
    // CuisineTag,
    CuisineFrequency,
    TagsFilterRequest,
    TagsFilterResponse,
} from 'types/cuisineDistribution';

export const cuisineDistributionApi = createApi({
    reducerPath: 'cuisineDistributionApi',
    baseQuery,
    tagTypes: ['CuisineFrequency', 'CuisineTags'],
    endpoints: builder => ({
        // Get patient's selected cuisines with frequency
        getCuisineFrequency: builder.query<CuisineFrequency[], TagType>({
            query: tagType => ({
                method: 'GET',
                url: `/patient-service/patient/me/tag/${tagType}/frequency`,
            }),
            providesTags: ['CuisineFrequency'],
            transformResponse: (response: CuisineFrequency[]) =>
                // Filter out disabled tags
                (response || []).filter(item => !item?.tag?.disabled),
        }),

        // Get all available cuisine tags with pagination
        getCuisineTags: builder.query<TagsFilterResponse, {
            filter: TagsFilterRequest;
            page?: number;
            size?: number;
            sort?: string;
        }>({
            query: ({ filter, page = 0, size = 20, sort = 'name,ASC' }) => ({
                body: filter,
                method: 'POST',
                params: { page, size, sort },
                url: '/patient-service/tags/filter',
            }),
            providesTags: ['CuisineTags'],
        }),

        // Save selected cuisines (create/update selections)
        saveCuisineFrequency: builder.mutation<CuisineFrequency[], {
            tagType: TagType;
            data: CuisineFrequency[];
        }>({
            query: ({ tagType, data }) => ({
                body: data,
                method: 'POST',
                params: { tagType },
                url: `/patient-service/patient/me/tag/${tagType}/frequency`,
            }),
            invalidatesTags: ['CuisineFrequency'],
        }),

        // Update frequency values for existing selections
        updateCuisineFrequency: builder.mutation<void, CuisineFrequency[]>({
            query: data => ({
                method: 'PUT',
                body: data,
                url: '/patient-service/patient/me/tag/frequency',
            }),
            invalidatesTags: ['CuisineFrequency'],
        }),
    }),
});

export const {
    useGetCuisineTagsQuery,
    useGetCuisineFrequencyQuery,
    useSaveCuisineFrequencyMutation,
    useUpdateCuisineFrequencyMutation,
} = cuisineDistributionApi;

