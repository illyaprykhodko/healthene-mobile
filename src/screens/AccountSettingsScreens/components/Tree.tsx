// outsource dependencies
import React, { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { BreadcrumbItem, Breadcrumbs } from 'components/Breadcrumbs.tsx';
import { CategoryItem, CategoryTransformData } from 'types/categoryTree.ts';

interface TreeProps {
    setPage: (page: number) => void;
    tree: CategoryTransformData | undefined;
    setParentId: (id: number | undefined) => void;
    component: (
        item: CategoryItem,
    ) => React.ReactElement;
}

const defaultImage = require('../../../../assets/def-image.png');

export const Tree = ({ tree, setPage, setParentId, component }: TreeProps) => {
    const theme = useTheme();

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
    }, [handleTreeResponse]);
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
        renderItem={({ item }: {item: CategoryItem}) => {
            const coverUri = typeof item?.coverImage === 'string'
                ? item.coverImage
                : item?.coverImage?.url;
            return <Pressable onPress={() => onClickItem(item)} style={styles.itemContainer}>
                <View style={styles.imageContainer}>
                    <Image source={coverUri ? { uri: coverUri } : defaultImage} style={styles.image} />
                </View>
                <Text style={styles.flexShrink}>
                    {item.name}
                </Text>
                {component(item)}
            </Pressable>;
        }}
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
