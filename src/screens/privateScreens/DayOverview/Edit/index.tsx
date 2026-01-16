// outsource dependencies
import moment from 'moment';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
// local dependencies
import {
    useGetPhaseItemsQuery,
    useGetDayOverviewQuery,
    useUpdatePhaseMutation,
    useAddPhaseItemMutation,
    useUpdatePhaseItemMutation,
    useDeletePhaseItemMutation,
    useReplacePhaseItemMutation,
    useAddPhaseMealItemMutation,
    useAddPhaseCustomRecipeMutation,
    useUpdateIncludeRescueFoodsMutation
} from 'store/api/dayOverviewApi';
import ListItem from './ListItem';
import Text from 'components/Text';
import { useAppSelector } from 'store';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { Button } from 'components/Button';
import { PhaseItem } from 'types/overview';
import { groupBy, isEmpty } from 'utils/general';
import { AnytimeMenu } from 'components/AnytimeMenu';
import { RootStackParamList } from 'services/navigation';
import { BirdAnimation } from 'animation/BirdAnimation.tsx';
import { CheckboxCoordinate } from 'components/Checkbox.tsx';
import { ListItemSkeleton, Skeleton } from 'components/Skeleton';
import ReplaceItemModal from 'components/modals/ReplaceItemModal';
import { selectDayOverview } from 'store/slices/dayOverviewSlice';
import SwipeList, { SwipeValueChange } from 'components/SwipeList';
import SeedsAnimation, { SeedsCoordinates } from 'animation/Seeds.tsx';
import ConfirmationReplaceModal from 'components/modals/ConfirmationReplaceModal';
import { OVERVIEW_TYPE, ENTITY_TYPE, SECTION, PHASE_ITEM_STATUS, SUBSTANCE_TYPE } from 'constants/spec';


interface EditProps {
    date?: string;
    phaseId?: string | number;
}

const convertTypeToTitle = (type: string, capitalize = false) => {
    const title = type.replace(/_/g, ' ').toLowerCase();
    return capitalize ? title.charAt(0).toUpperCase() + title.slice(1) : title;
};

export const Edit: React.FC<EditProps> = ({ phaseId, date }) => {
    const theme = useTheme();
    const route = useRoute<any>();
    const { date: currentDate } = useAppSelector(selectDayOverview);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [scrollEnabled, setScrollEnabled] = useState(true);
    const [localItems, setLocalItems] = useState<PhaseItem[]>([]);
    const [showRescueFoodsModal, setShowRescueFoodsModal] = useState(false);

    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [replacementData, setReplacementData] = useState<{ prevItem: PhaseItem | null; nextItem: any }>({
        prevItem: null,
        nextItem: null,
    });
    const includeRescueFoodsInShoppingList = useAppSelector(state => state.app?.user?.includeRescueFoodsInShoppingList);
    const targetDate = date || currentDate || moment().format('YYYY-MM-DD');
    const targetPhaseId = phaseId || route.params?.phaseId;

    const { data: dayOverviewData, isLoading: isDayOverviewLoading } = useGetDayOverviewQuery(targetDate, {
        skip: !targetDate,
    });

    const { data: phaseItems, isLoading: isPhaseItemsLoading } = useGetPhaseItemsQuery(targetPhaseId, {
        skip: !targetPhaseId,
        refetchOnFocus: true,
        refetchOnReconnect: true,
    });
    // mutations
    const [updatePhase] = useUpdatePhaseMutation();
    const [addPhaseMealItem] = useAddPhaseMealItemMutation();
    const [addPhaseItem] = useAddPhaseItemMutation();
    // const [addPhaseRecipe] = useAddPhaseRecipeMutation();
    const [addPhaseCustomRecipe] = useAddPhaseCustomRecipeMutation();
    const [deletePhaseItem] = useDeletePhaseItemMutation();
    const [replacePhaseItem] = useReplacePhaseItemMutation();
    const [updateIncludeRescueFoods] = useUpdateIncludeRescueFoodsMutation();
    const [updatePhaseItem] = useUpdatePhaseItemMutation();
    //  const [updatePhaseItem, { isLoading: isUpdatePhaseItemLoading }] = useUpdatePhaseItemMutation();
    const currentPhase = dayOverviewData?.phases?.find(phase => phase.id === targetPhaseId);

    const getItemTitle = (item: any) =>
        item.food?.name
        || item.recipe?.name
        || item.measurement?.name
        || item.medication?.name
        || item.supplement?.name
        || item.physicalActivity?.name
        || 'Item';

    const items = useMemo(() => {
        if (!phaseItems) { return []; }

        return Object.values(phaseItems)
            .flat()
            .map(item => ({
                ...item,
                title: getItemTitle(item),
            }))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [phaseItems]);

    useEffect(() => {
        setLocalItems(items);
    }, [items]);

    const computeExcludeIds = (): string[] => {
        switch (currentPhase?.type) {
            default:
            case OVERVIEW_TYPE.MEAL:
            case OVERVIEW_TYPE.ADDED_BY_PATIENT:
                return items.map(i => String(i.food?.id)).filter(Boolean);
            case OVERVIEW_TYPE.MEASUREMENT:
                return items.map(i => String(i.measurement?.id)).filter(Boolean);
            case OVERVIEW_TYPE.MEDICATION:
                return items.map(i => String(i.medication?.id)).filter(Boolean);
            case OVERVIEW_TYPE.SUPPLEMENT:
                return items.map(i => String(i.supplement?.id)).filter(Boolean);
            case OVERVIEW_TYPE.PHYSICAL_ACTIVITY:
                return items.map(i => String(i.physicalActivity?.id)).filter(Boolean);
        }
    };

    const mapPhaseTypeToEntityType = (): string => {
        switch (currentPhase?.type) {
            default:
            case OVERVIEW_TYPE.MEAL:
            case OVERVIEW_TYPE.ADDED_BY_PATIENT:
                return ENTITY_TYPE.FOOD;
            case OVERVIEW_TYPE.MEASUREMENT:
                return ENTITY_TYPE.MEASUREMENT;
            case OVERVIEW_TYPE.MEDICATION:
                return ENTITY_TYPE.MEDICATION;
            case OVERVIEW_TYPE.SUPPLEMENT:
                return ENTITY_TYPE.SUPPLEMENT;
            case OVERVIEW_TYPE.PHYSICAL_ACTIVITY:
                return ENTITY_TYPE.PHYSICAL_ACTIVITY;
        }
    };

    const handleAddItem = () => {
        // if (!targetPhaseId) { return; }
        if (!targetPhaseId || !currentPhase) { return; }

        const excludeIds = computeExcludeIds();
        const entityType = mapPhaseTypeToEntityType();

        const isMealPhase = currentPhase?.type === OVERVIEW_TYPE.MEAL || currentPhase?.type === OVERVIEW_TYPE.ADDED_BY_PATIENT;
        if (isMealPhase) {
            navigation.navigate(ROUTES.TREE_ADD_REPLACE_ITEM, {
                date: targetDate,
                prevItem: null,
                entityType: 'PATIENT_FOOD',
                substanceType: 'FOOD',
                onApply: async (payload: any) => {
                    try {
                        const selectedItemData = payload.item || payload;
                        const selectedItem = { ...selectedItemData?.item };
                        const itemEntityType = selectedItemData?.entityType || entityType;
                        const itemSubstanceType = selectedItemData?.substanceType || selectedItem.substanceType;
                        // const currentAddedPhaseId = (currentPhase?.items||[]).find(p => p?.section === 'Added')?.id;
                        const itemData: any = {
                            order: items.length,
                            status: PHASE_ITEM_STATUS.PENDING,
                            amount: selectedItem?.amount || 1,
                            section: selectedItem?.section || 'Added',
                            initialAmount: selectedItem?.servingAmount || 1,

                        };
                        if (itemEntityType === ENTITY_TYPE.FOOD || itemEntityType === 'PATIENT_FOOD' || itemEntityType === 'PATIENT_DRINK') {
                            itemData.food = { id: selectedItem.id };
                            itemData.substanceType = itemSubstanceType || SUBSTANCE_TYPE.FOOD;
                            itemData.type = ENTITY_TYPE.FOOD;
                            if (selectedItem.weight) {
                                itemData.weight = selectedItem.weight;
                            }
                            const defaultWeight = selectedItem.weights?.find((w: any) => w.isDefault) || selectedItem.weights?.[0];
                            if (defaultWeight && !itemData.weight) {
                                itemData.weight = { id: defaultWeight.id };
                            }
                            itemData.phase = { id: targetPhaseId };
                            itemData.modified = selectedItem?.modified || false;
                            itemData.rating = 0;
                            // itemData.substanceType = "FOOD";
                            itemData.type = ENTITY_TYPE.FOOD;
                            // const addPhaseItemData: any = {
                            // amount: payload?.item?.item?.amount || 1,
                            // food: {
                            //     id: payload?.item?.item?.id
                            // },
                            // modified: false,
                            // initialAmount: 1,
                            // order: items?.length || 0,
                            // order: 0,
                            // phase: {
                            //     id: targetPhaseId as number
                            // },
                            // rating: 0,
                            // section: 'Added',
                            // substanceType: 'FOOD',
                            // type: ENTITY_TYPE.FOOD,
                            // status: PHASE_ITEM_STATUS.PENDING,
                            // weight: {
                            //     id: se
                            //   }
                            // };
                            addPhaseMealItem({
                                data: itemData,
                                phaseId: targetPhaseId,
                            });
                        } else if (itemEntityType === ENTITY_TYPE.RECIPE || itemEntityType === 'PATIENT_RECIPES' || itemEntityType === 'RESTAURANT') {
                            const hasModifiedIngredients = selectedItem.recipe?.ingredients?.some((ing: any) => ing?.modified);
                            const isCustomRecipe = selectedItem.recipe && hasModifiedIngredients;

                            if (isCustomRecipe) {
                                itemData.type = 'RECIPE';
                                itemData.recipe = { ...selectedItem.recipe, modified: true };
                                await addPhaseCustomRecipe({
                                    phaseId: targetPhaseId,
                                    data: itemData,
                                });
                            } else {

                                itemData.type = 'RECIPE';
                                itemData.recipe = { ...selectedItem.recipe, modified: true };
                                if (selectedItem.serving) {
                                    itemData.serving = selectedItem?.serving;
                                    itemData.useServing = true;
                                }
                                // await addPhaseRecipe({
                                //     phaseId: currentAddedPhaseId,
                                //     data: itemData,
                                // });
                                await addPhaseCustomRecipe({
                                    phaseId: targetPhaseId,
                                    data: itemData,
                                });
                            }
                        } else if (itemEntityType === ENTITY_TYPE.MEASUREMENT) {
                            itemData.measurement = { id: selectedItem.id };
                            itemData.type = ENTITY_TYPE.MEASUREMENT;
                            await updatePhaseItem({
                                id: currentPhase?.id,
                                phaseId: targetPhaseId,
                                data: itemData,
                            });
                        } else if (itemEntityType === ENTITY_TYPE.MEDICATION) {
                            itemData.medication = { id: selectedItem.id };
                            itemData.type = ENTITY_TYPE.MEDICATION;
                            await updatePhaseItem({
                                id: currentPhase?.id,
                                phaseId: targetPhaseId,
                                data: itemData,
                            });
                        } else if (itemEntityType === ENTITY_TYPE.SUPPLEMENT) {
                            itemData.supplement = { id: selectedItem.id };
                            itemData.type = ENTITY_TYPE.SUPPLEMENT;
                            await updatePhaseItem({
                                id: currentPhase?.id,
                                phaseId: targetPhaseId,
                                data: itemData,
                            });
                        } else if (itemEntityType === ENTITY_TYPE.PHYSICAL_ACTIVITY) {
                            itemData.physicalActivity = { id: selectedItem.id };
                            itemData.type = ENTITY_TYPE.PHYSICAL_ACTIVITY;
                            await updatePhaseItem({
                                id: currentPhase.id,
                                phaseId: targetPhaseId,
                                data: itemData,
                            });
                        }
                    } catch (error) {
                        console.error('Error adding item:', error);
                    }
                }
            });
            return;
        }

        navigation.navigate(ROUTES.ADD_REPLACE_ITEM, {
            date: targetDate,
            prevItem: null,
            excludeIds,
            entityType,
            onApply: async (payload: any) => {
                try {
                    const selectedItem = payload.item || payload;
                    const itemEntityType = payload.entityType || entityType;

                    const itemData: any = {
                        order: items.length,
                        status: PHASE_ITEM_STATUS.PENDING,
                        amount: selectedItem.amount || 1,
                    };

                    if (itemEntityType === ENTITY_TYPE.MEASUREMENT) {
                        itemData.measurement = { id: selectedItem?.id };
                        itemData.type = ENTITY_TYPE.MEASUREMENT;
                    } else if (itemEntityType === ENTITY_TYPE.MEDICATION) {
                        itemData.medication = { id: selectedItem?.id };
                        itemData.type = ENTITY_TYPE.MEDICATION;
                    } else if (itemEntityType === ENTITY_TYPE.SUPPLEMENT) {
                        itemData.supplement = { id: selectedItem?.id };
                        itemData.type = ENTITY_TYPE.SUPPLEMENT;
                    } else if (itemEntityType === ENTITY_TYPE.PHYSICAL_ACTIVITY) {
                        itemData.physicalActivity = { id: selectedItem?.id };
                        itemData.type = ENTITY_TYPE.PHYSICAL_ACTIVITY;
                    }

                    // await updatePhaseItem({
                    //     id: selectedItem?.recipe?.id,
                    //     phaseId: targetPhaseId,
                    //     data: itemData,
                    // });

                    await addPhaseItem({
                        phaseId: targetPhaseId,
                        data: itemData,
                    });
                } catch (error) {
                    console.error('Error adding item:', error);
                }
            }
        });
    };

    const handlePhaseDone = async () => {
        if (!targetPhaseId) { return; }

        try {
            await updatePhase({
                id: targetPhaseId,
                data: { status: PHASE_ITEM_STATUS.DONE }
            });
            (navigation as any).navigate('Overview');
        } catch (error) {
            console.error('Error marking phase as done:', error);
        }
    };

    const [seeds, setSeeds] = useState<SeedsCoordinates[]>([]);
    const [adjustedX, setAdjustedX] = useState<number>(0);
    const handleCheckboxStatus = async (item: PhaseItem, checkboxCoordinate?: CheckboxCoordinate) => {
        if (!adjustedX && checkboxCoordinate?.x) {
            setAdjustedX(checkboxCoordinate.x);
        }
        if (item.status === 'DONE' && checkboxCoordinate?.centerX && checkboxCoordinate?.centerY) {
            setSeeds([...seeds, { centerX: checkboxCoordinate.centerX, centerY: checkboxCoordinate.centerY }]);
        }
        try {
            // let newStatus: string;
            // const status = isDidNotEatItem
            // ? PHASE_ITEM_STATUS.DID_NOT_EAT
            // : isItemChecked
            //     ? PHASE_ITEM_STATUS.DONE
            //     : PHASE_ITEM_STATUS.PENDING;
            // switch (item.status) {
            //     case PHASE_ITEM_STATUS.DID_NOT_EAT:
            //         newStatus = PHASE_ITEM_STATUS.DID_NOT_EAT;
            //         break;
            //     case PHASE_ITEM_STATUS.DONE:
            //         newStatus = PHASE_ITEM_STATUS.DONE;
            //         break;
            //     case PHASE_ITEM_STATUS.PENDING:
            //         newStatus = PHASE_ITEM_STATUS.DONE;
            //         break;
            //     default:
            //         newStatus = PHASE_ITEM_STATUS.DID_NOT_EAT;

            // }
            // switch (item.status) {
            //     case PHASE_ITEM_STATUS.DONE:
            //     case PHASE_ITEM_STATUS.DID_NOT_EAT:
            //         newStatus = PHASE_ITEM_STATUS.PENDING;
            //         break;
            //     case PHASE_ITEM_STATUS.PENDING:
            //         newStatus = PHASE_ITEM_STATUS.DONE;
            //         break;
            //     default:
            //         newStatus = PHASE_ITEM_STATUS.DID_NOT_EAT;
            // }
            // await updatePhaseItem({
            //     id: item.id,
            //     data: {
            //         ...item,
            //         status: newStatus,
            //         amount: item.amount || item.initialAmount
            //     }
            // });


            await updatePhaseItem({
                id: item.id,
                phaseId: targetPhaseId,
                data: {
                    ...item,
                    // status: newStatus,
                    amount: item.amount || item.initialAmount
                }
            });
            setLocalItems(prevItems =>
                prevItems.map(prevItem =>
                    (prevItem.id === item.id
                        ? { ...item }
                        // ? { ...prevItem, status: newStatus }
                        : prevItem)
                )
            );
        } catch (error) {
            console.error('Error updating item status:', error);
            setLocalItems(items);
        }
    };

    const handleDeleteItem = async (item: PhaseItem) => {
        try {
            setLocalItems(prevItems => prevItems.filter(prevItem => prevItem.id !== item.id));
            await deletePhaseItem({ id: item.id, phaseId: targetPhaseId });
        } catch (error) {
            console.error('Error deleting item:', error);
            setLocalItems(items);
        }
    };

    const handleReplaceItem = async (prevItem: PhaseItem) => {
        if (!includeRescueFoodsInShoppingList) {
            setShowRescueFoodsModal(true);
            return;
        }

        const prevItemWithoutRating = { ...prevItem, rating: null };

        switch (prevItem.type) {
            case ENTITY_TYPE.FOOD: {
                navigation.navigate(ROUTES.TREE_ADD_REPLACE_ITEM, {
                    date: targetDate,
                    entityType: prevItem.substanceType === 'DRINK' ? 'PATIENT_DRINK' : 'PATIENT_FOOD',
                    substanceType: prevItem.substanceType || 'FOOD',
                    prevItem: prevItemWithoutRating,
                    onApply: (data: any) => {
                        setReplacementData({
                            prevItem: prevItemWithoutRating,
                            nextItem: data.item || data,
                        });
                        setShowConfirmationModal(true);
                    },
                });
                break;
            }
            case ENTITY_TYPE.RECIPE: {
                if (prevItem.recipe?.surrogateRecipe) {
                    navigation.navigate(ROUTES.TREE_ADD_REPLACE_ITEM, {
                        date: targetDate,
                        entityType: 'PATIENT_FOOD',
                        prevItem: prevItemWithoutRating,
                        substanceType: prevItem.substanceType || 'FOOD',
                        onApply: (data: any) => {
                            setReplacementData({
                                prevItem: prevItemWithoutRating,
                                nextItem: data.item || data,
                            });
                            setShowConfirmationModal(true);
                        },
                    });
                } else {
                    navigation.navigate(ROUTES.TREE_ADD_REPLACE_ITEM, {
                        date: targetDate,
                        entityType: 'PATIENT_RECIPES',
                        prevItem: prevItemWithoutRating,
                        substanceType: prevItem.substanceType || 'FOOD',
                        onApply: (data: any) => {
                            setReplacementData({
                                prevItem: prevItemWithoutRating,
                                nextItem: data.item || data,
                            });
                            setShowConfirmationModal(true);
                        },
                    });
                }
                break;
            }
            case ENTITY_TYPE.MEASUREMENT:
            case ENTITY_TYPE.SUPPLEMENT:
            case ENTITY_TYPE.MEDICATION:
            case ENTITY_TYPE.PHYSICAL_ACTIVITY: {
                const excludeIds = items.map(item => String(item.id));

                navigation.navigate(ROUTES.ADD_REPLACE_ITEM, {
                    excludeIds,
                    date: targetDate,
                    entityType: prevItem.type,
                    prevItem: prevItemWithoutRating,
                    onApply: (data: any) => {
                        handleConfirmReplaceItem(prevItemWithoutRating, data.item, getFieldForType(prevItem.type));
                    },
                });
                break;
            }
            default:
                console.warn('Unknown item type for replacement:', prevItem.type);
        }
    };

    const getFieldForType = (type: string): string => {
        switch (type) {
            case ENTITY_TYPE.FOOD:
                return 'food';
            case ENTITY_TYPE.RECIPE:
                return 'recipe';
            case ENTITY_TYPE.MEASUREMENT:
                return 'measurement';
            case ENTITY_TYPE.SUPPLEMENT:
                return 'supplement';
            case ENTITY_TYPE.MEDICATION:
                return 'medication';
            case ENTITY_TYPE.PHYSICAL_ACTIVITY:
                return 'physicalActivity';
            default:
                return 'food';
        }
    };

    const handleConfirmationModalApply = useCallback(async ({ prevItem, nextItem }: { prevItem: any; nextItem: any }) => {
        try {
            const replacementId = nextItem?.id || nextItem?.item?.id;

            await replacePhaseItem({
                replacementId,
                itemId: prevItem.id,
                phaseId: targetPhaseId,
            });
        } catch (error) {
            console.error('Error replacing item:', error);
        }
    }, [replacePhaseItem, targetPhaseId]);

    const handleConfirmReplaceItem = async (prevItem: PhaseItem, nextItem: any, field: string) => {
        try {
            await replacePhaseItem({
                itemId: prevItem.id,
                phaseId: targetPhaseId,
                replacementId: nextItem.id,
            });
        } catch (error) {
            console.error('Error replacing item:', error);
        }
    };

    const handleNoReplaceItem = (item: PhaseItem) => {
        // return true if item should not be replaced
        // return !item.recipe || item.recipe?.surrogateRecipe || item.section !== SECTION.ADDED_BY_HEALTHENE;
        return item?.recipe && item.section === SECTION.ADDED_BY_HEALTHENE;

    };

    const handleScrollEnabled = () => setScrollEnabled(true);
    const handleScrollDisabled = (sv: SwipeValueChange) => {
        if (sv.value !== 0) {
            setScrollEnabled(false);
        }
    };

    /****** Bord animation trigger *****/
    const [birdAnimationStep, setBirdAnimationStep] = useState(false);
    useEffect(() => {
        if ((localItems || []).length > 0) {
            const allDone = localItems.every(item => item.status === 'DONE');
            setBirdAnimationStep(allDone);
        }
    }, [localItems]);


    const isLoading = isDayOverviewLoading || isPhaseItemsLoading;

    if (isLoading) {
        return (
            <View style={styles.section}>
                <Skeleton width={200} height={20} />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: OFFSET.HORIZONTAL * 2 }} >
                    <ListItemSkeleton />
                    <Skeleton width={25} height={25} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: OFFSET.HORIZONTAL * 2 }} >
                    <ListItemSkeleton />
                    <Skeleton width={25} height={25} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: OFFSET.HORIZONTAL * 2 }} >
                    <ListItemSkeleton />
                    <Skeleton width={25} height={25} />
                </View>
                <Skeleton width={200} height={20} />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: OFFSET.HORIZONTAL * 2 }} >
                    <ListItemSkeleton />
                    <Skeleton width={25} height={25} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: OFFSET.HORIZONTAL * 2 }} >
                    <ListItemSkeleton />
                    <Skeleton width={25} height={25} />
                </View>
                <Skeleton width={200} height={20} />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: OFFSET.HORIZONTAL * 2 }} >
                    <ListItemSkeleton />
                    <Skeleton width={25} height={25} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: OFFSET.HORIZONTAL * 2 }} >
                    <ListItemSkeleton />
                    <Skeleton width={25} height={25} />
                </View>
                {/* <ListItemSkeleton showImage={false} lines={3} /> */}
            </View>
        );
    }
    const groupedBySection = groupBy(localItems, 'section');
    const title = currentPhase?.meal?.name
                  || (currentPhase?.type === 'QUESTION' ? 'Health Question'
                      : currentPhase?.type === 'ANYTIME' ? 'Anytime'
                          : convertTypeToTitle(currentPhase?.type || '', true));
    const isPastDate = moment(targetDate).isBefore(moment(), 'day');
    const isFutureDate = moment(targetDate).isAfter(moment(), 'day');

    return (
        <Screen initialized={!isLoading} style={styles.container}>
            <SeedsAnimation seeds={seeds} />
            {(currentPhase?.type === OVERVIEW_TYPE.MEAL)
                ? <BirdAnimation startAnimation={ birdAnimationStep } adjustedX={adjustedX} />
                : null
            }
            <View style={[styles.title, isFutureDate && styles.opacity]}>
                <View>
                    <Text style={styles.titleText}>
                        {title}
                    </Text>
                </View>
                {currentPhase?.type === OVERVIEW_TYPE.MEAL && !isPastDate && (
                    <View style={styles.titleButtons}>
                        <TouchableOpacity onPress={() => {
                            if (includeRescueFoodsInShoppingList) {
                                navigation.navigate(ROUTES.REPLACEMENT, {
                                    list: [],
                                    date: targetDate,
                                    phaseId: targetPhaseId,
                                    isRestaurantMode: false,
                                });
                            } else {
                                setShowRescueFoodsModal(true);
                            }
                        }}>
                            <Text style={{ textDecorationLine: 'underline' }} color={theme.colors.primary}>
                Change Meal
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={styles.list}>
                <ScrollView style={isFutureDate && styles.opacity} scrollEnabled={scrollEnabled}>
                    {!isEmpty(localItems) ? (
                        Object.entries(groupedBySection).map(([section, sectionItems]) => (
                            <SwipeList
                                key={section}
                                data={sectionItems}
                                scrollEnabled={false}
                                isPastDate={isPastDate}
                                isFutureDate={isFutureDate}
                                onDelete={handleDeleteItem}
                                onReplace={handleReplaceItem}
                                recipeReplacementEnable={true}
                                type={currentPhase?.type || ''}
                                noReplaceItem={handleNoReplaceItem}
                                onRowDidClose={handleScrollEnabled}
                                onSwipeValueChange={handleScrollDisabled}
                                handleCheckboxStatus={handleCheckboxStatus}
                                keyExtractor={({ id, status }) => String(status + id)}
                                renderItem={({ item }) => (
                                    <ListItem
                                        item={item}
                                        disabled={false}
                                        date={targetDate}
                                        updateData={updatePhaseItem}
                                        nextSection={item?.section || ''}
                                        handleCheckboxStatus={handleCheckboxStatus}
                                    />
                                )}
                                ListHeaderComponent={() => (
                                    (sectionItems[0]?.food || sectionItems[0]?.recipe) ? (
                                        <View style={[
                                            styles.separatorWrapper,
                                            {
                                                // borderTopColor: theme.colors.black,
                                                // borderTopWidth: section === 'Added' ? 0 : 1,
                                                backgroundColor: section === 'Added' ? '#E0EBF7' : `${theme.colors.lightGrey}`
                                            }
                                        ]}>
                                            <Text variant="h3" style={styles.offset}>
                                                {section || 'No section'}
                                            </Text>
                                        </View>
                                    ) : null
                                )}
                            />
                        ))
                    ) : (
                        <Text style={[styles.emptyScreen, { textAlign: 'center', color: theme.colors.grey }]}>
              No items found
                        </Text>
                    )}
                </ScrollView>

                {/* {(currentPhase?.type === OVERVIEW_TYPE.MEAL
                  || currentPhase?.type === OVERVIEW_TYPE.ADDED_BY_PATIENT) ? ( */}
                <View style={styles.buttonContainer}>
                    <Button
                        icon="plus"
                        title="Add"
                        variant="primary"
                        onPress={handleAddItem}
                        textStyle={styles.textAddButton}
                        style={{
                            ...styles.button,
                            ...styles.addButtonActive,
                            width: isFutureDate ? '100%' : '45%',
                            backgroundColor: theme.colors.transparent,
                        }}
                    />
                    {!isFutureDate && (
                        <Button
                            title="Meal Done"
                            variant="secondary"
                            onPress={handlePhaseDone}
                            textStyle={styles.textMealDoneButton}
                            style={{
                                ...styles.button,
                                ...styles.mealDoneButton,
                            }}
                        />
                    )}
                </View>
                {/* ) : (
                        <Button
                            icon="plus"
                            title="Add"
                            variant="primary"
                            onPress={handleAddItem}
                            textStyle={{ color: '#7BAAC2' }}
                            style={{
                                // ...styles.button,
                                // ...styles.addButton,
                                ...styles.button,
                                ...styles.addButtonActive,
                                // width: isFutureDate ? '100%' : '45%',
                                backgroundColor: theme.colors.transparent,
                            }}
                        />
                    )} */}
            </View>

            {/* Rescue Foods Modal */}
            <ReplaceItemModal
                visible={showRescueFoodsModal}
                onClose={() => setShowRescueFoodsModal(false)}
                onApply={async () => {
                    try {
                        await updateIncludeRescueFoods({ includeRescueFoodsInShoppingList: true }).unwrap();
                        navigation.navigate(ROUTES.REPLACEMENT, {
                            list: [],
                            date: targetDate,
                            phaseId: targetPhaseId,
                            isRestaurantMode: false,
                        });
                    } catch (error) {
                        console.error('Change Meal error:', error);
                    }
                }}
            />

            <ConfirmationReplaceModal
                visible={showConfirmationModal}
                prevItem={replacementData.prevItem}
                nextItem={replacementData.nextItem}
                onClose={() => {
                    setShowConfirmationModal(false);
                    setReplacementData({ prevItem: null, nextItem: null });
                }}
                onApply={handleConfirmationModalApply}
            />

            <AnytimeMenu date={targetDate} />
        </Screen>
    );
};

export default Edit;

const styles = StyleSheet.create({
    container: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    title: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#E0EBF7',
    },
    titleText: {
        color: '#181818',
        fontSize: 18,
        fontWeight: '600',
    },
    titleButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    list: {
        flex: 1,
        justifyContent: 'space-between',
    },
    separatorWrapper: {
        backgroundColor: '#F3F3F380', // 50% opacity
        paddingTop: 10,
        paddingBottom: 10,
        // marginBottom: 10,
    },
    offset: {
        // color: '#7B7B7B',
        marginLeft: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: OFFSET.HORIZONTAL * 1.5,
        marginBottom: OFFSET.VERTICAL,
    },
    mealDoneButton: {
        borderWidth: 0,
        backgroundColor: '#BCE8A6',
    },
    mealDoneButtonDisabled: {},
    addButton: {
        width: '90%',
        borderColor: '#7BAAC2',
        borderStyle: 'dashed',
        alignSelf: 'center',
    },
    button: {
        width: '45%',
        paddingTop: 15,
        paddingBottom: 15,
    },
    emptyScreen: {
        marginTop: OFFSET.VERTICAL * 2,
    },
    opacity: {
        opacity: 0.4,
    },
    textAddButton: {
        color: '#7BAAC2',
        fontSize: 20,
        fontWeight: '500',
    },
    addButtonActive: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#7BAAC2',
        width: '45%',
    },
    textMealDoneButton: {
        color: '#4E733C',
        fontSize: 20,
        fontWeight: '500',
    },
    section: {
        marginVertical: OFFSET.VERTICAL * 3,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    sectionTitle: {
        marginBottom: OFFSET.VERTICAL,
    }
});
