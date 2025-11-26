// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from 'store/api/baseApi.ts';
import { MessageItem, TransformData } from 'types/messenger.ts';
import { PaginatedParams, PaginatedResponse } from 'types/common/interfaces.ts';

export const messengerApi = createApi({
    baseQuery,
    reducerPath: 'messenger',
    tagTypes: ['ChanMessages'],
    endpoints: builder => ({
        getChainMessages: builder.query<TransformData, { params : PaginatedParams } >({
            providesTags: ['ChanMessages'],
            query: ({ params }) => {
                return {
                    body: {},
                    method: 'POST',
                    url: '/messenger-service/chain/filter',
                    params: { ...params, sort: 'id,ASC', size: 10 },
                };
            },
            transformResponse (response: PaginatedResponse<MessageItem>, _, args) {
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
        deleteChains: builder.mutation<void, [{ id: number }]>({
            invalidatesTags: ['ChanMessages'],
            query: body => {
                return {
                    body,
                    method: 'DELETE',
                    url: '/messenger-service/chain',
                };
            }
        })
    })
});

export const { useGetChainMessagesQuery, useDeleteChainsMutation } = messengerApi;
