// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from 'store/api/baseApi.ts';
import { PaginatedParams, PaginatedResponse, TransformData } from 'types/common/interfaces.ts';
import { MessageChain, Message, MessageItem, MessageForm } from 'types/messenger.ts';

export const messengerApi = createApi({
    baseQuery,
    reducerPath: 'messengerApi',
    tagTypes: ['ChanMessages', 'ListOfChain'],
    endpoints: builder => ({
        getChainMessages: builder.query<TransformData<MessageItem>, { params : PaginatedParams } >({
            providesTags: ['ListOfChain'],
            query: ({ params }) => {
                return {
                    body: {},
                    method: 'POST',
                    url: '/messenger-service/chain/filter',
                    params: { ...params, sort: 'lastMessage.date,DESC', size: 10 },
                };
            },
            serializeQueryArgs: ({ endpointName }) => endpointName,
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
            invalidatesTags: ['ListOfChain'],
            query: body => {
                return {
                    body,
                    method: 'DELETE',
                    url: '/messenger-service/chain',
                };
            }
        }),
        getMessage: builder.query<Message, { id: number }>({
            query: ({ id }) => ({
                method: 'GET',
                url: `/messenger-service/chain/${id}`
            }),
        }),
        getMessagesChain: builder.query<TransformData<MessageChain>, { chainId: number; params?: PaginatedParams }>({
            providesTags: ['ChanMessages'],
            query: ({ chainId, params }) => ({
                url: `/messenger-service/chain/${chainId}/messages`,
                method: 'GET',
                params: { ...params, sort: 'id,DESC', size: 10 },
            }),
            serializeQueryArgs: ({ endpointName, queryArgs }) => `${endpointName}-${queryArgs.chainId}`,
            transformResponse (response: PaginatedResponse<MessageChain>, _, args) {
                return {
                    data: response.content,
                    page: args.params?.page ?? 0,
                    totalPages: response.totalPages,
                };
            },
            merge (currentCache, newResponse) {
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
        replyToChain: builder.mutation<void, { chain: MessageItem } & MessageForm>({
            query: body => ({
                body,
                method: 'POST',
                url: '/messenger-service/chain/message',
            }),
            invalidatesTags: ['ChanMessages', 'ListOfChain'],
        }),
        createChain: builder.mutation<void, MessageForm & {collocutor: {id: number}}>({
            query: body => ({
                body,
                method: 'POST',
                url: '/messenger-service/chain',
            }),
            invalidatesTags: ['ListOfChain'],
        }),
    })
});

export const {
    useGetMessageQuery,
    useCreateChainMutation,
    useReplyToChainMutation,
    useDeleteChainsMutation,
    useGetChainMessagesQuery,
    useGetMessagesChainQuery
} = messengerApi;
