// outsource dependencies
import React, { useEffect, useState } from 'react';

// local dependencies
import Screen from 'components/Screen.tsx';
import { TreeType } from 'types/categoryTree.ts';
import { useGetAllCategoriesQuery } from 'store/api/categoryTreeApi.ts';
import { Tree } from 'screens/AccountSettingsScreens/components/Tree.tsx';
import { StatusEdit } from 'screens/AccountSettingsScreens/components/StatusEdit.tsx';

interface FoodCategoryProps {
    treeTypeViewLabel: TreeType
}

export const FoodCategory = ({ treeTypeViewLabel }: FoodCategoryProps) => {

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

    // Handle preloader
    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        if (treeList) {
            setInitialized(true);
        }
    }, [treeList]);

    return <Screen initialized={initialized}>
        <Tree
            tree={treeList}
            setPage={setPage}
            setParentId={setParentId}
            component={item => <StatusEdit {...item} treeTypeViewLabel={treeTypeViewLabel} />}
        />
    </Screen>;
};
