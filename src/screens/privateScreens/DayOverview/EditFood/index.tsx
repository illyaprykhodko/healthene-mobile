// outsource dependencies
import _ from 'lodash';
import Icon from '@react-native-vector-icons/fontawesome5';
import { SwipeListView } from 'react-native-swipe-list-view';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, StyleSheet, TouchableOpacity, Image, FlatList, UIManager, LayoutAnimation, Platform } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { useAppSelector } from 'store';
import Screen from 'components/Screen';
import { OFFSET } from 'constants/offset';
import { COLORS } from 'constants/colors';
import { useTheme } from 'hooks/useTheme';
import DefImage from 'components/DefImage';
import { humanize } from 'services/filter';
import Controls from 'components/Controls';
import { CATALOG_TAG_TYPE } from 'constants/spec';
import { AnytimeMenu } from 'components/AnytimeMenu';
import ApproveButtons from 'components/ApproveButtons';
import AnimatedDropdown from 'components/AnimatedDropdown';
import { selectDayOverview } from 'store/slices/dayOverviewSlice';
import { prepareIngredientNameWithUnit } from 'utils/ingredientUtils';
import { useGetRecipePrototypeQuery } from 'store/api/dayOverviewApi';

interface Weight {
    id: number;
    unit: {
        id: number;
        name: string;
        singularName: string;
        pluralName: string;
    };
    amount: number;
    isDefault?: boolean;
    usedInRecipes?: boolean;
}

interface Ingredient {
    id: number;
    amount: number;
    entity?: {
        id: number;
        name: string;
        coverImage?: {
            url: string;
        };
    };
    weight?: any;
    modified?: boolean;
}

interface FoodItem {
    id: number;
    name: string;
    type?: string;
    amount?: number;
    modified?: boolean;
    coverImage?: {
        url?: string;
    };
    weights?: Weight[];
    serving?: {
        id: number;
        name: string;
        singularName: string;
        pluralName: string;
    };
    ingredients?: Ingredient[];
    recipe?: {
        id: number;
        name: string;
        ingredients?: Ingredient[];
        serving?: any;
        steps?: any[];
    };
}

interface EditFoodRouteParams {
    item: FoodItem;
    date?: string;
    onApply?: (data: any) => void;
    prevItem?: any;
    entityType?: string;
    substanceType?: string;
}

const EDIT_FOOD_TABS = {
    OVERVIEW: 'OVERVIEW',
    INGREDIENTS: 'INGREDIENTS',
    RECIPE: 'RECIPE',
};

interface UnitsViewProps {
    unit: string;
    unitsList: Array<{ id: number; unitName: string }>;
    handleUnit: (id: number) => void;
}

const UnitsView: React.FC<UnitsViewProps> = ({ unit, unitsList, handleUnit }) => {
    return (
        <View style={styles.unitsContainer}>
            <View style={styles.unitViewContainer}>
                <AnimatedDropdown
                    maxHeight={150}
                    valueLabel={unit}
                    options={(unitsList || []).map(item => ({
                        id: item.id,
                        label: item.unitName,
                    }))}
                    onSelect={option => handleUnit(Number(option.id))}
                    triggerTextStyle={styles.unitText}
                />
            </View>
        </View>
    );
};

export const EditFood: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const params = route.params as EditFoodRouteParams;
    const initialItem = params?.item;
    const onApply = params?.onApply;
    const entityType = params?.entityType;
    const prevItem = params?.prevItem;
    const substanceType = params?.substanceType;
    const [item, setItem] = useState<FoodItem>({ ...initialItem, amount: initialItem?.amount || 1 });
    const [amount, setAmount] = useState(initialItem?.amount || 1);
    const [activeTab, setActiveTab] = useState(EDIT_FOOD_TABS.OVERVIEW);
    const [localIngredients, setLocalIngredients] = useState<Ingredient[]>(initialItem?.recipe?.ingredients || []);
    const dayOverviewState = useAppSelector(selectDayOverview);
    const isRecipe = entityType === CATALOG_TAG_TYPE.PATIENT_RECIPES || entityType === CATALOG_TAG_TYPE.RESTAURANT;

    const shouldLoadRecipe = isRecipe && !initialItem?.recipe?.ingredients;
    const { data: recipeData } = useGetRecipePrototypeQuery(initialItem?.id, {
        skip: !shouldLoadRecipe,
    });

    // set LayoutAnimation for Android
    useEffect(() => {
        if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }, []);

    useEffect(() => {
        if (initialItem?.recipe?.ingredients) {
            setLocalIngredients(initialItem.recipe.ingredients);
        }
    }, [initialItem]);

    useEffect(() => {
        if (recipeData && isRecipe) {
            setItem(prev => ({
                ...prev,
                recipe: recipeData,
                // ingredients: recipeData.ingredients,
            }));
            setLocalIngredients(recipeData.ingredients || []);
        }
    }, [recipeData, isRecipe]);

    const weights = (item?.weights || []).map(w => ({
        id: w.id,
        unitName: w.unit?.name || ''
    }));

    const getCurrentUnit = () => {
        if (isRecipe && item?.serving) {
            return item.serving.name || 'Serving';
        }
        const defaultWeight = item?.weights?.find(w => w.isDefault) || item?.weights?.[0];
        return defaultWeight?.unit?.name || 'Serving';
    };

    const handleUnit = useCallback((id: number) => {
        if (!item?.weights) {
            return;
        }

        setItem({
            ...item,
            weights: item.weights.map(w => (
                w.id === id
                    ? { ...w, isDefault: true }
                    : { ...w, isDefault: false }
            ))
        });
    }, [item]);

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleSave = useCallback(() => {
        // const initialWeightId = initialItem?.weights?.find(w => w.isDefault)?.id;
        // const currentWeightId = item?.weights?.find(w => w.isDefault)?.id;
        // const isWeightChanged = initialWeightId !== currentWeightId;
        // const modified = isWeightChanged || (amount > (initialItem?.amount || 1) || localIngredients.some(ing => ing?.modified));
        const modified = localIngredients.some(ing => ing?.modified);
        if (onApply) {
            const updatedItem = entityType === CATALOG_TAG_TYPE.RESTAURANT
                ? {
                    amount,
                    recipe: {
                        ...item,
                        ingredients: localIngredients
                    },
                    modified
                }
                : {
                    ...item,
                    amount,
                    ...(isRecipe && item.recipe && {
                        recipe: {
                            ...item.recipe,
                            ingredients: localIngredients
                        }
                    }),
                    modified
                };
            onApply({
                item: updatedItem,
                // item,
                prevItem,
                substanceType,
                entityType
            });
        }
        navigation.goBack();
        setTimeout(() => navigation.goBack(), 100);
    }, [
        item,
        amount,
        onApply,
        prevItem,
        isRecipe,
        entityType,
        navigation,
        substanceType,
        localIngredients,
    ]);

    const handleUpdateAmount = useCallback((newAmount: number) => {
        setAmount(newAmount);
        // setItem(prev => ({ ...prev, amount: newAmount }));
        setItem(prev => ({ ...prev, recipe: { ...prev.recipe, servingAmount: newAmount } as any, amount: newAmount, initialAmount: newAmount }));
    }, []);

    const handleDeleteIngredient = useCallback((ing: any) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newList = localIngredients.filter(i => i.id !== ing?.item?.id);
        setLocalIngredients(newList);
    }, [localIngredients]);

    const handleNavigateToModifyIngredient = useCallback((ing: Ingredient) => {
        navigation.navigate('ModifyIngredient', {
            item: ing,
            itemData: item,
            // isEditMode: true,
            ingredients: localIngredients,
            onUpdate: (updatedIngredient: Ingredient, steps: any[]) => {
                // steps && setItem(prev => ({ ...prev, recipe: { ...prev.recipe, steps } }));
                if (Array.isArray(steps)) {
                    setItem(prev => {
                        if (!prev.recipe) { return prev; }
                        return {
                            ...prev,
                            recipe: {
                                ...prev.recipe,
                                steps,
                            },
                        };
                    });
                }
                setLocalIngredients(prev =>
                    prev.map(i => (i.id === updatedIngredient.id ? updatedIngredient : i)));
            }
        });
    }, [
        item,
        navigation,
        localIngredients
    ]);

    const renderOverviewTab = () => (
        <View
            style={[styles.main, !isRecipe && { marginTop: OFFSET.VERTICAL / 2 }]}
            // contentContainerStyle={styles.overviewContent}
            // showsVerticalScrollIndicator={false}
        >
            <View style={styles.nameContainer}>
                <Text
                    numberOfLines={2}
                    style={styles.itemName}
                >
                    {item?.name}
                </Text>
            </View>
            <View style={styles.imageContainer}>
                <DefImage
                    style={styles.image}
                    src={item?.coverImage?.url}
                />
            </View>
            <View style={styles.controlsWrapper}>
                <Controls
                    amount={amount}
                    disabled={false}
                    updateData={handleUpdateAmount}
                />
            </View>
            {weights.length > 0
            && <UnitsView
                unitsList={weights}
                unit={getCurrentUnit()}
                handleUnit={handleUnit}
            />}
            {/* <View style={styles.bottomPadding} /> */}
        </View>
    );

    const renderIngredientsTab = () => (
        <View style={styles.ingredientsTab}>
            {localIngredients.length === 0 ? (
                <Text textAlign="center" style={styles.emptyScreen}>
                    No items found
                </Text>
            ) : (
                <SwipeListView
                    // ListHeaderComponent={() => (
                    //     <View>
                    //         <Text textAlign="center" style={[styles.title, { fontSize: 24, fontWeight: '700', color: theme.colors.text }]}>
                    //             {item?.name}
                    //         </Text>

                    //         <View style={styles.infoGroup}>
                    //             <Text style={styles.servings}>
                    //                 Servings: {amount} {getCurrentUnit()}
                    //             </Text>
                    //         </View>

                    //         <Text style={[styles.subtitle, { fontSize: 18, color: COLORS.BLACK }]}>Ingredients:</Text>
                    //     </View>
                    // )}
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
                                    style={{ marginRight: 5 }}
                                    color={COLORS.BLACK}
                                    name="trash-alt"
                                    size={18}
                                />
                                <Text style={styles.buttonText}>Delete</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    renderItem={({ item: ing }) => (
                        <View style={[styles.listItemWrapper, { backgroundColor: theme.colors.background }]}>
                            <View style={styles.listItem}>
                                <View style={styles.mainIngredient}>
                                    <TouchableOpacity
                                        onPress={() => handleNavigateToModifyIngredient(ing)}
                                        style={{ marginHorizontal: OFFSET.HORIZONTAL }}
                                    >
                                        <View style={styles.recipeContainer}>
                                            <DefImage
                                                style={styles.itemImage}
                                                src={_.get(ing, 'entity.coverImage.url')}
                                            />
                                            <View style={[styles.offset, styles.mainIngredient]}>
                                                <Text
                                                    variant="h6"
                                                    numberOfLines={2}
                                                    style={[styles.offset, { color: theme.colors.text, fontSize: 14 }]}
                                                >
                                                    {prepareIngredientNameWithUnit({
                                                        ingredient: ing,
                                                        peopleEatingNumber: 1,
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
        </View>
    );


    // const renderRecipeTab = () => (
    //     <ScrollView style={styles.recipeTab}>
    //         <Text textAlign="center" style={[styles.title, { fontSize: 24, fontWeight: '700', color: theme.colors.text }]}>
    //             {item?.name}
    //         </Text>
    //         {item?.recipe?.steps && item.recipe.steps.length > 0 ? (
    //             <FlatList
    //                 scrollEnabled={false}
    //                 data={item.recipe.steps}
    //                 keyExtractor={(step, index) => String(index)}
    //                 renderItem={({ item: step, index }) => (
    //                     <View style={styles.stepItem}>
    //                         <Text style={styles.stepNumber}>{index + 1}.</Text>
    //                         <Text style={styles.stepText}>{step}</Text>
    //                     </View>
    //                 )}
    //             />
    //         ) : (
    //             <Text textAlign="center" style={{ color: COLORS.GREY, marginTop: 20 }}>
    //                 No recipe steps available
    //             </Text>
    //         )}
    //     </ScrollView>
    // );

    const renderRecipeTab = () => {
        const steps = item?.recipe?.steps || [];
        const sortedSteps = [...steps].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

        return (
            <View style={styles.recipeTab}>
                {sortedSteps.length > 0 ? (
                    <FlatList
                        data={sortedSteps}
                        keyExtractor={(step: any, index) => String(step.id || index)}
                        ListHeaderComponent={() => (
                            <Text textAlign="center" style={[styles.title, { fontSize: 24, fontWeight: '700', color: theme.colors.text }]}>
                                {item?.name}
                            </Text>
                        )}
                        renderItem={({ item: step, index }: { item: any; index: number }) => (
                            <View style={styles.stepItem}>
                                <Text style={styles.stepNumber}>{index + 1}.</Text>
                                <Text style={styles.stepText}>{step.content || step.unparsedContent || ''}</Text>
                            </View>
                        )}
                    />
                ) : (
                    <View>
                        <Text textAlign="center" style={[styles.title, { fontSize: 24, fontWeight: '700', color: theme.colors.text }]}>
                            {item?.name}
                        </Text>
                        <Text textAlign="center" style={{ color: theme.colors.textSecondary, marginTop: 20 }}>
                            No recipe steps available
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    const renderTabs = () => {
        if (!isRecipe && entityType !== CATALOG_TAG_TYPE.RESTAURANT) {
            return null;
        }

        const tabs = Object.values(EDIT_FOOD_TABS).map(tab => ({
            label: humanize(tab),
            value: tab,
        }));

        return (
            <View style={styles.tabsRow}>
                {tabs.map((tab, index) => {
                    const isActive = activeTab === tab.value;
                    return (
                        <TouchableOpacity
                            key={tab.value}
                            style={[
                                styles.tabButton,
                                isActive && styles.activeTabButton,
                                { borderRightWidth: tabs.length === index + 1 ? 0 : 2 },
                                { backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceAlt },
                            ]}
                            onPress={() => setActiveTab(tab.value)}
                        >
                            <Text
                                style={[styles.tabText, ...(isActive ? [styles.activeTabText] : []),]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    const renderBody = () => {
        if (!isRecipe && entityType !== CATALOG_TAG_TYPE.RESTAURANT) {
            return renderOverviewTab();
        }

        switch (activeTab) {
            case EDIT_FOOD_TABS.OVERVIEW:
                return renderOverviewTab();
            case EDIT_FOOD_TABS.INGREDIENTS:
                return renderIngredientsTab();
            case EDIT_FOOD_TABS.RECIPE:
                return renderRecipeTab();
            default:
                return renderOverviewTab();
        }
    };
    return (
        <Screen initialized style={styles.container}>
            {/* <View style={styles.header}>
                <Text style={styles.headerTitle}>Add item</Text>
            </View> */}

            {renderTabs()}
            {activeTab === EDIT_FOOD_TABS.INGREDIENTS
                ? <View>
                    <Text textAlign="center" style={[styles.title, { fontSize: 24, fontWeight: '700', color: theme.colors.text }]}>
                        {item?.name}
                    </Text>

                    <View style={styles.infoGroup}>
                        <Text style={styles.servings}>
                                    Servings: {amount} {getCurrentUnit()}
                        </Text>
                    </View>

                    <Text style={[styles.subtitle, { fontSize: 18 }]}>Ingredients:</Text>
                </View>
                : null}
            {renderBody()}
            <View style={styles.approveButtons}>
                <ApproveButtons
                    handleBack={handleBack}
                    handleSave={handleSave}
                />
            </View>
            <AnytimeMenu date={dayOverviewState.date} />
        </Screen>
    );
};

export default EditFood;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: OFFSET.VERTICAL,
    },
    header: {
        backgroundColor: '#E0EBF7',
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
        // height: 65,
        justifyContent: 'center',
        alignItems: 'center',
        // marginBottom: OFFSET.VERTICAL,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '400',
        color: '#181818',
    },
    // Tabs
    tabsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: OFFSET.HORIZONTAL,
        marginVertical: OFFSET.VERTICAL,
        borderWidth: 2,
        borderColor: '#156F93',
        borderRadius: 8,
        overflow: 'hidden',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 15,
        backgroundColor: COLORS.LIGHT_GREY,
        alignItems: 'center',
        borderRightColor: '#156F93',
    },
    activeTabButton: {
        backgroundColor: COLORS.BLUE,
    },
    tabText: {
        fontWeight: '500',
        fontSize: 15.5,
    },
    activeTabText: {
        color: COLORS.WHITE,
        fontWeight: '600',
    },
    main: {
        flex: 1,
    },
    overviewContent: {
        paddingBottom: 20,
    },
    bottomPadding: {
        height: 100,
    },
    nameContainer: {
        marginBottom: OFFSET.VERTICAL,
    },
    itemName: {
        fontSize: 32,
        fontWeight: '700',
        paddingHorizontal: OFFSET.HORIZONTAL,
        textAlign: 'center',
    },
    imageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: OFFSET.VERTICAL,
    },
    image: {
        width: 200,
        height: 200,
    },
    controlsWrapper: {
        marginBottom: OFFSET.VERTICAL,
    },
    // UnitsView styles
    unitsContainer: {
        marginTop: OFFSET.VERTICAL,
    },
    unitViewContainer: {
        alignItems: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL * 2,
    },
    unitText: {
        fontSize: 18,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    // Ingredients tab
    ingredientsTab: {
        flex: 1,
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
        // paddingVertical: OFFSET.VERTICAL,
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
        // marginBottom: OFFSET.VERTICAL,
    },
    emptyScreen: {
        marginTop: OFFSET.VERTICAL,
        color: COLORS.GREY,
    },
    listItemWrapper: {},
    listItem: {
        alignItems: 'center',
        flexDirection: 'row',
        borderRightColor: '#8EF9F3',
        borderRightWidth: 7,
        borderBottomWidth: 1,
        borderBottomColor: '#E9E9E9',
    },
    mainIngredient: {
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
        // paddingRight: OFFSET.HORIZONTAL,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        alignSelf: 'flex-end',
    },
    buttonText: {
        color: COLORS.BLACK,
        fontSize: 12,
    },
    // Recipe tab
    recipeTab: {
        flex: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    stepItem: {
        flexDirection: 'row',
        marginBottom: OFFSET.VERTICAL,
    },
    stepNumber: {
        fontSize: 16,
        fontWeight: '700',
        marginRight: 10,
    },
    stepText: {
        flex: 1,
        fontSize: 16,
    },
    approveButtons: {
        marginHorizontal: OFFSET.HORIZONTAL,
        // backgroundColor: 'rgba(255,255,255,0.85)'
    },
});
