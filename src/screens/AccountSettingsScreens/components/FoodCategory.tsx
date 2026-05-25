// outsource dependencies
import { skipToken } from '@reduxjs/toolkit/query';
import React, { useEffect, useState } from 'react';

// local dependencies
import Screen from 'components/Screen.tsx';
import { TreeType } from 'types/categoryTree.ts';
import { useAppDispatch, useAppSelector } from 'store';
import { setCategories } from 'store/slices/foodPreferrencesSlice.ts';
import { Tree } from 'screens/AccountSettingsScreens/components/Tree.tsx';
import { StatusEdit } from 'screens/AccountSettingsScreens/components/StatusEdit.tsx';
import { useGetAllCategoriesQuery, useGetPatientCategoriesQuery } from 'store/api/categoryTreeApi.ts';

interface FoodCategoryProps {
    treeTypeViewLabel: TreeType
}

export const FoodCategory = ({ treeTypeViewLabel }: FoodCategoryProps) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.app.user);

    // Get list categories
    const [page, setPage] = useState<number>(0);
    const [parentId, setParentId] = useState<number | undefined>();
    const { data: treeList } = useGetAllCategoriesQuery({
        params: { page },
        body: {
            parentId,
            treeTypeViewLabel,
            hasParent: Boolean(parentId)
        }
    });

    // Get patient categories (per-user statuses for the current tree)
    const { data: patientCategories } = useGetPatientCategoriesQuery(
        user?.id
            ? { body: { treeTypeViewLabel, patientId: user.id } }
            : skipToken
    );
    useEffect(() => {
        if (patientCategories) {
            dispatch(setCategories(patientCategories));
        }
    }, [patientCategories, dispatch]);

    // Handle preloader — wait for both tree nodes and patient statuses so
    // checkboxes never render in the default state before the real one arrives
    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        const patientReady = !user?.id || Boolean(patientCategories);
        if (treeList && patientReady) {
            setInitialized(true);
        }
    }, [treeList, patientCategories, user?.id]);

    return <Screen initialized={initialized}>
        <Tree
            tree={treeList}
            setPage={setPage}
            setParentId={setParentId}
            component={item => <StatusEdit {...item} treeTypeViewLabel={treeTypeViewLabel} />}
        />
    </Screen>;
};
