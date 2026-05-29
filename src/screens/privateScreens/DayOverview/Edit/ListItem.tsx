// outsource dependencies
import React, { useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';
// local dependencies
import Text from 'components/Text';
import { useAppDispatch } from 'store';
import { filters } from 'services/filter';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import Checkbox from 'components/Checkbox';
import DefImage from 'components/DefImage';
import { triggerReward } from 'store/slices/rewardStarSlice';
import { PlayBtn, QuestionBtn } from 'components/LibraryButtons';
import { CheckboxBurstEffect } from 'components/CheckboxBurstEffect';
import { PHASE_ITEM_STATUS, ENTITY_TYPE, VIDEO_LIBRARY_TYPE, QUESTION_TYPE } from 'constants/spec';

interface ListItemProps {
  item: any;
  date?: string;
  disabled?: boolean;
  nextSection?: string;
  isFutureDate?: boolean;
  updateData?: (item: any) => void;
  handleCheckboxStatus?: (item: any) => void;
}

export const ListItem: React.FC<ListItemProps> = ({
    item,
    date,
    updateData,
    nextSection,
    disabled = false,
    isFutureDate = false,
    handleCheckboxStatus,
}) => {
    const theme = useTheme();
    const navigation = useNavigation();
    const dispatch = useAppDispatch();
    const [burstSignal, setBurstSignal] = useState(0);
    const checkboxBurstAnchorRef = useRef<View>(null);
    const isFood = item.type === ENTITY_TYPE.FOOD;
    const isRecipe = item.type === ENTITY_TYPE.RECIPE;
    const isDone = typeof item?.status === 'string'
        && item.status.toUpperCase() === PHASE_ITEM_STATUS.DONE;
    const isIngredients = item.type === ENTITY_TYPE.INGREDIENTS;
    const isCustomRecipe = item.type === ENTITY_TYPE.CUSTOM_RECIPE;
    const isDidNotEat = item.status === PHASE_ITEM_STATUS.DID_NOT_EAT;

    // Video and Question data from item
    const currentVideo = item?.patientFoodCategoryAttachment;
    const currentQuestion = item?.patientFoodCategoryQuestion;
    const questionPayload = currentQuestion?.question || currentQuestion?.questionToAnswer;
    const hasQuestionRelation = Boolean(
        currentQuestion?.relatedToDayOverviewItemQuestionExists
        || currentQuestion?.foodCategory?.relatedToDayOverviewItemQuestionExists
    );

    const handleCheckboxPress = () => {
        if (handleCheckboxStatus && !disabled && !isFutureDate) {
            const nextStatus = (isDone || isDidNotEat) ? PHASE_ITEM_STATUS.PENDING : PHASE_ITEM_STATUS.DONE;
            if (nextStatus === PHASE_ITEM_STATUS.DONE) {
                setBurstSignal(s => s + 1);
                checkboxBurstAnchorRef.current?.measureInWindow((x, y, w, h) => {
                    const cx = x + w / 2;
                    const cy = y + h / 2;
                    dispatch(triggerReward({ cx, cy }));
                });
            }
            handleCheckboxStatus({ ...item, status: nextStatus });
        }
    };

    const handleItemPress = () => {
        if (!disabled && item.id) {
            (navigation as any).navigate('Item', { id: item.id, date });
        }
    };

    const renderCheckbox = () => (
        <View ref={checkboxBurstAnchorRef} style={styles.checkboxBurstWrapper} collapsable={false}>
            <Checkbox
                size={22}
                isDayOverview
                status={item.status}
                onChange={handleCheckboxPress}
                editable={!disabled && !isFutureDate}
                value={item.status === PHASE_ITEM_STATUS.DONE}
            />
            <CheckboxBurstEffect
                anchorRef={checkboxBurstAnchorRef}
                burstSignal={burstSignal}
                checked={item.status === PHASE_ITEM_STATUS.DONE}
            />
        </View>
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
                    <DefImage src={imageUrl} style={StyleSheet.flatten([styles.image, isOpacity])} />
                    <View style={styles.main}>
                        <Text style={[styles.title, { color: theme.colors.text }, isOpacity || {}]}>
                            {`${amount} ${item.weight?.unit?.name || ''} ${entity?.name || 'Recipe'}`}
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.colors.grey }, isOpacity || {}]}>
                            Status: {item.status || 'Unknown'}
                        </Text>
                        {item.modified && (
                            <Text style={[styles.subtitle, { color: theme.colors.blue, fontWeight: '600' }]}>
                                added by me
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
                    <DefImage src={imageUrl} style={StyleSheet.flatten([styles.image, isOpacity])} />
                    <View style={styles.main}>
                        <Text style={[styles.title, { fontSize: 18, color: theme.colors.text }, isOpacity || {}]}>
                            {`${amount} ${item.weight?.unit?.name || ''} ${entity?.name || 'Ingredient'}`}
                        </Text>
                        {item.modified && (
                            <Text style={[styles.subtitle, { color: theme.colors.blue, fontWeight: '600' }]}>
                                added by me
                            </Text>
                        )}
                    </View>
                </View>
            );
        }

        if (isRecipe) {
            const hasVideoOrQuestion = currentVideo?.relatedToDayOverviewItemAttachmentExists
                || currentQuestion?.relatedToDayOverviewItemQuestionExists;

            return (
                <View style={styles.recipeContentContainer}>
                    <View style={styles.recipeContainer}>
                        <DefImage src={imageUrl} style={StyleSheet.flatten([styles.image, isOpacity])} />
                        <View style={styles.main}>
                            <Text style={[styles.title, { color: theme.colors.text }, isOpacity || {}]}>
                                {item.recipe?.name || item.title || 'Recipe'}
                            </Text>
                            {amount && (
                                <Text style={[styles.subtitle, { color: theme.colors.grey }, isOpacity || {}]}>
                                    {prepareIngredientNameWithUnit(item)}
                                </Text>
                            )}
                            {item?.recipe?.modified && (
                                <Text style={[styles.subtitle, { color: theme.colors.blue, fontWeight: '600' }]}>
                                    edited by me
                                </Text>
                            )}
                        </View>
                    </View>
                    {hasVideoOrQuestion && (
                        <View style={styles.buttonContainer}>
                            {currentVideo?.relatedToDayOverviewItemAttachmentExists && (
                                <PlayBtn
                                    style={styles.btnOffset}
                                    change={Boolean(currentVideo?.attachment) || !currentVideo?.relatedToDayOverviewItemAttachmentExists}
                                    disabled={disabled || !currentVideo?.attachment || isFutureDate}
                                    navigationAttr={{
                                        backLink: ROUTES.EDIT,
                                        id: currentVideo?.id,
                                        library: VIDEO_LIBRARY_TYPE.OVERVIEW_VIDEO,
                                        video: currentVideo?.attachment,
                                    }}
                                />
                            )}
                            {currentQuestion?.relatedToDayOverviewItemQuestionExists && (
                                <QuestionBtn
                                    style={styles.btnOffset}
                                    change={Boolean(currentQuestion?.question)}
                                    disabled={disabled || !currentQuestion?.question || isFutureDate}
                                    navigationAttr={{
                                        backLink: ROUTES.EDIT,
                                        question: { ...currentQuestion, questionType: QUESTION_TYPE.FOOD_QUESTION },
                                    }}
                                />
                            )}
                        </View>
                    )}
                </View>
            );
        }

        if (isFood) {
            const hasVideoOrQuestion = currentVideo?.relatedToDayOverviewItemAttachmentExists
                || Boolean(questionPayload)
                || hasQuestionRelation;

            return (
                <View style={styles.foodContentContainer}>
                    <View style={styles.foodContainer}>
                        {imageUrl && (
                            <Image source={{ uri: imageUrl }} style={[styles.image, isOpacity]} />
                        )}
                        <View style={styles.main}>
                            <Text style={[styles.title, { color: theme.colors.text }, isOpacity || {}]}>
                                {item.food?.name || 'Food'}
                            </Text>
                            {amount && (
                                <Text style={[styles.subtitle, { color: theme.colors.grey }, isOpacity || {}]}>
                                    {`${amount} ${item.weight?.unit?.name || ''}`}
                                </Text>
                            )}
                        </View>
                    </View>
                    {hasVideoOrQuestion && (
                        <View style={styles.buttonContainer}>
                            {currentVideo?.relatedToDayOverviewItemAttachmentExists && (
                                <PlayBtn
                                    style={styles.btnOffset}
                                    change={Boolean(currentVideo?.attachment) || !currentVideo?.relatedToDayOverviewItemAttachmentExists}
                                    disabled={disabled || !currentVideo?.attachment || isFutureDate}
                                    navigationAttr={{
                                        id: currentVideo?.id,
                                        backLink: ROUTES.EDIT,
                                        video: currentVideo?.attachment,
                                        library: VIDEO_LIBRARY_TYPE.OVERVIEW_VIDEO,
                                    }}
                                />
                            )}
                            {(Boolean(questionPayload) || hasQuestionRelation) && (
                                <QuestionBtn
                                    style={styles.btnOffset}
                                    change={Boolean(questionPayload) || !hasQuestionRelation}
                                    disabled={disabled || !questionPayload || isFutureDate}
                                    navigationAttr={{
                                        backLink: ROUTES.EDIT,
                                        question: {
                                            ...currentQuestion,
                                            question: questionPayload,
                                            questionType: QUESTION_TYPE.FOOD_QUESTION
                                        },
                                    }}
                                />
                            )}
                        </View>
                    )}
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
                            added by me
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.wrapper, { backgroundColor: theme.colors.surface },
            nextSection && [styles.divider, { borderBottomColor: theme.colors.lightGrey }]]}>
            <View style={styles.listItem}>
                <TouchableOpacity
                    style={styles.listItemLink}
                    onPress={handleItemPress}
                    disabled={disabled}
                    activeOpacity={0.7}
                >
                    {renderItemContent()}
                </TouchableOpacity>
                <View style={styles.itemContent}>
                    {renderStatusText()}
                    {renderCheckbox()}
                </View>
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
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        // marginRight: 0,
        justifyContent: 'space-between',
        paddingVertical: OFFSET.VERTICAL,
        paddingLeft: 20,
        paddingRight: 5,
        borderBottomColor: '#E9E9E9',
        borderRightColor: '#8EF9F3',
        borderRightWidth: 7,
        overflow: 'visible',
    },
    listItemLink: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
    },
    checkboxBurstWrapper: {
        position: 'relative',
        marginRight: 5,
        marginLeft: 15,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible',
    },
    image: {
        width: 40,
        height: 40,
        marginRight: OFFSET.HORIZONTAL,
        borderRadius: 4,
    },
    checkbox: {
        width: 25,
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
    recipeContentContainer: {
        flex: 1,
    },
    foodContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    foodContentContainer: {
        flex: 1,
    },
    defaultContainer: {
        flex: 1,
    },
    main: {
        flex: 1,
        minWidth: 0,
    },
    title: {
        paddingTop: OFFSET.VERTICAL,
        fontSize: 16,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 2,
    },
    notEatText: {
        alignItems: 'center',
        justifyContent: 'center',

    },
    buttonContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: 5,
        marginBottom: 5,
    },
    btnOffset: {
        marginRight: 10,
    },
    itemContent: {
        // width: '35%',
        flexShrink: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});

export default ListItem;

type Maybe<T> = T | null | undefined;

interface Unit {
  name?: string;
  pluralName?: string;
  singularName?: string;
}

interface Weight {
  unit?: Unit | null;
}

interface EntityNames {
  name?: string;
  pluralName?: string;
  singularName?: string;
}

interface IngredientLike {
  entity?: EntityNames | null;
  weight?: Weight | null;
}

interface ServingLike {
  name?: string;
  pluralName?: string;
  singularName?: string;
}

interface PrepareOptions {
    withoutName?: boolean;
    withoutAmount?: boolean;
    formatAmount?: (n: number) => string;
}

interface PrepareArgs {
    amount?: number;
    useServing?: boolean;
    options?: PrepareOptions;
    peopleEatingNumber?: number;
    serving?: Maybe<ServingLike>;
    ingredient?: Maybe<IngredientLike>;
}

const defaultOptions: Required<Omit<PrepareOptions, 'formatAmount'>> = {
    withoutAmount: false,
    withoutName: false,
};

function resolveUnitNames (
    useServing: boolean,
    serving: Maybe<ServingLike>,
    ingredient: Maybe<IngredientLike>
): { singular: string; plural: string } {
    if (useServing) {
        const singular
      = serving?.singularName || serving?.name || 'serving';
        const plural
      = serving?.pluralName || serving?.name || 'servings';
        return { singular, plural };
    }
    const u = ingredient?.weight?.unit;
    const singular = u?.singularName || u?.name || 'serving';
    const plural = u?.pluralName || u?.name || 'servings';
    return { singular, plural };
}
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

function stripOfIfNeeded (unitLabel: string): string {
    const excludeWord = /\s(of)\b/gi;
    return excludeWord.test(unitLabel) ? unitLabel.replace(excludeWord, '') : unitLabel;
}

export function prepareIngredientNameWithUnit ({
    serving,
    options,
    amount = 1,
    ingredient,
    useServing = false,
    peopleEatingNumber = 1,
}: PrepareArgs): string {
    const opt: Required<PrepareOptions> = {
        ...defaultOptions,
        // formatAmount: options?.formatAmount || defaultFormatAmount,
        withoutName: options?.withoutName ?? defaultOptions.withoutName,
        formatAmount: options?.formatAmount || filters.decimalsToFractions,
        withoutAmount: options?.withoutAmount ?? defaultOptions.withoutAmount,
    };

    const { singular, plural } = resolveUnitNames(useServing, serving, ingredient);

    // const calculatedAmount = peopleEatingNumber > 1 ? amount * peopleEatingNumber : amount;
    // const isPlural = calculatedAmount > 1;
    const isPlural = amount > 1;

    let unitLabel = isPlural ? plural : singular;

    if (opt.withoutName) {
        unitLabel = stripOfIfNeeded(unitLabel);
    }

    let namePart = '';
    if (!opt.withoutName) {
        const entityName = resolveEntityName(ingredient, isPlural);
        namePart = entityName ? ` ${entityName}` : '';
    }
    let result = `${unitLabel}${namePart}`.trim();

    if (!opt.withoutAmount) {
        result = `${opt.formatAmount(amount)} ${result}`.trim();
    }

    return result;
}

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
    const baseAmount
    = (typeof item.amount === 'number' && item.amount > 0 ? item.amount : null)
    ?? (typeof item.initialAmount === 'number' && item.initialAmount > 0 ? item.initialAmount : null)
    ?? 1;

    const ingredient: IngredientLike | undefined
    = item?.recipe?.ingredients?.[0]
    // Fallback: build a pseudo-ingredient from item.weight if needed
    || (item.weight ? { weight: item.weight } : undefined);

    return prepareIngredientNameWithUnit({
        options,
        ingredient,
        amount: baseAmount,
        serving: item.serving,
        useServing: !!item.useServing,
        peopleEatingNumber: options?.peopleEatingNumber ?? 1,
    });

}
