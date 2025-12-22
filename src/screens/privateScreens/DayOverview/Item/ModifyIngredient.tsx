// outsource dependencies
import _ from 'lodash';
import Icon from '@react-native-vector-icons/fontawesome5';
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { OFFSET } from 'constants/offset';
import { COLORS } from 'constants/colors';
import Controls from 'components/Controls/index';
import ApproveButtons from 'components/ApproveButtons';
import { MODIFY_TYPES } from '../ModifyTypeIngredient';
import { Ingredient, IngredientWeight } from 'types/overview';
import { useRecalculateRecipeStepsMutation, useGetIngredientsBySiblingQuery } from 'store/api/dayOverviewApi';

interface ModifyIngredientProps {
    itemData: any;
    item: Ingredient;
    section?: string;
    isEditMode?: boolean;
    ingredients: Ingredient[];
    onUpdate?: (ingredient: Ingredient, steps?: any[]) => void;
}

const ModifyIngredient: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const params = route.params as ModifyIngredientProps;
    const initialIngredient = params?.item;
    const targetId = initialIngredient?.id;
    const itemData = params?.itemData;
    const allIngredients = params?.ingredients || [];
    const isEditMode = params?.isEditMode;
    const onUpdate = params?.onUpdate;

    const [recalculateSteps] = useRecalculateRecipeStepsMutation();

    const { data: modifyIngredients = [] } = useGetIngredientsBySiblingQuery(
        { id: initialIngredient?.id, useInPrototypes: false },
        { skip: !initialIngredient?.id }
    );

    const [ingredient, setIngredient] = useState<Ingredient>(initialIngredient);
    const [amount, setAmount] = useState(initialIngredient?.amount || 1);
    const [selectedWeight, setSelectedWeight] = useState<IngredientWeight | null>(null);
    // useEffect(() => {
    //     if (ingredient?.entity?.weights && ingredient.entity.weights.length > 0) {
    //         const defaultWeight = ingredient.entity.weights.find(w => w.isDefault || w.usedInRecipes)
    //             || ingredient.entity.weights[0];
    //         setSelectedWeight(defaultWeight);
    //     }
    // }, [ingredient]);
    useEffect(() => {
        const weights = ingredient?.entity?.weights || [];
        if (!weights.length) { return; }

        const defaultWeight
          = weights.find(w => w.usedInRecipes)
          || weights.find(w => w.isDefault)
          || weights[0];

        setSelectedWeight(defaultWeight);
    }, [ingredient?.entity?.id]);

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleSave = useCallback(async () => {
        const updatedIngredient = {
            // ...initialIngredient,
            ...ingredient,
            amount,
            weight: selectedWeight || ingredient.weight,
            modified: true
        };

        if (isEditMode && onUpdate) {
            onUpdate(updatedIngredient);
            navigation.goBack();
            return;
        }

        try {
            const preparedIngredients = allIngredients.map(elem => (
                elem?.id === targetId ? updatedIngredient : elem
            ));

            const recipeSteps = await recalculateSteps({
                ingredients: preparedIngredients,
                steps: itemData?.recipe?.steps || []
            }).unwrap();

            onUpdate?.(updatedIngredient, recipeSteps);
            navigation.goBack();
            return;
            // navigation.goBack();
            // navigation.navigate('EditFood', {
            //     id: itemData.id,
            //     recipe: {
            //         ...itemData.recipe,
            //         ingredients: preparedIngredients,
            //         steps: recipeSteps
            //     },
            //     isModify: true,
            //     section: params?.section,
            //     activeTab: 'INGREDIENTS'
            // });
            // navigation.navigate('Item', {
            //     id: itemData.id,
            //     recipe: {
            //         ...itemData.recipe,
            //         ingredients: preparedIngredients,
            //         steps: recipeSteps
            //     },
            //     isModify: true,
            //     section: params?.section,
            //     activeTab: 'INGREDIENTS'
            // });
        } catch (error) {
            console.error('Failed to recalculate steps:', error);
            navigation.goBack();
        }
    }, [ingredient, amount, selectedWeight, isEditMode, onUpdate, allIngredients, itemData, recalculateSteps, navigation, params, targetId]);

    const handleUpdateAmount = useCallback((newAmount: number) => {
        setAmount(Math.max(1, newAmount));
    }, []);

    const unit = _.get(
        _.find(ingredient?.entity?.weights, { usedInRecipes: true })
            || _.get(ingredient?.entity, 'weights.0'),
        'unit'
    ) || ingredient?.weight?.unit;

    const getCurrentUnit = () => {
        return selectedWeight?.unit?.name || unit?.name || 'unit';
    };

    const goToUnits = useCallback(() => {
        navigation.navigate('ModifyTypeIngredient', {
            modifyType: MODIFY_TYPES.UNIT,
            item: ingredient,
            onSelectUnit: (weight: IngredientWeight, item: Ingredient) => {
                setSelectedWeight(weight);
                setIngredient(prev => ({
                    ...prev,
                    weight,
                    entity: {
                        ...prev?.entity,
                        weights: (prev?.entity?.weights || []).map(w => {
                            if (w?.id === weight?.id) {
                                return { ...w, usedInRecipes: true };
                            }
                            return { ...w, usedInRecipes: false };
                        })
                    }
                } as Ingredient));
            }
        });
    }, [navigation, ingredient]);

    const goToIngredients = useCallback(() => {
        navigation.navigate('ModifyTypeIngredient', {
            modifyType: MODIFY_TYPES.INGREDIENT,
            item: ingredient,
            modifyIngredients,
            onSelectIngredient: (replacementIngredient: Ingredient, currentItem: Ingredient) => {
                const next = {
                    ...currentItem,
                    entity: replacementIngredient.entity,
                    weight: replacementIngredient.weight ?? currentItem.weight,
                    amount: replacementIngredient.amount ?? amount,
                    modified: true,
                };

                setIngredient(next);
                setSelectedWeight(null);
                setAmount(next.amount ?? 1);
            }
        });
    }, [navigation, ingredient, modifyIngredients]);

    const truncateText = (text: string, length: number = 15) => {
        if (!text) { return ''; }
        return text.length > length ? `${text.substring(0, length)}...` : text;
    };

    return (
        <Screen initialized style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Add item</Text>
            </View>

            <View style={styles.main}>
                <View style={styles.nameContainer}>
                    <Text
                        numberOfLines={2}
                        style={styles.itemName}
                    >
                        {ingredient?.entity?.name}
                    </Text>
                </View>

                <View style={styles.controlsWrapper}>
                    <Controls
                        amount={amount}
                        disabled={false}
                        updateData={handleUpdateAmount}
                    />
                </View>

                <ScrollView scrollEnabled={false}>
                    <View style={styles.unitViewContainer}>
                        <TouchableOpacity onPress={goToUnits} style={styles.unitTouchable}>
                            <Text style={styles.unitText}>{getCurrentUnit()}</Text>
                            <Icon iconStyle="solid" name="chevron-right" color={COLORS.BLACK} size={16} />
                        </TouchableOpacity>
                    </View>
                    {modifyIngredients?.length > 0 && (
                        <View style={styles.modifyIngredients}>
                            <TouchableOpacity onPress={goToIngredients} style={styles.unitTouchable}>
                                <Text style={styles.unitText}>
                                    {truncateText(ingredient?.entity?.name || '')}
                                </Text>
                                <Icon iconStyle="solid" name="chevron-right" color={COLORS.BLACK} size={16} />
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </View>

            <ApproveButtons
                handleBack={handleBack}
                handleSave={handleSave}
            />
        </Screen>
    );
};

export default ModifyIngredient;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 0,
        paddingRight: 0,
        backgroundColor: COLORS.WHITE,
    },
    header: {
        backgroundColor: '#E0EBF7',
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
        height: 65,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: OFFSET.VERTICAL,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '400',
        color: '#181818',
        textAlign: 'center',
    },
    main: {
        flex: 1,
    },
    nameContainer: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        justifyContent: 'center',
        paddingVertical: OFFSET.VERTICAL,
    },
    itemName: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        color: '#181818',
    },
    controlsWrapper: {
        marginVertical: OFFSET.VERTICAL * 3,
    },
    unitViewContainer: {
        alignItems: 'center',
    },
    unitTouchable: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: OFFSET.VERTICAL * 3,
        backgroundColor: '#E0EBF7',
        width: '100%',
        justifyContent: 'center',
    },
    unitText: {
        fontSize: 24,
        marginRight: 10,
        fontWeight: '500',
        textTransform: 'capitalize',
        color: COLORS.BLACK,
    },
    modifyIngredients: {
        paddingBottom: 5,
        opacity: 0.8,
        marginTop: 10,
        marginBottom: 30,
        alignItems: 'center',
    },
});

