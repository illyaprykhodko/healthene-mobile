// Types for International Cuisine (Cuisine Distribution) feature

export enum TagType {
    CUISINE = 'CUISINE',
}

export interface CuisineTag {
    id: number;
    name: string;
    order: number;
    type: TagType | string;
    disabled: boolean;
}

export interface CuisineFrequency {
    id: number | null;
    tag: CuisineTag;
    meal: { id: number };
    relativeFrequency: number; // 1-10
    patient: { id: number };
}

export interface TagsFilterRequest {
    excludeIds?: number[];
    disabled?: boolean;
    type: TagType | string;
}

export interface TagsFilterResponse {
    content: CuisineTag[];
    pageNumber: number;
    totalPages: number;
    totalElements: number;
}

export interface CuisineDistributionState {
    list: CuisineTag[];
    favoriteList: CuisineFrequency[];
    initialFavoriteList: CuisineFrequency[];
    initialized: boolean;
    page: number;
    size: number;
    totalPages: number;
    sort: string;
}

