// local dependencies
import { PaginatedParams, TransformData } from 'types/common/interfaces.ts';
import { CATEGORY_STATUS, TREE_TYPE } from 'constants/spec.ts';

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

export type CategoryTransformData = TransformData<CategoryItem>;

export interface PatientCategory {
    patientId: number;
    treeTypeViewLabel: TreeType
}

export interface PatientCategories {
    id?: number;
    foodCategory: {
        id: number
        name: string
    }
    visit: {id: number}
    patient: {id: number},
    categoryStatus: CategoryStatusType,
}
