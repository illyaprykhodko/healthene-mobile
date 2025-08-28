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
        if (handleCheckboxStatus) {
            handleCheckboxStatus(item);
        }
    };

    const renderCheckbox = () => (
        <TouchableOpacity
            onPress={handleCheckboxPress}
            style={[
                styles.checkbox,
                item.status === PHASE_ITEM_STATUS.DONE && styles.checkboxChecked,
            ]}
            disabled={disabled}
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
            const recipe = item.recipe;
            const imageUrl = recipe?.surrogateRecipe
                ? recipe?.ingredients?.[0]?.entity?.coverImage?.url
                : recipe?.coverImage?.url;

            return (
                <View style={styles.recipeContainer}>
                    <View style={styles.main}>
                        <Text style={[styles.title, { fontWeight: '600' }, isOpacity || {}]}>
                            {recipe?.name || 'Recipe'}
                        </Text>
                        {amount && (
                            <Text style={[styles.subtitle, isOpacity || {}]}>
                                {prepareIngredientNameWithUnit(item, { withoutName: true })}
                            </Text>
                        )}
                        {item.modified && (
                            <Text style={[styles.subtitle, { color: '#2978A0', fontWeight: '600' }]}>
                                added by me
                            </Text>
                        )}
                        {recipe?.modified && (
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
                            {item.food?.name || 'Food Item'}
                        </Text>
                        {amount && (
                            <Text style={[styles.subtitle, isOpacity || {}]}>
                                {amount} {item.weight?.unit?.name || ''}
                            </Text>
                        )}
                    </View>
                </View>
            );
        }

        // default case for other item types (medication, supplement, measurement, etc.)
        return (
            <View style={styles.main}>
                <Text style={[styles.title, isOpacity || {}]}>
                    {item.title || item.name || 'Item'}
                </Text>
                <Text style={[styles.subtitle, isOpacity || {}]}>
                    Status: {item.status || 'Unknown'}
                </Text>
                {amount && (
                    <Text style={[styles.subtitle, isOpacity || {}]}>
                        Amount: {amount}
                    </Text>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.wrapper, nextSection && styles.divider]}>
            <View style={styles.listItemLink}>
                {renderCheckbox()}
                {renderItemContent()}
                {renderStatusText()}
            </View>
        </View>
    );
};

export default ListItem;

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: COLORS.WHITE,
        paddingLeft: 4,
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.BLACK,
    },
    listItemLink: {
        maxWidth: '90%',
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 16,
        marginBottom: 20,
    },
    image: {
        width: 40,
        height: 40,
    },
    offset: {
        paddingLeft: 16,
        paddingRight: 16,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 5,
    },
    notEatText: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    foodContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 5,
    },
    videoBtn: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: COLORS.YELLOW,
        backgroundColor: `${COLORS.YELLOW }80`, // 50% opacity
    },
    recipeContainer: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    main: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.BLACK,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.GREY,
        marginTop: 4,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: COLORS.GREY,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxChecked: {
        backgroundColor: COLORS.BLUE,
    },
    checkboxText: {
        color: COLORS.WHITE,
        fontSize: 12,
    },
});
