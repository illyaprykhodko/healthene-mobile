// outsource dependencies
import React, { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { TREE_TYPE } from 'constants/spec.ts';
import { BreadcrumbItem, Breadcrumbs } from 'components/Breadcrumbs.tsx';
import { CategoryItem, useGetAllCategoriesQuery } from 'store/api/categoryTreeApi.ts';

const FoodPreferences = () => {
    const theme = useTheme();
    // Request
    const [page, setPage] = useState<number>(0);
    const [parentId, setParentId] = useState<number | undefined>();
    const { data: treeList } = useGetAllCategoriesQuery({
        params: { page },
        body: {
            parentId,
            hasParent: Boolean(parentId),
            treeTypeViewLabel: TREE_TYPE.DISLIKE,
        }
    });
    const loadMore = useCallback(() => {
        if (treeList && treeList.page < treeList.totalPages) {
            setPage(treeList.page + 1);
        }
    }, [treeList]);
    const handleTreeResponse = useCallback((id: number | undefined) => {
        setPage(0);
        setParentId(id);
    }, []);

    // Manage breadcrumbs
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
        { name: 'All', id: undefined },
    ]);
    const handleBreadcrumbs = useCallback((item: BreadcrumbItem, index: number) => {
        setBreadcrumbs(prev => prev.slice(0, index + 1));
        handleTreeResponse(item.id);
    }, []);
    const onClickItem = useCallback((item: CategoryItem) => {
        setBreadcrumbs(prev => [...prev, { name: item.name, id: item.id }]);
        handleTreeResponse(item.id);
    }, []);

    return <FlatList<CategoryItem>
        bounces={false}
        onEndReached={loadMore}
        style={styles.container}
        onEndReachedThreshold={0.6}
        data={treeList?.data ?? []}
        showsVerticalScrollIndicator={false}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={<Breadcrumbs onPress={handleBreadcrumbs} data={breadcrumbs} />}
        ItemSeparatorComponent={() => <View style={[styles.separator, { borderColor: theme.colors.lighterGrey }]} />}
        renderItem={({ item }: {item: CategoryItem}) => <Pressable onPress={() => onClickItem(item)} style={styles.itemContainer}>
            <View style={styles.imageContainer}>
                <Image source={ item?.coverImage ? { uri: item.coverImage } : require('../../../../assets/def-image.png') } style={styles.image} />
            </View>
            <Text style={styles.flexShrink}>
                {`${item.name }`}
            </Text>
        </Pressable>}
    />;
};

export default FoodPreferences;

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: OFFSET.POINT * 2,
        paddingHorizontal: OFFSET.HORIZONTAL
    },
    separator: {
        borderWidth: 1
    },
    imageContainer: {
        width: 48,
        height: 48,
        marginRight: OFFSET.POINT * 2,
    },
    image: {
        width: '100%',
        height: '100%'
    },
    flexShrink: {
        flexShrink: 1
    }
});
