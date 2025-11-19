// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { TREE_TYPE } from 'constants/spec.ts';
import { baseQuery } from 'store/api/baseApi.ts';
import { PaginatedParams, PaginatedResponse } from 'types/common/interfaces.ts';

export type TreeType = keyof typeof TREE_TYPE;
export interface CategoryListBody {
    parentId?: number;
    hasParent?: boolean;
    treeTypeViewLabel: TreeType
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
    data: CategoryItem[];
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
            serializeQueryArgs: ({ endpointName, queryArgs }) => ({
                key: `${endpointName}-${queryArgs.params.page}`,
            }),
            transformResponse (response: PaginatedResponse<CategoryItem>, _, args:RequestData) {
                return {
                    data: response.content,
                    page: args.params.page,
                };
            }
        }),
    })
});

export const { useGetAllCategoriesQuery } = categoryTreeApi;
