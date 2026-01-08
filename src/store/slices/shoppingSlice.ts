// outsource dependencies
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SHOPPING_STEP, SHOPPING_STATUS, SHOPPING_CONFIRMED_ITEM_TYPE, SHOPPING_ITEM_TYPE } from 'constants/spec';
// local dependencies
import type { RootState } from '../index';

interface ShoppingCategory {
    id?: number | null;
    name: string;
}

interface ShoppingDates {
    from: string;
    to: string;
}

interface ShoppingState {
    // Root state
    id: number | null;
    status: string;
    separateRescueItems: boolean;
    confirmedItemsType: string;
    initialized: boolean;

    // List state
    currentStep: number;
    activeCategory: ShoppingCategory;
    shoppingListDates: ShoppingDates | null;
    itemType: string;
    isListTouched: boolean;
    isMealQuestionAsked: boolean;
    isCustomAlertOpen: boolean;

    // Stock state
    isStockTouched: boolean;
    checkedStockItems: number[];

    // Store state
    selectedStore: any | null;
}

const initialState: ShoppingState = {
    // Root state
    id: null,
    status: SHOPPING_STATUS.PENDING,
    separateRescueItems: false, // check it later (original true)
    confirmedItemsType: SHOPPING_CONFIRMED_ITEM_TYPE.NONE,
    initialized: false,

    // List state
    currentStep: SHOPPING_STEP.MAIN,
    activeCategory: { name: 'All' },
    shoppingListDates: null,
    itemType: SHOPPING_ITEM_TYPE.ORIGINAL,
    isListTouched: false,
    isMealQuestionAsked: false,
    isCustomAlertOpen: false,

    // Stock state
    isStockTouched: false,
    checkedStockItems: [],

    // Store state
    selectedStore: null,
};

const shoppingSlice = createSlice({
    name: 'shopping',
    initialState,
    reducers: {
        setShoppingStatus: (state, action: PayloadAction<{
            id?: number | null;
            status?: string;
            separateRescueItems?: boolean;
            confirmedItemsType?: string;
        }>) => {
            if (action.payload.id !== undefined) { state.id = action.payload.id; }
            if (action.payload.status) { state.status = action.payload.status; }
            if (action.payload.separateRescueItems !== undefined) {
                state.separateRescueItems = action.payload.separateRescueItems;
            }
            if (action.payload.confirmedItemsType) {
                state.confirmedItemsType = action.payload.confirmedItemsType;
            }
        },
        setInitialized: (state, action: PayloadAction<boolean>) => {
            state.initialized = action.payload;
        },
        setCurrentStep: (state, action: PayloadAction<number>) => {
            state.currentStep = action.payload;
        },
        setActiveCategory: (state, action: PayloadAction<ShoppingCategory>) => {
            state.activeCategory = action.payload;
        },
        setShoppingListDates: (state, action: PayloadAction<ShoppingDates | null>) => {
            state.shoppingListDates = action.payload;
        },
        setItemType: (state, action: PayloadAction<string>) => {
            state.itemType = action.payload;
        },
        setIsListTouched: (state, action: PayloadAction<boolean>) => {
            state.isListTouched = action.payload;
        },
        setIsMealQuestionAsked: (state, action: PayloadAction<boolean>) => {
            state.isMealQuestionAsked = action.payload;
        },
        setIsCustomAlertOpen: (state, action: PayloadAction<boolean>) => {
            state.isCustomAlertOpen = action.payload;
        },
        setIsStockTouched: (state, action: PayloadAction<boolean>) => {
            state.isStockTouched = action.payload;
        },
        toggleStockItem: (state, action: PayloadAction<number>) => {
            const id = action.payload;
            const index = state.checkedStockItems.indexOf(id);
            if (index >= 0) {
                state.checkedStockItems.splice(index, 1);
            } else {
                state.checkedStockItems.push(id);
            }
            state.isStockTouched = true;
        },
        clearCheckedStockItems: state => {
            state.checkedStockItems = [];
        },
        setSelectedStore: (state, action: PayloadAction<any | null>) => {
            state.selectedStore = action.payload;
        },
        resetShopping: () => initialState,
        updateShoppingMeta: (state, action: PayloadAction<Partial<ShoppingState>>) => {
            return { ...state, ...action.payload };
        },
    },
});

export const {
    setItemType,
    resetShopping,
    setInitialized,
    setCurrentStep,
    toggleStockItem,
    setIsListTouched,
    setSelectedStore,
    setShoppingStatus,
    setActiveCategory,
    setIsStockTouched,
    updateShoppingMeta,
    setIsCustomAlertOpen,
    setShoppingListDates,
    setIsMealQuestionAsked,
    clearCheckedStockItems,
} = shoppingSlice.actions;

export const selectShopping = (state: RootState) => state.shopping;
export const selectCurrentStep = (state: RootState) => state.shopping.currentStep;
export const selectShoppingStatus = (state: RootState) => state.shopping.status;
export const selectItemType = (state: RootState) => state.shopping.itemType;
export const selectActiveCategory = (state: RootState) => state.shopping.activeCategory;
export const selectCheckedStockItems = (state: RootState) => state.shopping.checkedStockItems;
export const selectSelectedStore = (state: RootState) => state.shopping.selectedStore;

export default shoppingSlice.reducer;
