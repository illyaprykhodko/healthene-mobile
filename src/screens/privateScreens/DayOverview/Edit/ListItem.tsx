// outsource dependencies
import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Checkbox from '../../../../components/Checkbox';
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
    const isFood = item.type === ENTITY_TYPE.FOOD;
    const isRecipe = item.type === ENTITY_TYPE.RECIPE;
    const isDone = item.status === PHASE_ITEM_STATUS.DONE;
    const isIngredients = item.type === ENTITY_TYPE.INGREDIENTS;
    const isCustomRecipe = item.type === ENTITY_TYPE.CUSTOM_RECIPE;
    const isDidNotEat = item.status === PHASE_ITEM_STATUS.DID_NOT_EAT;

    const handleCheckboxPress = (next: boolean) => {
        if (handleCheckboxStatus && !disabled) {
            handleCheckboxStatus({ ...item, status: isDone ? PHASE_ITEM_STATUS.PENDING : PHASE_ITEM_STATUS.DONE });
            // handleCheckboxStatus(item);
        }
    };

    const renderCheckbox = () => (
        <Checkbox
            size={22}
            isDayOverview
            status={item.status}
            editable={!disabled}
            onChange={handleCheckboxPress}
            style={styles.checkboxContainer}
            value={item.status === PHASE_ITEM_STATUS.DONE}
        />
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

    const getImageUrl = () => {
        if (isRecipe) {
            const recipe = item.recipe;
            return recipe?.surrogateRecipe
                ? recipe?.ingredients?.[0]?.entity?.coverImage?.url
                : recipe?.coverImage?.url;
        }
        if (isFood) {
            return item.food?.coverImage?.url;
        }
        if (isCustomRecipe) {
            return item.entity?.coverImage?.url;
        }
        if (isIngredients) {
            return item.entity?.coverImage?.url;
        }
        return null;
    };

    const renderItemContent = () => {
        const amount = item.amount || item.initialAmount;
        const isOpacity = (isDidNotEat || isDone) ? { opacity: 0.2 } : undefined;
        const imageUrl = getImageUrl();
        if (isCustomRecipe) {
            const { entity } = item;
            return (
                <View style={styles.recipeContainer}>
                    {imageUrl && (
                        <Image source={{ uri: imageUrl }} style={[styles.image, isOpacity]} />
                    )}
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
                    {imageUrl && (
                        <Image source={{ uri: imageUrl }} style={[styles.image, isOpacity]} />
                    )}
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
                    {imageUrl && (
                        <Image source={{ uri: imageUrl }} style={[styles.image, isOpacity]} />
                    )}
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
                    {imageUrl && (
                        <Image source={{ uri: imageUrl }} style={[styles.image, isOpacity]} />
                    )}
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
        <View style={[styles.wrapper, nextSection && styles.divider]}>
            <View style={styles.listItem}>
                <View style={styles.listItemLink}>
                    {renderItemContent()}
                    {renderStatusText()}
                </View>
                {renderCheckbox()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: COLORS.WHITE,
        paddingLeft: 4, // OFFSET.POINT
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.BLACK,
    },
    listItem: {
        width: '100%',
        display: 'flex',
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 0,
        justifyContent: 'space-between',
        paddingVertical: 20, // OFFSET.VERTICAL
        paddingLeft: 20,
        paddingRight: 5,
        borderBottomColor: '#E9E9E9',
        borderRightColor: '#8EF9F3',
        borderRightWidth: 7,
    },
    listItemLink: {
        maxWidth: '90%',
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 16, // OFFSET.HORIZONTAL
        marginBottom: 20, // OFFSET.VERTICAL
    },
    checkboxContainer: {
        borderWidth: 2,
        borderRadius: 5,
        borderColor: '#8A95A3',
        paddingHorizontal: 3,
        paddingVertical: 1,
        marginRight: 5,
    },
    image: {
        width: 40,
        height: 40,
        marginRight: 16, // OFFSET.HORIZONTAL
        borderRadius: 4,
    },
    checkbox: {
        width: 25, // checkboxSize
        height: 25,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: COLORS.GREY,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 5,
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
    recipeContainer: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    foodContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    defaultContainer: {
        flex: 1,
    },
    main: {
        flex: 1,
    },
    title: {
        paddingTop: 20, // OFFSET.VERTICAL
        marginBottom: 20, // OFFSET.VERTICAL
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.DARK_GREY,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.GREY,
        marginBottom: 2,
    },
    notEatText: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
});

export default ListItem;
