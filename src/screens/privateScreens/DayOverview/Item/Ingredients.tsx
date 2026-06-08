// outsource dependencies
import _ from 'lodash';
import Icon from '@react-native-vector-icons/fontawesome5';
import { SwipeListView } from 'react-native-swipe-list-view';
import React, { useState, useCallback, useEffect } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { View, StyleSheet, ScrollView, FlatList, TouchableOpacity, UIManager, LayoutAnimation, Platform } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { OFFSET } from 'constants/offset';
import { COLORS } from 'constants/colors';
import { TAG_TYPE } from 'constants/spec';
import { useTheme } from 'hooks/useTheme';
import DefImage from 'components/DefImage';
import { PhaseItem, Ingredient } from 'types/overview';
import ApproveButtons from 'components/ApproveButtons';
import { useUpdatePhaseItemMutation } from 'store/api/dayOverviewApi';
import { prepareIngredientNameWithUnit } from 'utils/ingredientUtils';

interface IngredientsProps {
    item: PhaseItem;
    disabled: boolean;
}

const Ingredients: React.FC<IngredientsProps> = ({ item, disabled }) => {
    const theme = useTheme();
    const route = useRoute<any>();
    const navigation = useNavigation<any>();

    const [updatePhaseItem] = useUpdatePhaseItemMutation();

    const { recipe } = item;
    const ingredients = recipe?.ingredients || [];
    const serving = recipe?.serving || null;
    const peopleEatingNumber = item.peopleEatingNumber || 1;
    const servingAmount = recipe?.servingAmount || item.amount || 1;
    const servingName = serving?.name || 'serving';

    const [localIngredients, setLocalIngredients] = useState<Ingredient[]>(ingredients);
    const [localRecipe, setLocalRecipe] = useState(recipe);

    useEffect(() => {
        setLocalIngredients(ingredients);
        setLocalRecipe(recipe);
    }, [ingredients, recipe]);

    // set LayoutAnimation for Android
    useEffect(() => {
        if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }, []);

    const handleDeleteIngredient = useCallback((ing: any) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newList = localIngredients.filter(i => i.id !== ing?.item?.id);
        setLocalIngredients(newList);
        if (localRecipe) {
            setLocalRecipe({
                ...localRecipe,
                ingredients: newList
            });
        }
    }, [localIngredients, localRecipe]);

    const handleNavigateToModifyIngredient = useCallback((ing: Ingredient) => {
        navigation.navigate('ModifyIngredient', {
            item: ing,
            itemData: item,
            ingredients: localIngredients,
            section: route.params?.section
        });
    }, [navigation, item, localIngredients, route]);

    const handleSave = useCallback(async () => {
        if (!localRecipe) {
            return;
        }
        try {
            await updatePhaseItem({
                id: item.id,
                phaseId: item.phase?.id,
                data: {
                    ...item,
                    recipe: {
                        ...localRecipe,
                        ingredients: localIngredients,
                        modified: true
                    } as any,
                },
            }).unwrap();
            navigation.goBack();
        } catch (error) {
            console.error('Failed to save recipe:', error);
        }
    }, [item, localRecipe, localIngredients, updatePhaseItem, navigation]);

    const handleCancel = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    // Check if this is a patient recipe (custom recipe)
    const isPatientRecipe = (item as any).entityType === TAG_TYPE.PATIENT_RECIPES
        || (item as any).type === 'CUSTOM_RECIPE'
        || (item.section && item.section.includes('Patient'));

    if (!recipe || !ingredients.length) {
        return (
            <View style={styles.emptyContainer}>
                <Text textAlign="center" style={{ color: theme.colors.textSecondary, fontSize: 16 }}>
                    No ingredients information available
                </Text>
            </View>
        );
    }

    if (isPatientRecipe) {
        return (
            <View style={styles.container}>
                <Text textAlign="center" style={[styles.title, { fontSize: 24, fontWeight: '700', color: theme.colors.text }]}>
                    {recipe.name}
                </Text>

                <View style={styles.infoGroup}>
                    <Text style={styles.servings}>
                        Servings: {servingAmount} {servingName}
                    </Text>
                </View>

                <Text style={[styles.subtitle, { fontSize: 18, color: theme.colors.text }]}>Ingredients:</Text>

                <ScrollView contentContainerStyle={styles.scroller}>
                    {localIngredients.length === 0 ? (
                        <Text textAlign="center" style={styles.emptyScreen}>
                            No items found
                        </Text>
                    ) : (
                        <SwipeListView
                            useFlatList
                            closeOnScroll
                            disableRightSwipe
                            rightOpenValue={-75}
                            data={localIngredients}
                            recalculateHiddenLayout
                            keyExtractor={i => String(i?.id)}
                            renderHiddenItem={i => (
                                <TouchableOpacity
                                    style={styles.listItemBtnReplace}
                                    onPress={() => handleDeleteIngredient(i)}
                                >
                                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                        <Icon
                                            size={18}
                                            name="trash-alt"
                                            color={COLORS.BLACK}
                                            style={{ marginRight: 5 }}
                                        />
                                        <Text style={styles.buttonText}>Delete</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            renderItem={({ item: ing }) => (
                                <View style={[styles.listItemWrapper, { backgroundColor: theme.colors.background }]}>
                                    <View style={styles.listItem}>
                                        <View style={styles.main}>
                                            <TouchableOpacity
                                                onPress={() => handleNavigateToModifyIngredient(ing)}
                                                style={{ marginHorizontal: OFFSET.HORIZONTAL }}
                                            >
                                                <View style={styles.recipeContainer}>
                                                    <DefImage
                                                        style={styles.itemImage}
                                                        src={_.get(ing, 'entity.coverImage.url')}
                                                    />
                                                    <View style={[styles.offset, styles.main]}>
                                                        <Text
                                                            variant="h6"
                                                            numberOfLines={2}
                                                            style={[styles.offset, { color: theme.colors.text, fontSize: 14 }]}
                                                        >
                                                            {prepareIngredientNameWithUnit({
                                                                ingredient: ing,
                                                                peopleEatingNumber,
                                                                amount: _.get(ing, 'amount'),
                                                            })}
                                                        </Text>
                                                        {ing?.modified && (
                                                            <Text style={[styles.offset, { fontSize: 12, color: theme.colors.textSecondary }]}>
                                                                edited by me
                                                            </Text>
                                                        )}
                                                    </View>
                                                    <View style={styles.checkboxContainer}>
                                                        <Icon iconStyle="solid" name="chevron-right" color={theme.colors.textSecondary} size={14} />
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            )}
                            onRowOpen={(rowKey, rowMap) => {
                                setTimeout(() => {
                                    rowMap[rowKey] && rowMap[rowKey].closeRow();
                                }, 10 * 1000);
                            }}
                        />
                    )}
                </ScrollView>

                <ApproveButtons
                    handleBack={handleCancel}
                    handleSave={handleSave}
                />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, disabled && styles.disabledOpacity]}>
            <Text textAlign="center" style={[styles.title, { fontSize: 24, fontWeight: '700', color: theme.colors.text }]}>
                {recipe.name}
            </Text>

            <View style={styles.infoGroup}>
                <Text style={styles.servings}>
                    Servings: {servingAmount} {servingName}
                </Text>
            </View>

            <Text style={[styles.subtitle, { fontSize: 18, color: theme.colors.text }]}>Ingredients:</Text>

            <FlatList
                scrollEnabled={false}
                data={ingredients}
                keyExtractor={(ing, index) => String(ing?.id || index)}
                renderItem={({ item: ing }) => (
                    <View style={styles.ingredientItem}>
                        <Text style={styles.listItmDot}>•</Text>
                        <Text variant="h4" style={styles.ingredientText}>
                            {prepareIngredientNameWithUnit({
                                ingredient: ing,
                                peopleEatingNumber,
                                amount: _.get(ing, 'amount'),
                            })}
                        </Text>
                    </View>
                )}
            />
        </ScrollView>
    );
};

export default Ingredients;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        marginTop: OFFSET.VERTICAL,
        marginBottom: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    infoGroup: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
        marginBottom: OFFSET.VERTICAL,
    },
    servings: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2978A0',
    },
    subtitle: {
        fontWeight: '700',
        borderBottomWidth: 1,
        paddingBottom: OFFSET.VERTICAL,
        borderBottomColor: '#D9D9D9',
        fontSize: 14,
        paddingHorizontal: OFFSET.HORIZONTAL,
        marginBottom: OFFSET.VERTICAL,
    },
    scroller: {
        flexGrow: 1,
    },
    emptyScreen: {
        marginTop: OFFSET.VERTICAL,
        color: COLORS.GREY,
    },
    // For editable ingredients (patient recipes)
    listItemWrapper: {
        borderRightWidth: 7,
        borderRightColor: '#8EF9F3',
    },
    listItem: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    main: {
        flex: 1,
    },
    recipeContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingVertical: 12,
    },
    itemImage: {
        width: 40,
        height: 40,
    },
    offset: {
        paddingLeft: OFFSET.HORIZONTAL,
        paddingRight: OFFSET.HORIZONTAL,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 5,
    },
    listItemBtnReplace: {
        backgroundColor: '#8EF9F3',
        height: '100%',
        width: 75,
        paddingRight: OFFSET.HORIZONTAL,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        alignSelf: 'flex-end',
    },
    buttonText: {
        color: COLORS.BLACK,
        fontSize: 12,
    },
    // For read-only ingredients
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    listItmDot: {
        fontSize: 22,
        lineHeight: 26,
        paddingRight: 5,
        paddingLeft: OFFSET.HORIZONTAL,
    },
    ingredientText: {
        lineHeight: 24,
        flex: 1,
        paddingRight: OFFSET.HORIZONTAL,
    },
    disabledOpacity: {
        opacity: 0.4,
    },
});
