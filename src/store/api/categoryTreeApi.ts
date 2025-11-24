// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from 'store/api/baseApi.ts';
import { PaginatedResponse } from 'types/common/interfaces.ts';
import { CategoryItem, PatientCategories, PatientCategory, RequestData, TransformData } from 'types/categoryTree.ts';

export const categoryTreeApi = createApi({
    baseQuery,
    reducerPath: 'categoryTreeApi',
    tagTypes: ['PatientCategories'],
    endpoints: builder => ({
        getAllCategories: builder.query<TransformData, RequestData >({
            query: ({ body, params }) => {
                return {
                    method: 'POST',
                    body: { ...body },
                    url: '/patient-service/category-tree/nodes/filter',
                    params: { ...params, size: 20, sort: 'category.name,ASC' },
                };
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const typeView = queryArgs.body.treeTypeViewLabel;
                const parent = queryArgs.body?.parentId ?? 0; // root = 0
                return `${endpointName}-${typeView}-${parent}`;
            },
            transformResponse (response: PaginatedResponse<CategoryItem>, _, args) {
                return {
                    data: response.content,
                    page: args.params.page,
                    totalPages: response.totalPages,
                };
            },
            merge: (currentCache, newResponse) => {
                if (newResponse.page === 0) {
                    currentCache.data = newResponse.data;
                } else {
                    currentCache.data = [...currentCache.data, ...newResponse.data];
                }

                currentCache.page = newResponse.page;
                currentCache.totalPages = newResponse.totalPages;
            },
            forceRefetch ({ currentArg, previousArg }) {
                const currentPage = currentArg?.params?.page ?? 0;
                const previousPage = previousArg?.params?.page ?? 0;
                return currentPage !== previousPage;
            },
        }),
        getPatientCategories: builder.query<PatientCategories[], { body: PatientCategory }>({
            query: ({ body }) => {
                return {
                    method: 'POST',
                    body: { ...body },
                    url: '/patient-service/patient/food-categories/filter',
                };
            },
            providesTags: ['PatientCategories'],
        }),
        updatePatientCategories: builder.mutation<void, PatientCategories>({
            query: body => {
                return {
                    body,
                    method: 'POST',
                    url: '/patient-service/patient/food-categories',
                };
            },
            invalidatesTags: ['PatientCategories'],
        }),
    })
});

export const { useGetAllCategoriesQuery, useGetPatientCategoriesQuery, useUpdatePatientCategoriesMutation } = categoryTreeApi;
