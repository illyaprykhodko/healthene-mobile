// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';
// local dependencies
import { baseQuery } from './baseApi';
import { gamblingPointsApi } from './gamblingPointsApi';

const GIFT_CARDS_BASE_URL = '/gambling-listener/users/me/gift-cards';

export type GiftCardBrand = {
    name: string;
    imageUrl: string;
    brandCode: string;
    disclaimer: string;
};

export type GiftCardBrandDetail = {
    name: string;
    imageUrl: string;
    brandCode: string;
    disclaimer: string;
    variablePrice: boolean;
    maxPriceInCents: number;
    minPriceInCents: number;
    allowedPricesInCents: number[] | null;
};

export type ClaimGiftCardBody = {
    brandCode: string;
    imageUrl?: string;
    pointsToSpend: number;
};

export type ClaimGiftCardResponse = {
    giftLink: string;
    pointsDeducted: number;
    remainingPoints: number;
};

export type GiftCardOrder = {
    id: number;
    status: string;
    giftLink: string;
    imageUrl: string;
    brandCode: string;
    claimedAt: string;
    priceInCents: number;
    expiresAt?: string | null;
};

export type GetGiftCardOrdersParams = { page: number; size: number };

export type GiftCardOrdersResponse = {
    size: number;
    offset: number;
    totalPages: number;
    pageNumber: number;
    totalElements: number;
    content: GiftCardOrder[];
};

export type GiftCardServiceStatus = {
    available: boolean;
    unavailabilityReason: 'GIFTBIT_API_UNAVAILABLE' | 'INSUFFICIENT_FUNDS' | null;
};

export const giftCardApi = createApi({
    baseQuery,
    tagTypes: ['GiftCardBrands', 'GiftCardOrders'],
    reducerPath: 'giftCardApi',
    endpoints: builder => ({
        getGiftCardBrands: builder.query<GiftCardBrand[], void>({
            query: () => ({
                method: 'GET',
                url: `${GIFT_CARDS_BASE_URL}/brands`,
            }),
            providesTags: ['GiftCardBrands'],
        }),
        getGiftCardBrand: builder.query<GiftCardBrandDetail, string>({
            query: code => ({
                method: 'GET',
                url: `${GIFT_CARDS_BASE_URL}/brands/${code}`,
            }),
        }),
        claimGiftCard: builder.mutation<ClaimGiftCardResponse, ClaimGiftCardBody>({
            query: body => ({
                body,
                method: 'POST',
                url: `${GIFT_CARDS_BASE_URL}/claim`,
            }),
            invalidatesTags: ['GiftCardOrders'],
            async onQueryStarted (_, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(gamblingPointsApi.util.invalidateTags(['GamblingPoints']));
                } catch (_error) {
                    // points refetch is best-effort; ignore claim errors here
                }
            },
        }),
        getGiftCardOrders: builder.query<GiftCardOrdersResponse, GetGiftCardOrdersParams>({
            query: ({ page, size }) => ({
                method: 'GET',
                url: `${GIFT_CARDS_BASE_URL}/orders`,
                params: { page, size },
            }),
            providesTags: ['GiftCardOrders'],
        }),
        checkGiftCardHealth: builder.query<GiftCardServiceStatus, void>({
            query: () => ({
                method: 'GET',
                url: `${GIFT_CARDS_BASE_URL}/health`,
            }),
        }),
    }),
});

export const {
    useGetGiftCardBrandQuery,
    useClaimGiftCardMutation,
    useGetGiftCardBrandsQuery,
    useGetGiftCardOrdersQuery,
    useLazyGetGiftCardOrdersQuery,
    useLazyCheckGiftCardHealthQuery,
} = giftCardApi;
