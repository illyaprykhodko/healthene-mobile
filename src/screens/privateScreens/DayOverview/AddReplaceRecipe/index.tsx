// outsource dependencies
import _ from 'lodash';
import React, { useCallback, useState, useMemo } from 'react';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, FlatList, View, TouchableOpacity, ActivityIndicator } from 'react-native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { Button } from 'components/Button';
import DefImage from 'components/DefImage';
import Checkbox from 'components/Checkbox';
import { CONTENT_TYPE } from 'constants/spec';
import IngredientsView from 'components/IngredientsView';
import { RootStackParamList } from 'services/navigation';
import ConfirmationReplaceModal from 'components/modals/ConfirmationReplaceModal';
import { useGetRecipeCategoryTreeQuery, useGetRecipeCategoryItemsQuery, useReplaceRecipeItemMutation } from 'store/api/dayOverviewApi';

interface RecipeItem {
    id: number;
    name: string;
    coverImage?: {
        url: string;
    };
    ingredients?: any[];
    list?: RecipeItem[];
    contentType?: string;
}

const AddReplaceRecipe: React.FC = () => {
    const theme = useTheme();
    const route = useRoute<any>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const { date, title, entityType, prevItem, categoryList, categoryName, categoryId } = route.params as any;

    const [selected, setSelected] = useState<RecipeItem | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const isShowingCategories = !categoryId;

    const { data: categoryTree, isLoading: isLoadingTree } = useGetRecipeCategoryTreeQuery(
        prevItem?.recipe?.id,
        { skip: !prevItem?.recipe?.id || !isShowingCategories }
    );

    const { data: categoryItems, isLoading: isLoadingItems } = useGetRecipeCategoryItemsQuery(
        { recipeId: prevItem?.recipe?.id, categoryId },
        { skip: !prevItem?.recipe?.id || !categoryId || !!categoryList }
    );

    const [replaceRecipe, { isLoading: isReplacing }] = useReplaceRecipeItemMutation();

    const isLoading = isLoadingTree || isLoadingItems;

    const list = useMemo(() => {
        if (categoryList) {
            return categoryList;
        }

        if (Array.isArray(categoryItems)) {
            return categoryItems;
        }

        if (!categoryTree) { return []; }

        const initialAcc = {
            [CONTENT_TYPE.FROZEN]: [],
            [CONTENT_TYPE.ANOTHER]: [],
            [CONTENT_TYPE.RESTAURANT]: [],
        };

        const extractedDataByContentType = (categoryTree ?? []).reduce((acc: any, item: any) => {
            const key = item?.contentType;
            if (key in initialAcc) {
                const itemList = Array.isArray(item?.list)
                    ? [...item.list].sort((a: any, b: any) => (a?.name || '').localeCompare(b?.name || ''))
                    : [];
                acc[key] = acc[key].concat(itemList);
            }
            return acc;
        }, { ...initialAcc });

        const {
            [CONTENT_TYPE.ANOTHER]: anotherList = [],
            [CONTENT_TYPE.FROZEN]: frozenList = [],
        } = extractedDataByContentType ?? {};

        return [...anotherList, ...frozenList];
    }, [categoryTree, categoryList, categoryItems]);

    const handleSelectItem = useCallback((item: RecipeItem) => {
        setSelected(selected?.id === item.id ? null : item);
    }, [selected]);

    const handleReplace = useCallback(() => {
        if (!selected) { return; }
        setShowConfirmModal(true);
    }, [selected]);

    const handleConfirmReplace = useCallback(async ({ prevItem, nextItem }: { prevItem: any; nextItem: any }) => {
        try {
            await replaceRecipe({
                phaseItemId: prevItem.id,
                data: {
                    id: prevItem.id,
                    replacement: { id: nextItem.id },
                },
            }).unwrap();

            // popTo (not navigate): return to the existing Edit screen and drop every
            // replacement screen left above it in the stack, so Back from Edit goes to
            // Day Overview instead of back into the replacement catalog.
            navigation.popTo(ROUTES.EDIT, {
                phaseId: route.params?.phaseId || prevItem.phaseId,
                isToast: true,
            }, { merge: true });
        } catch (error) {
            console.error('Error replacing recipe:', error);
        }
    }, [replaceRecipe, navigation, date, route.params]);

    const handleNavigateToCategory = useCallback((item: RecipeItem) => {
        navigation.push(ROUTES.ADD_REPLACE_RECIPE, {
            date,
            title,
            prevItem,
            entityType,
            categoryId: item.id,
            categoryName: item.name,
            phaseId: route.params?.phaseId,
            categoryList: item.list || undefined, // Pass list if available (optional)
        });
    }, [navigation, date, title, entityType, prevItem, route.params]);

    const renderItem = useCallback(({ item }: { item: RecipeItem }) => {
        const isSelected = selected?.id === item.id;
        const anySelected = !!selected;
        const isInactive = anySelected && !isSelected;
        const isItemCategory = isShowingCategories;

        return (
            <View style={[styles.listItem, isInactive && { opacity: 0.5 }]}>
                <TouchableOpacity
                    disabled={isInactive}
                    onPress={() => (isItemCategory ? handleNavigateToCategory(item) : handleSelectItem(item))}
                    style={styles.itemRow}
                >
                    <DefImage
                        src={item.coverImage?.url}
                        style={styles.image}
                    />
                    <View style={styles.titleWrapper}>
                        <Text variant="h6" style={[styles.itemName, { color: theme.colors.text }]}>
                            {item.name}
                        </Text>
                    </View>
                    {isItemCategory ? (
                        <View style={styles.iconContainer}>
                            <Icon
                                name="chevron-forward-outline"
                                size={24}
                                color={theme.colors.textSecondary}
                            />
                        </View>
                    ) : (
                        <Checkbox
                            size={18}
                            value={isSelected}
                            editable={!isInactive}
                            onChange={() => handleSelectItem(item)}
                        />
                    )}
                </TouchableOpacity>
                {!isItemCategory && (
                    <View style={styles.ingredientsWrapper}>
                        <IngredientsView ingredients={item.ingredients || []} />
                    </View>
                )}
            </View>
        );
    }, [selected, theme, isShowingCategories, handleSelectItem, handleNavigateToCategory]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <Screen initialized style={styles.container}>
            <View style={[styles.header, { backgroundColor: theme.colors.surfaceAlt }]}>
                <Text textAlign="center" style={[styles.headerText, { color: theme.colors.text }]}>
                    Replacement Options
                </Text>
            </View>

            {!_.isEmpty(list) ? (
                <>
                    <FlatList
                        data={list}
                        initialNumToRender={10}
                        onEndReachedThreshold={0.5}
                        keyExtractor={({ id }) => String(id)}
                        renderItem={renderItem}
                    />
                    {!isShowingCategories && (
                        <Button
                            title="REPLACE"
                            onPress={handleReplace}
                            disabled={!selected || isReplacing}
                            textStyle={{
                                color: !selected ? '#888888' : '#4E733C',
                                fontWeight: '700',
                            }}
                            style={[
                                styles.doneBtn,
                                !selected ? styles.disabled : styles.enabled,
                            ] as any}
                        />
                    )}
                </>
            ) : (
                <Text
                    textAlign="center"
                    color={theme.colors.grey}
                    style={styles.emptyScreen}
                >
                    No meal replacement was found
                </Text>
            )}

            <ConfirmationReplaceModal
                visible={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onApply={handleConfirmReplace}
                prevItem={prevItem}
                nextItem={selected}
            />
        </Screen>
    );
};

export default AddReplaceRecipe;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 0,
        paddingRight: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    headerText: {
        fontSize: 15,
        fontWeight: '500',
    },
    listItem: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E0E0E0',
        paddingVertical: 20,
        paddingLeft: 20,
        paddingRight: 10,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    titleWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        flex: 1,
    },
    itemName: {
        marginLeft: 20,
        flexShrink: 1,
        width: '75%',
        fontSize: 18,
        fontWeight: '400',
    },
    image: {
        width: 48,
        height: 48,
    },
    iconContainer: {
        marginLeft: 'auto',
        marginRight: 12,
    },
    ingredientsWrapper: {
        width: '100%',
    },
    doneBtn: {
        marginHorizontal: 24,
        borderWidth: 0,
        marginBottom: 15,
        borderRadius: 24,
        paddingVertical: 16,
    },
    enabled: {
        backgroundColor: '#96E072',
    },
    disabled: {
        backgroundColor: '#EEEEEE',
    },
    emptyScreen: {
        marginTop: 24,
    },
});
