// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from 'store/api/baseApi.ts';
import { CATEGORY_STATUS, TREE_TYPE } from 'constants/spec.ts';
import { PaginatedParams, PaginatedResponse } from 'types/common/interfaces.ts';

export type TreeType = keyof typeof TREE_TYPE;
export type CategoryStatusType = keyof typeof CATEGORY_STATUS;
export interface CategoryListBody {
    hasParent?: boolean;
    treeTypeViewLabel: TreeType
    parentId: number | undefined;
}
export interface CategoryItem {
    id: number;
    name: string;
    coverImage: string | null;
}

export interface RequestData {
    body: CategoryListBody,
    params: PaginatedParams
}

export interface TransformData {
    page: number;
    totalPages: number;
    data: CategoryItem[];
}

export interface PatientCategory {
    patientId: number;
    treeTypeViewLabel: TreeType
}

export interface PatientCategories {
    id: number;
    foodCategory: {
        id: number
        name: string
    }
    visit: {id: number}
    patient: {id: number},
    categoryStatus: CategoryStatusType,
}

export const categoryTreeApi = createApi({
    baseQuery,
    reducerPath: 'categoryTreeApi',
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
                const parent = queryArgs.body.parentId ?? 0; // root = 0
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
                return currentArg?.params.page !== previousArg?.params.page;
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
        })
    })
});

export const { useGetAllCategoriesQuery, useGetPatientCategoriesQuery } = categoryTreeApi;
