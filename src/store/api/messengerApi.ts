// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from 'store/api/baseApi.ts';
import { PaginatedParams, PaginatedResponse, TransformData } from 'types/common/interfaces.ts';
import { MessageChain, Message, MessageItem, MessageForm, Recipient } from 'types/messenger.ts';

// NOTE backend page size for both chains list and chain messages — keep in sync
// between the request and any consumer that checks `hasNextPage` heuristics.
const CHAINS_PAGE_SIZE = 10;
const MESSAGES_PAGE_SIZE = 10;

export interface FilterDoctorsBody {
    name?: string;
    clinicId?: number;
    tenantId?: number;
    clinicRoles?: string[];
}

export interface FilterDoctorsArgs {
    body: FilterDoctorsBody;
    params: PaginatedParams;
}

export const messengerApi = createApi({
    baseQuery,
    reducerPath: 'messengerApi',
    tagTypes: ['ChanMessages', 'ListOfChain'],
    endpoints: builder => ({
        // NOTE Native infinite-query endpoint: RTK Query owns the `{ pages, pageParams }`
        // structure, the cache key is just the (empty) queryArg, and tag invalidation
        // (`ListOfChain` from `createChain` / `replyToChain` / `deleteChains`) cleanly
        // re-fetches every cached page in order — no manual `serializeQueryArgs`
        // collapse / `merge` / `forceRefetch` workarounds required.
        getChainMessages: builder.infiniteQuery<PaginatedResponse<MessageItem>, void, number>({
            providesTags: ['ListOfChain'],
            infiniteQueryOptions: {
                initialPageParam: 0,
                getNextPageParam: (lastPage, _allPages, lastPageParam) => {
                    const nextPage = lastPageParam + 1;
                    return nextPage < lastPage.totalPages ? nextPage : undefined;
                },
            },
            query: ({ pageParam }) => ({
                body: {},
                method: 'POST',
                url: '/messenger-service/chain/filter',
                params: { page: pageParam, sort: 'lastMessage.date,DESC', size: CHAINS_PAGE_SIZE },
            }),
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
        // NOTE Same pattern as `getChainMessages`, but the queryArg here is the
        // `chainId` — RTK Query uses it to scope the cache entry, so each chain has
        // its own `{ pages, pageParams }` structure.
        getMessagesChain: builder.infiniteQuery<PaginatedResponse<MessageChain>, { chainId: number }, number>({
            providesTags: ['ChanMessages'],
            infiniteQueryOptions: {
                initialPageParam: 0,
                getNextPageParam: (lastPage, _allPages, lastPageParam) => {
                    const nextPage = lastPageParam + 1;
                    return nextPage < lastPage.totalPages ? nextPage : undefined;
                },
            },
            query: ({ queryArg, pageParam }) => ({
                method: 'GET',
                url: `/messenger-service/chain/${queryArg.chainId}/messages`,
                params: { page: pageParam, sort: 'id,DESC', size: MESSAGES_PAGE_SIZE },
            }),
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
            invalidatesTags: ['ListOfChain', 'ChanMessages'],
        }),
        getClinicRoles: builder.query<string[], void>({
            query: () => ({
                method: 'GET',
                url: '/patient-service/doctors/clinic-roles',
            }),
            transformResponse: (response: string[] | null | undefined) => (Array.isArray(response) ? response : []),
        }),
        // NOTE No `sort` param — the backend Doctor entity field mapping does not
        // necessarily match DTO field names (e.g. `lastName` lives on a related
        // User entity) and sending a wrong sort produces HTTP 500.
        // Client-side ordering is applied in the picker screen.
        filterDoctors: builder.query<TransformData<Recipient>, FilterDoctorsArgs>({
            query: ({ body, params }) => ({
                body,
                method: 'POST',
                url: '/patient-service/doctors/filter',
                params: { ...params, size: params.size ?? 100 },
            }),
            serializeQueryArgs: ({ endpointName }) => endpointName,
            transformResponse (response: PaginatedResponse<Recipient>, _, args) {
                return {
                    data: response.content,
                    page: args.params.page,
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
                // NOTE refetch on every change of page or any filter (name / role / clinic / tenant)
                if (!previousArg) { return true; }
                return JSON.stringify(currentArg) !== JSON.stringify(previousArg);
            },
        }),
    })
});

export const {
    useGetMessageQuery,
    useFilterDoctorsQuery,
    useCreateChainMutation,
    useGetClinicRolesQuery,
    useReplyToChainMutation,
    useDeleteChainsMutation,
    useGetChainMessagesInfiniteQuery,
    useGetMessagesChainInfiniteQuery,
} = messengerApi;
