// outsource dependencies
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
// local dependencies
import Text from '../../../../components/Text';
import { COLORS } from '../../../../constants/colors';

// Temporary constants until full migration
const PHASE_ITEM_STATUS = {
    DONE: 'DONE',
    PENDING: 'PENDING',
    DID_NOT_EAT: 'DID_NOT_EAT',
};

const ENTITY_TYPE = {
    FOOD: 'FOOD',
    RECIPE: 'RECIPE',
    CUSTOM_RECIPE: 'CUSTOM_RECIPE',
    INGREDIENTS: 'INGREDIENTS',
};

interface ListItemProps {
  item: any;
  disabled?: boolean;
  nextSection?: string;
  updateData?: (item: any) => void;
  handleCheckboxStatus?: (item: any) => void;
}

export const ListItem: React.FC<ListItemProps> = ({
    item,
    updateData,
    nextSection,
    disabled = false,
    handleCheckboxStatus,
}) => {
    const isRecipe = item.type === ENTITY_TYPE.RECIPE;
    const isFood = item.type === ENTITY_TYPE.FOOD;
    const isCustomRecipe = item.type === ENTITY_TYPE.CUSTOM_RECIPE;
    const isIngredients = item.type === ENTITY_TYPE.INGREDIENTS;
    const isDidNotEat = item.status === PHASE_ITEM_STATUS.DID_NOT_EAT;
    const isDone = item.status === PHASE_ITEM_STATUS.DONE;

    const handleCheckboxPress = () => {
        if (handleCheckboxStatus && !disabled) {
            handleCheckboxStatus(item);
        }
    };

    const renderCheckbox = () => (
        <TouchableOpacity
            onPress={handleCheckboxPress}
            style={[
                styles.checkbox,
                item.status === PHASE_ITEM_STATUS.DONE && styles.checkboxChecked,
                disabled && styles.checkboxDisabled,
            ]}
            disabled={disabled}
            // activeOpacity={0.7}
        >
            {item.status === PHASE_ITEM_STATUS.DONE && (
                <Text style={styles.checkboxText}>✓</Text>
            )}
        </TouchableOpacity>
    );

    const renderStatusText = () => {
        switch (item.status) {
            default: return null;
            case PHASE_ITEM_STATUS.DID_NOT_EAT:
                return (
                    <View style={styles.notEatText}>
                        <Text style={{ fontWeight: 'bold' }} color={COLORS.BLUE}>Did</Text>
                        <Text style={{ fontWeight: 'bold' }} color={COLORS.BLUE}>Not Eat</Text>
                    </View>
                );
        }
    };

    const prepareIngredientNameWithUnit = (item: any, options: { withoutName?: boolean } = {}) => {
        const amount = item.amount || item.initialAmount;
        const serving = item.serving;
        const useServing = item.useServing;
        const ingredient = item.recipe?.ingredients?.[0];

        if (!amount) { return ''; }

        let result = '';
        
        if (useServing && serving) {
            result += `${serving} serving`;
        } else {
            result += amount;
            if (item.weight?.unit?.name) {
                result += ` ${item.weight.unit.name}`;
            }
        }

        if (!options.withoutName && ingredient?.entity?.name) {
            result += ` ${ingredient.entity.name}`;
        }

        return result;
    };

    const renderItemContent = () => {
        const amount = item.amount || item.initialAmount;
        const isOpacity = (isDidNotEat || isDone) ? { opacity: 0.2 } : undefined;

        if (isCustomRecipe) {
            const { entity } = item;
            return (
                <View style={styles.recipeContainer}>
                    <View style={styles.main}>
                        <Text style={[styles.title, isOpacity || {}]}>
                            {`${amount} ${item.weight?.unit?.name || ''} ${entity?.name || 'Recipe'}`}
                        </Text>
                        <Text style={[styles.subtitle, isOpacity || {}]}>
                            Status: {item.status || 'Unknown'}
                        </Text>
                        {item.modified && (
                            <Text style={[styles.subtitle, { color: '#2978A0', fontWeight: '600' }]}>
                                edited by me
                            </Text>
                        )}
                    </View>
                </View>
            );
        }

        if (isIngredients) {
            const { entity } = item;
            return (
                <View style={styles.recipeContainer}>
                    <View style={styles.main}>
                        <Text style={[styles.title, { fontSize: 18 }, isOpacity || {}]}>
                            {`${amount} ${item.weight?.unit?.name || ''} ${entity?.name || 'Ingredient'}`}
                        </Text>
                        {item.modified && (
                            <Text style={[styles.subtitle, { color: '#2978A0', fontWeight: '600' }]}>
                                edited by me
                            </Text>
                        )}
                    </View>
                </View>
            );
        }

        if (isRecipe) {
            return (
                <View style={styles.recipeContainer}>
                    <View style={styles.main}>
                        <Text style={[styles.title, isOpacity || {}]}>
                            {item.recipe?.name || 'Recipe'}
                        </Text>
                        {amount && (
                            <Text style={[styles.subtitle, isOpacity || {}]}>
                                {prepareIngredientNameWithUnit(item)}
                                {/* {prepareIngredientNameWithUnit(item, { withoutName: true })} */}
                            </Text>
                        )}
                        {item.modified && (
                            <Text style={[styles.subtitle, { color: '#2978A0', fontWeight: '600' }]}>
                                edited by me
                            </Text>
                        )}
                    </View>
                </View>
            );
        }

        if (isFood) {
            return (
                <View style={styles.foodContainer}>
                    <View style={styles.main}>
                        <Text style={[styles.title, isOpacity || {}]}>
                            {item.food?.name || 'Food'}
                        </Text>
                        {amount && (
                            <Text style={[styles.subtitle, isOpacity || {}]}>
                                {`${amount} ${item.weight?.unit?.name || ''}`}
                            </Text>
                        )}
                        {item.modified && (
                            <Text style={[styles.subtitle, { color: '#2978A0', fontWeight: '600' }]}>
                                edited by me
                            </Text>
                        )}
                    </View>
                </View>
            );
        }

        // Default case
        return (
            <View style={styles.defaultContainer}>
                <View style={styles.main}>
                    <Text style={[styles.title, isOpacity || {}]}>
                        {item.title || 'Item'}
                    </Text>
                    {amount && (
                        <Text style={[styles.subtitle, isOpacity || {}]}>
                            {`${amount} ${item.weight?.unit?.name || ''}`}
                        </Text>
                    )}
                    {item.modified && (
                        <Text style={[styles.subtitle, { color: '#2978A0', fontWeight: '600' }]}>
                            edited by me
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {renderCheckbox()}
            <View style={styles.content}>
                {renderItemContent()}
                {renderStatusText()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.LIGHT_GREY,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: COLORS.GREY,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxChecked: {
        backgroundColor: COLORS.BLUE,
        borderColor: COLORS.BLUE,
    },
    checkboxDisabled: {
        opacity: 0.5,
    },
    checkboxText: {
        color: COLORS.WHITE,
        fontSize: 14,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    recipeContainer: {
        flex: 1,
    },
    foodContainer: {
        flex: 1,
    },
    defaultContainer: {
        flex: 1,
    },
    main: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.DARK_GREY,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.GREY,
        marginBottom: 2,
    },
    notEatText: {
        alignItems: 'flex-end',
    },
});

export default ListItem;
