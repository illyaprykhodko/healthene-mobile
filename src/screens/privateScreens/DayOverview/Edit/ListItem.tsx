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
    const isDidNotEat = item.status === PHASE_ITEM_STATUS.DID_NOT_EAT;

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

    const renderItemContent = () => {
        if (isRecipe || isCustomRecipe) {
            return (
                <View style={styles.recipeContainer}>
                    <View style={styles.main}>
                        <Text style={styles.title}>
                            {item.recipe?.name || 'Recipe'}
                        </Text>
                        <Text style={styles.subtitle}>
              Status: {item.status || 'Unknown'}
                        </Text>
                        {item.recipe?.description && (
                            <Text style={styles.subtitle}>
                                {item.recipe.description}
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
                        <Text style={styles.title}>
                            {item.food?.name || 'Food Item'}
                        </Text>
                        <Text style={styles.subtitle}>
              Status: {item.status || 'Unknown'}
                        </Text>
                        {item.amount && (
                            <Text style={styles.subtitle}>
                Amount: {item.amount}
                            </Text>
                        )}
                    </View>
                </View>
            );
        }

        // Default case for other item types
        return (
            <View style={styles.main}>
                <Text style={styles.title}>
                    {item.title || item.name || 'Item'}
                </Text>
                <Text style={styles.subtitle}>
          Status: {item.status || 'Unknown'}
                </Text>
            </View>
        );
    };

    return (
        <View style={[styles.wrapper, nextSection && styles.divider]}>
            <View style={styles.listItemLink}>
                {renderCheckbox()}
                {renderItemContent()}
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
    // paddingVertical: 20,
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
