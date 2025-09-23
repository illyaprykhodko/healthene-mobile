// outsource dependencies
import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
// local dependencies
import Text from 'components/Text';
import { filters } from 'services/filter';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import Checkbox from 'components/Checkbox';
import { PHASE_ITEM_STATUS, ENTITY_TYPE } from 'constants/spec';

// PHASE_ITEM_STATUS moved to constants/spec

// ENTITY_TYPE centralized in constants/spec

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
    const theme = useTheme();
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
                        <Text style={{ fontWeight: 'bold' }} color={theme.colors.blue}>Did</Text>
                        <Text style={{ fontWeight: 'bold' }} color={theme.colors.blue}>Not Eat</Text>
                    </View>
                );
        }
    };

    // const prepareIngredientNameWithUnit = (item: any, options: { withoutName?: boolean } = {}) => {
    //     const amount = item.amount || item.initialAmount;
    //     const serving = item.serving;
    //     const useServing = item.useServing;
    //     const ingredient = item.recipe?.ingredients?.[0];

    //     if (!amount) { return ''; }

    //     let result = '';
    //     let unitSingularName,
    //     unitPluralName;
        
    //     if (useServing && serving) {
    //         result += `${serving} serving`;
    //     } else {
    //         result += amount;
    //         if (item.weight?.unit?.name) {
    //             result += ` ${item.weight.unit.name}`;
    //         }
    //     }

    //     if (!options.withoutName && ingredient?.entity?.name) {
    //         result += ` ${ingredient.entity.name}`;
    //     }

    //     return result;
    // };

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
                        <Text style={[styles.title, { color: theme.colors.darkGrey }, isOpacity || {}]}>
                            {`${amount} ${item.weight?.unit?.name || ''} ${entity?.name || 'Recipe'}`}
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.colors.grey }, isOpacity || {}]}>
                            Status: {item.status || 'Unknown'}
                        </Text>
                        {item.modified && (
                            <Text style={[styles.subtitle, { color: theme.colors.blue, fontWeight: '600' }]}>
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
                        <Text style={[styles.title, { fontSize: 18, color: theme.colors.darkGrey }, isOpacity || {}]}>
                            {`${amount} ${item.weight?.unit?.name || ''} ${entity?.name || 'Ingredient'}`}
                        </Text>
                        {item.modified && (
                            <Text style={[styles.subtitle, { color: theme.colors.blue, fontWeight: '600' }]}>
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
                        <Text style={[styles.title, { color: theme.colors.darkGrey }, isOpacity || {}]}>
                            {item.recipe?.name || 'Recipe'}
                        </Text>
                        {amount && (
                            <Text style={[styles.subtitle, { color: theme.colors.grey }, isOpacity || {}]}>
                                {prepareIngredientNameWithUnit(item)}
                                {/* {prepareIngredientNameWithUnit(item, { withoutName: true })} */}
                            </Text>
                        )}
                        {item.modified && (
                            <Text style={[styles.subtitle, { color: theme.colors.blue, fontWeight: '600' }]}>
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
                        <Text style={[styles.title, { color: theme.colors.darkGrey }, isOpacity || {}]}>
                            {item.food?.name || 'Food'}
                        </Text>
                        {amount && (
                            <Text style={[styles.subtitle, { color: theme.colors.grey }, isOpacity || {}]}>
                                {`${amount} ${item.weight?.unit?.name || ''}`}
                            </Text>
                        )}
                        {item.modified && (
                            <Text style={[styles.subtitle, { color: theme.colors.blue, fontWeight: '600' }]}>
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
                    <Text style={[styles.title, { color: theme.colors.darkGrey }, isOpacity || {}]}>
                        {item.title || 'Item'}
                    </Text>
                    {amount && (
                        <Text style={[styles.subtitle, { color: theme.colors.grey }, isOpacity || {}]}>
                            {`${amount} ${item.weight?.unit?.name || ''}`}
                        </Text>
                    )}
                    {item.modified && (
                        <Text style={[styles.subtitle, { color: theme.colors.blue, fontWeight: '600' }]}>
                            edited by me
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.wrapper, { backgroundColor: theme.colors.surface },
            nextSection && [styles.divider, { borderBottomColor: theme.colors.black }]]}>
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
        paddingLeft: OFFSET.POINT
    },
    divider: {
        borderBottomWidth: 1,
    },
    listItem: {
        width: '100%',
        display: 'flex',
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 0,
        justifyContent: 'space-between',
        paddingVertical: OFFSET.VERTICAL,
        paddingLeft: 20,
        paddingRight: 5,
        borderBottomColor: '#E9E9E9',
        borderRightColor: '#8EF9F3',
        borderRightWidth: 7,
    },
    listItemLink: {
        maxWidth: '70%',
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        // marginRight: 16, // OFFSET.HORIZONTAL
        // marginBottom: 20, // OFFSET.VERTICAL
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
        marginRight: OFFSET.HORIZONTAL,
        borderRadius: 4,
    },
    checkbox: {
        width: 25, // checkboxSize
        height: 25,
        borderRadius: 4,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 5,
    },
    checkboxChecked: {},
    checkboxDisabled: {
        opacity: 0.5,
    },
    checkboxText: {
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
        paddingTop: OFFSET.VERTICAL,
        marginBottom: OFFSET.VERTICAL,
        fontSize: 16,
        fontWeight: '500',
    },
    subtitle: {
        fontSize: 14,
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

// Types — keep them minimal but safe
type Maybe<T> = T | null | undefined;

interface Unit {
  name?: string;           // e.g. "g"
  singularName?: string;   // e.g. "cup (8 oz)"
  pluralName?: string;     // e.g. "cups (8 oz)"
}

interface Weight {
  unit?: Unit | null;
}

interface EntityNames {
  name?: string;           // generic name
  singularName?: string;
  pluralName?: string;
}

interface IngredientLike {
  entity?: EntityNames | null;
  weight?: Weight | null;
}

interface ServingLike {
  name?: string;           // fallback if singular/plural are missing
  pluralName?: string;
  singularName?: string;
}

interface PrepareOptions {
    withoutName?: boolean;
    withoutAmount?: boolean;
  // Optional external formatter for amount (e.g., filters.decimalsToFractions)
    formatAmount?: (n: number) => string;
}

interface PrepareArgs {
    amount?: number;                 // base amount (default 1)
    useServing?: boolean;            // if true — use recipe serving; else use ingredient.weight.unit
    options?: PrepareOptions;
    peopleEatingNumber?: number;     // multiplier (default 1)
    serving?: Maybe<ServingLike>;
    ingredient?: Maybe<IngredientLike>;
}

// Default options
const defaultOptions: Required<Omit<PrepareOptions, 'formatAmount'>> = {
    withoutAmount: false,
    withoutName: false,
};

// Tiny, dependency-free amount formatter.
const defaultFormatAmount = (n: number): string => {
    // Simple formatter: keep up to 2 decimals; no fraction conversion
    const rounded = Math.round(n * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

// Utility: safely pick unit names with fallbacks
function resolveUnitNames (
    useServing: boolean,
    serving: Maybe<ServingLike>,
    ingredient: Maybe<IngredientLike>
): { singular: string; plural: string } {
    if (useServing) {
    // Use recipe serving
        const singular
      = serving?.singularName || serving?.name || 'serving';
        const plural
      = serving?.pluralName || serving?.name || 'servings';
        return { singular, plural };
    }
    // Use ingredient unit (weight.unit.*)
    const u = ingredient?.weight?.unit;
    const singular = u?.singularName || u?.name || 'serving';
    const plural = u?.pluralName || u?.name || 'servings';
    return { singular, plural };
}

// Utility: choose singular/plural entity name (ingredient name)
function resolveEntityName (
    ingredient: Maybe<IngredientLike>,
    isPlural: boolean
): string {
    const ent = ingredient?.entity;
    if (!ent) { return ''; }
    if (isPlural) {
        return ent.pluralName || ent.name || '';
    }
    return ent.singularName || ent.name || '';
}

// Utility: when withoutName=true and unit contains " of", drop the " of"
function stripOfIfNeeded (unitLabel: string): string {
    const excludeWord = /\s(of)\b/gi;
    return excludeWord.test(unitLabel) ? unitLabel.replace(excludeWord, '') : unitLabel;
}

/**
 * Core function (new logic, typed)
 */
export function prepareIngredientNameWithUnit ({
    serving,
    amount = 1,
    ingredient,
    useServing = false,
    peopleEatingNumber = 1,
    options,
}: PrepareArgs): string {
    const opt: Required<PrepareOptions> = {
        ...defaultOptions,
        // formatAmount: options?.formatAmount || defaultFormatAmount,
        withoutName: options?.withoutName ?? defaultOptions.withoutName,
        formatAmount: options?.formatAmount || filters.decimalsToFractions,
        withoutAmount: options?.withoutAmount ?? defaultOptions.withoutAmount,
    };

    // Determine unit labels
    const { singular, plural } = resolveUnitNames(useServing, serving, ingredient);

    // Decide pluralization by final (possibly multiplied) amount
    const calculatedAmount = peopleEatingNumber > 1 ? amount * peopleEatingNumber : amount;
    const isPlural = calculatedAmount > 1;

    let unitLabel = isPlural ? plural : singular;

    // If we hide the ingredient name, we might want to remove " of"
    if (opt.withoutName) {
        unitLabel = stripOfIfNeeded(unitLabel);
    }

    // Build the name part (ingredient entity name)
    let namePart = '';
    if (!opt.withoutName) {
        const entityName = resolveEntityName(ingredient, isPlural);
        // If there is no entity name at all, we won't add extra space
        namePart = entityName ? ` ${entityName}` : '';
    }

    // Assemble the result
    let result = `${unitLabel}${namePart}`.trim();

    // Prepend amount unless suppressed
    if (!opt.withoutAmount) {
        result = `${opt.formatAmount(calculatedAmount)} ${result}`.trim();
    }

    return result;
}

/**
 * Convenience adapter: “from item”
 * Use this if you have the flat `item` like in your original code.
 * Safely extracts amount/initialAmount, serving/useServing, and the 1st recipe ingredient.
 */
export function prepareIngredientNameWithUnitFromItem (
    item: {
    amount?: number | null;
    useServing?: boolean | null;
    serving?: Maybe<ServingLike>;
    initialAmount?: number | null;
    recipe?: { ingredients?: Maybe<IngredientLike[]> } | null;
    // Sometimes unit is stored on the item (fallback)
    weight?: Maybe<Weight>;
  },
    options?: PrepareOptions & { peopleEatingNumber?: number }
): string {
    // Derive amount with fallback to initialAmount; default 1 if not present
    const baseAmount
    = (typeof item.amount === 'number' && item.amount > 0 ? item.amount : null)
    ?? (typeof item.initialAmount === 'number' && item.initialAmount > 0 ? item.initialAmount : null)
    ?? 1;

    // Prefer first recipe ingredient if present
    const ingredient: IngredientLike | undefined
    = item?.recipe?.ingredients?.[0]
    // Fallback: build a pseudo-ingredient from item.weight if needed
    || (item.weight ? { weight: item.weight } : undefined);

    return prepareIngredientNameWithUnit({
        options, // pass through withoutAmount/withoutName/formatAmount
        ingredient,
        amount: baseAmount,
        serving: item.serving,
        useServing: !!item.useServing,
        peopleEatingNumber: options?.peopleEatingNumber ?? 1,
    });
}
