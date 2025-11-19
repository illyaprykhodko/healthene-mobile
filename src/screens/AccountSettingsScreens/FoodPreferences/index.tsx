// outsource dependencies
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { TREE_TYPE } from 'constants/spec.ts';
import { CategoryItem, useGetAllCategoriesQuery } from 'store/api/categoryTreeApi.ts';
import { BreadcrumbItem, Breadcrumbs } from 'components/Breadcrumbs.tsx';

interface FoodPreferencesProps {
  // props here
}

const FoodPreferences = (props: FoodPreferencesProps) => {
    const theme = useTheme();
    // Request
    const [page, setPage] = useState<number>(0);
    const [parentId, setParentId] = useState<number | undefined>();
    const { data: treeList, isLoading } = useGetAllCategoriesQuery({
        params: { page },
        body: {
            parentId,
            treeTypeViewLabel: TREE_TYPE.DISLIKE,
        }
    });
    const loadMore = useCallback(() => {
        if (treeList && treeList.page < treeList.totalPages) {
            setPage(treeList.page + 1);
        }
    }, [treeList]);

    // Manage breadcrumbs
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ name: 'All', id: null },]);

    // Handle Item
    const onClickItem = useCallback((item: CategoryItem) => {
        setPage(0);
        setParentId(item.id);
    }, []);

    return <FlatList<CategoryItem>
        bounces={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        data={treeList?.data ?? []}
        showsVerticalScrollIndicator={false}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={<Breadcrumbs data={breadcrumbs} />}
        renderItem={({ item }: {item: CategoryItem}) => <Pressable onPress={() => onClickItem(item)} style={styles.itemContainer}>
            <Text>
                {item.name}
            </Text>
        </Pressable>}
    />;
};

export default FoodPreferences;

const styles = StyleSheet.create({
    container: {
    // style here
    },
    itemContainer: {
        paddingVertical: OFFSET.VERTICAL,
    }
});
