// outsource dependencies
import { skipToken } from '@reduxjs/toolkit/query';
import { useSelector, useDispatch } from 'react-redux';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';

// local dependencies
import { RootState } from 'store';
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { TREE_TYPE } from 'constants/spec.ts';
import { setCategories } from 'store/slices/foodPreferrencesSlice.ts';
import { BreadcrumbItem, Breadcrumbs } from 'components/Breadcrumbs.tsx';
import { StatusEdit } from 'screens/AccountSettingsScreens/FoodPreferences/StatusEdit.tsx';
import { CategoryItem, useGetAllCategoriesQuery, useGetPatientCategoriesQuery } from 'store/api/categoryTreeApi.ts';
import Screen from 'components/Screen.tsx';


const FoodPreferences = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    // Get patient categories
    const user = useSelector((state: RootState) => state.app.user);
    const { data: categoryData } = useGetPatientCategoriesQuery(
        user?.id
            ? {
                body: {
                    patientId: user.id,
                    treeTypeViewLabel: TREE_TYPE.DISLIKE,
                }
            }
            : skipToken
    );
    useEffect(() => {
        if (categoryData) {
            dispatch(setCategories(categoryData));
        }
    }, [categoryData]);

    // Get list categories
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

    // Handle preloader
    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        if (treeList) {
            setInitialized(true);
        }
    }, [treeList]);

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
    }, [categoryData, breadcrumbs]);
    const returnBack = useCallback(() => {
        const prevIndex = breadcrumbs.length - 2;
        const prevItem = breadcrumbs[prevIndex];
        handleBreadcrumbs(prevItem, prevIndex);
    }, [breadcrumbs, handleBreadcrumbs]);

    return <Screen initialized={initialized}>
        <FlatList<CategoryItem>
            bounces={false}
            onEndReached={loadMore}
            style={styles.container}
            onEndReachedThreshold={0.6}
            data={treeList?.data ?? []}
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
                    <Image source={ item?.coverImage ? { uri: item.coverImage } : require('../../../../assets/def-image.png') } style={styles.image} />
                </View>
                <Text style={styles.flexShrink}>
                    {item.name}
                </Text>
                <StatusEdit {...item} />
            </Pressable>}
        />
    </Screen>;
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
    emptyComponent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    flexShrink: {
        flexShrink: 1
    },
    minHeight: {
        minHeight: '100%'
    },
    height: {
        height: OFFSET.POINT * 4
    }
});
