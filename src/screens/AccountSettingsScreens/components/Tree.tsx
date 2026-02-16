// outsource dependencies
import { skipToken } from '@reduxjs/toolkit/query';
import { useDispatch, useSelector } from 'react-redux';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';

// local dependencies
import { RootState } from 'store';
import Text from 'components/Text.tsx';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { TREE_TYPE } from 'constants/spec.ts';
import { setCategories } from 'store/slices/foodPreferrencesSlice.ts';
import { BreadcrumbItem, Breadcrumbs } from 'components/Breadcrumbs.tsx';
import { useGetPatientCategoriesQuery } from 'store/api/categoryTreeApi.ts';
import { CategoryItem, CategoryTransformData, TreeType } from 'types/categoryTree.ts';

interface TreeProps {
    treeTypeViewLabel: TreeType;
    tree: CategoryTransformData | undefined;
    setPage: (page: number) => void;
    setParentId: (id: number | undefined) => void;
    component: (
        item: CategoryItem,
    ) => React.ReactElement;
}

const defaultImage = require('../../../../assets/def-image.png');

export const Tree = ({ tree, setPage, setParentId, component, treeTypeViewLabel }: TreeProps) => {
    const theme = useTheme();
    const dispatch = useDispatch();

    // Get patient categories
    const user = useSelector((state: RootState) => state.app.user);
    const { data: categoryData } = useGetPatientCategoriesQuery(
        user?.id
            ? {
                body: {
                    treeTypeViewLabel,
                    patientId: user.id
                }
            }
            : skipToken
    );
    useEffect(() => {
        if (categoryData) {
            dispatch(setCategories(categoryData));
        }
    }, [categoryData]);

    // Manage tree
    const loadMore = useCallback(() => {
        if (tree && tree.page < tree.totalPages) {
            setPage(tree.page + 1);
        }
    }, [tree, setPage]);
    const handleTreeResponse = useCallback((id: number | undefined) => {
        setPage(0);
        setParentId(id);
    }, [setPage, setParentId]);

    // Manage breadcrumbs
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
        { name: 'All', id: undefined },
    ]);
    const handleBreadcrumbs = useCallback((item: BreadcrumbItem, index: number) => {
        setBreadcrumbs(prev => prev.slice(0, index + 1));
        handleTreeResponse(item?.id ?? undefined);
    }, [handleTreeResponse]);
    const onClickItem = useCallback((item: CategoryItem) => {
        setBreadcrumbs(prev => [...prev, { name: item.name, id: item.id }]);
        handleTreeResponse(item.id);
    }, [categoryData, breadcrumbs]);
    const returnBack = useCallback(() => {
        const prevIndex = breadcrumbs.length - 2;
        const prevItem = breadcrumbs[prevIndex];
        handleBreadcrumbs(prevItem, prevIndex);
    }, [breadcrumbs, handleBreadcrumbs]);

    return <FlatList<CategoryItem>
        bounces={false}
        data={tree?.data ?? []}
        onEndReached={loadMore}
        style={styles.container}
        onEndReachedThreshold={0.6}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.minHeight}
        keyExtractor={item => item.id.toString()}
        ListFooterComponent={() => <View style={styles.height} />}
        ListHeaderComponent={<Breadcrumbs onPress={handleBreadcrumbs} data={breadcrumbs} />}
        ItemSeparatorComponent={() => <View style={[styles.separator, { borderColor: theme.colors.lighterGrey }]} />}
        ListEmptyComponent={() => <View style={styles.emptyComponent}>
            <Pressable onPress={returnBack}>
                <Text variant="h2">
                    No nested items found ...
                </Text>
                <Text textAlign="center" variant="h4" color={theme.colors.primary}>
                    Press to go back
                </Text>
            </Pressable>
        </View>}
        renderItem={({ item }: {item: CategoryItem}) => <Pressable onPress={() => onClickItem(item)} style={styles.itemContainer}>
            <View style={styles.imageContainer}>
                <Image source={ item?.coverImage ? { uri: item.coverImage } : defaultImage } style={styles.image} />
            </View>
            <Text style={styles.flexShrink}>
                {item.name}
            </Text>
            {component(item)}
        </Pressable>}
    />;
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    separator: {
        borderWidth: 1
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: OFFSET.POINT * 2,
        paddingHorizontal: OFFSET.HORIZONTAL
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
    },
    emptyComponent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    minHeight: {
        minHeight: '100%'
    },
    height: {
        height: OFFSET.POINT * 4
    }
});
