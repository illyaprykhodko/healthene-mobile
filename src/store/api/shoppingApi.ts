// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';
// local dependencies
import { baseQuery } from './baseApi';
import { ShoppingCartCategoryType } from 'types/meal';

// Types
export interface ShoppingListStatus {
    id: number | null;
    status: string;
    separateRescueItems: boolean;
    confirmedItemsType: string;
}

export interface ShoppingListDates {
    startDate: string;
    endDate: string;
}

export interface ShoppingCategory {
    id: number;
    name: string;
    disabled:boolean;
    order:number | null;
    type:ShoppingCartCategoryType;
}

export interface ShoppingItem {
    id: number;
    name: string;
    amount: number;
    gramWeight: number;
    isExcluded: boolean;
    isPurchased: boolean;
    shoppingCartCategory: {
        id: number;
        name: string;
    };
    food: {
        id: number;
        name: string;
        coverImage?: { url: string };
    };
}

export interface ShoppingPreference {
    id: number;
    name: string;
    amount: number;
    order: number;
}

export interface StockItem {
    id: number;
    gramWeight: number;
    expirationDate: string;
    patient: {
        id: number;
    };
    food: {
        id: number;
        name: string;
        coverImage?: { url: string };
        shoppingCartCategory?: {
            id: number;
            name: string;
        };
    };
}

export interface GroceryStore {
    id: string | number;
    name: string;
    image?: { url: string };
    addresses?: Array<{
        id: number;
        address: string;
        city: string;
        state: string;
        storeLocationType: string;
    }>;
}

export interface GroceryStoreItem {
    groceryStore: GroceryStore;
    storeLocationType?: string;
    addresses?: Array<{
        id: number;
        address: string;
        city: string;
        state: string;
        storeLocationType: string;
    }>;
}

export const shoppingApi = createApi({
    reducerPath: 'shoppingApi',
    baseQuery,
    tagTypes: ['ShoppingList', 'ShoppingStatus', 'ShoppingPreferences', 'StockList', 'GroceryStores'],
    endpoints: builder => ({
        getShoppingListStatus: builder.query<ShoppingListStatus, void>({
            query: () => '/patient-service/patients/shopping-list',
            providesTags: ['ShoppingStatus'],
        }),
        getShoppingListDates: builder.query<ShoppingListDates, void>({
            query: () => '/patient-service/patients/shopping-list/dates',
        }),
        getShoppingCategories: builder.query<ShoppingCategory[], {
            withExcluded?: boolean;
            shoppingItemType?: string | null;
        }>({
            query: ({ withExcluded = false, shoppingItemType }) => ({
                url: '/patient-service/patients/shopping-list/categories',
                params: {
                    withExcluded,
                    sort: 'food.shoppingCartCategory.name,ASC',
                    shoppingItemType,
                },
            }),
        }),
        getShoppingList: builder.query<{
            content: ShoppingItem[];
            totalPages: number;
            pageNumber: number;
            totalElements: number;
        }, {
            categories?:(number | null)[];
            withExcluded?: boolean;
            itemType?: string | null;
            page?: number;
            size?: number;
                }>({
                    query: ({ categories = [], withExcluded = false, itemType, page = 0, size = 10 }) => ({
                        url: '/patient-service/patients/shopping-list',
                        method: 'POST',
                        body: {
                            categories,
                            withExcluded,
                            itemType,
                        },
                        params: {
                            page,
                            size,
                            sort: ['food.shoppingCartCategory.name,ASC'],
                        },
                    }),
                    serializeQueryArgs: ({ endpointName, queryArgs }) => {
                        const { page, ...rest } = queryArgs;
                        return `${endpointName}(${JSON.stringify(rest)})`;
                    },
                    merge: (currentCache, newData, { arg }) => {
                        if (arg.page === 0) {
                            // first page - reset cache
                            currentCache.content = newData.content;
                        } else {
                            // next pages - append
                            const existingIds = new Set(currentCache.content.map((x: any) => x.id));
                            for (const item of newData.content) {
                                if (!existingIds.has(item.id)) { currentCache.content.push(item); }
                            }
                        }
                        currentCache.totalPages = newData.totalPages;
                        currentCache.totalElements = newData.totalElements;
                    },
                    forceRefetch: ({ currentArg, previousArg }) => {
                        if (!currentArg || !previousArg) { return true; }
                    
                        // Page changes => fetch next page
                        if (currentArg.page !== previousArg.page) { return true; }
                    
                        // Filters change => new cache key anyway, but ok to refetch
                        return (
                            currentArg.withExcluded !== previousArg.withExcluded
                          || currentArg.itemType !== previousArg.itemType
                          || JSON.stringify(currentArg.categories) !== JSON.stringify(previousArg.categories)
                          || currentArg.size !== previousArg.size
                        );
                    },
                    providesTags: ['ShoppingList'],
                }),

        // Update shopping list item
        updateShoppingItem: builder.mutation<void, ShoppingItem[]>({
            query: data => ({
                url: '/patient-service/patients/shopping-list/items',
                method: 'PUT',
                body: data,
                params: { sort: 'name,ASC' },
            }),
            invalidatesTags: ['ShoppingList'],
        }),

        // Delete excluded items and add foods to stocks
        deleteExcludedAndAddToStocks: builder.mutation<void, void>({
            query: () => ({
                url: '/patient-service/patients/shopping-list/items/excluded',
                method: 'DELETE',
            }),
            invalidatesTags: ['ShoppingList', 'StockList'],
        }),

        // Get shopping preferences (People eating per meal)
        getShoppingPreferences: builder.query<ShoppingPreference[], void>({
            query: () => '/patient-service/patients/shopping-preferences',
            providesTags: ['ShoppingPreferences'],
        }),

        // Update shopping preferences
        updateShoppingPreferences: builder.mutation<void, ShoppingPreference[]>({
            query: data => ({
                url: '/patient-service/patients/shopping-preferences',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['ShoppingPreferences'],
        }),

        // Generate shopping list
        generateShoppingList: builder.mutation<void, Record<string, never> | void>({
            query: () => ({
                url: '/patient-service/patients/shopping-list/items',
                method: 'POST',
                // params: {
                //     sort: 'name,ASC',
                // },
            }),
            invalidatesTags: ['ShoppingList', 'ShoppingStatus'],
        }),

        // Get stock list
        getStockList: builder.query<{ content: StockItem[], totalPages: number, totalElements: number }, {
            shoppingCartCategoryId?: number;
            page?: number;
            size?: number;
        }>({
            query: ({ shoppingCartCategoryId, page, size }) => ({
                url: '/patient-service/patients/me/stock-foods',
                params: {
                    shoppingCartCategoryId,
                    page,
                    size,
                },
            }),
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const { page, ...rest } = queryArgs;
                return `${endpointName}(${JSON.stringify(rest)})`;
            },
            merge: (currentCache, newData, { arg }) => {
                if ((arg.page ?? 0) === 0) {
                    currentCache.content = newData.content;
                } else {
                    const existingIds = new Set(currentCache.content.map(x => x.id));
                    for (const item of newData.content) {
                        if (!existingIds.has(item.id)) { currentCache.content.push(item); }
                    }
                }
            
                currentCache.totalPages = newData.totalPages;
                currentCache.totalElements = newData.totalElements;
            },
            forceRefetch: ({ currentArg, previousArg }) => {
                if (!currentArg || !previousArg) { return true; }
            
                if ((currentArg.page ?? 0) !== (previousArg.page ?? 0)) { return true; }
            
                return (
                    currentArg.shoppingCartCategoryId !== previousArg.shoppingCartCategoryId
                  || (currentArg.size ?? 20) !== (previousArg.size ?? 20)
                );
            },
            providesTags: ['StockList'],
        }),
        getStockCategories: builder.query<ShoppingCategory[], void>({
            query: () => '/patient-service/patients/me/stock-foods/categories',
            providesTags: ['StockList'],
        }),
        moveStocksToShoppingList: builder.mutation<void, { ids: number[] }>({
            query: ({ ids }) => ({
                url: '/patient-service/patients/me/stock-foods/to/shopping-list-items',
                method: 'POST',
                body: ids,
            }),
            invalidatesTags: ['StockList'],
        }),

        // Update stock items (remove from stock)
        updateStockItems: builder.mutation<void, { ids: number[] }>({
            query: ({ ids }) => ({
                url: '/patient-service/patients/me/stock-foods',
                method: 'DELETE',
                body: ids,
            }),
            invalidatesTags: ['StockList'],
        }),

        // Get grocery stores
        getGroceryStores: builder.query<GroceryStoreItem[], void>({
            query: () => '/patient-service/patients/grocery-store',
            providesTags: ['GroceryStores'],
        }),

        // Get incomplete grocery stores (new stores without full setup)
        getIncompleteGroceryStores: builder.query<GroceryStoreItem[], void>({
            query: () => '/patient-service/patients/grocery-store/new',
            providesTags: ['GroceryStores'],
        }),

        // Update grocery store selection
        updateGroceryStore: builder.mutation<void, GroceryStoreItem>({
            query: data => ({
                url: '/patient-service/patients/grocery-store',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['GroceryStores'],
        }),

        // Update shopping list status
        updateShoppingListStatus: builder.mutation<void, {
            id: number;
            status: string;
            separateRescueItems?: boolean;
            confirmedItemsType?: string;
        }>({
            query: data => ({
                url: '/patient-service/patients/shopping-list',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['ShoppingStatus'],
        }),

        // Submit shopping order
        submitShoppingOrder: builder.mutation<void, {
            groceryStoreId: number | string;
            storeLocationType?: string;
            addressId?: number;
        }>({
            query: data => ({
                url: '/patient-service/patients/shopping-list/submit',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['ShoppingStatus', 'ShoppingList'],
        }),

        // Confirm shop on my own
        confirmShopOnMyOwn: builder.mutation<void, Record<string, never> | void>({
            query: () => ({
                url: '/patient-service/patients/shopping-list/shop-on-my-own',
                method: 'POST',
            }),
            invalidatesTags: ['ShoppingStatus', 'ShoppingList'],
        }),

        // Get shopping list PDF
        getShoppingListPdf: builder.query<Blob, { startDate: string; endDate: string }>({
            query: ({ startDate, endDate }) => ({
                url: '/patient-service/patients/shopping-list/pdf',
                params: { startDate, endDate },
                responseHandler: response => response.blob(),
            }),
        }),

        // Get current elements (videos, questions)
        getCurrentElements: builder.query<any[], void>({
            query: () => ({
                url: 'patient-service/patients/me/items-from-library-destination/current',
                method: 'POST',
                body: ['SHOPPING_LIST'],
            }),
        }),
    }),
});

export const {
    useGetShoppingListStatusQuery,
    useGetShoppingListDatesQuery,
    useGetShoppingCategoriesQuery,
    useGetShoppingListQuery,
    useUpdateShoppingItemMutation,
    useDeleteExcludedAndAddToStocksMutation,
    useGetShoppingPreferencesQuery,
    useUpdateShoppingPreferencesMutation,
    useGenerateShoppingListMutation,
    useGetStockListQuery,
    useUpdateStockItemsMutation,
    useGetGroceryStoresQuery,
    useGetIncompleteGroceryStoresQuery,
    useUpdateGroceryStoreMutation,
    useUpdateShoppingListStatusMutation,
    useSubmitShoppingOrderMutation,
    useConfirmShopOnMyOwnMutation,
    useGetShoppingListPdfQuery,
    useLazyGetShoppingListPdfQuery,
    useGetCurrentElementsQuery,
    useGetStockCategoriesQuery,
    useMoveStocksToShoppingListMutation,
} = shoppingApi;
