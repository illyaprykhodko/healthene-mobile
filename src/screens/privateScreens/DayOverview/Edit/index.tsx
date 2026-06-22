// outsource dependencies
import moment from 'moment';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';

// local dependencies
import {
    useGetPhaseItemsQuery,
    useGetDayOverviewQuery,
    useUpdatePhaseMutation,
    useAddPhaseItemMutation,
    useUpdatePhaseItemMutation,
    useDeletePhaseItemMutation,
    useAddPhaseMealItemMutation,
    useReplacePhaseItemMutation,
    useInterchangeMealsMutation,
    useAddPhaseCustomRecipeMutation,
    useUpdateIncludeRescueFoodsMutation
} from 'store/api/dayOverviewApi';
import ListItem from './ListItem';
import { config } from 'constants';
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { COLORS } from 'constants/colors';
import { Button } from 'components/Button';
import { PhaseItem } from 'types/overview';
import { useHaptic } from 'hooks/useHaptic';
import { groupBy, isEmpty } from 'utils/general';
import { AnytimeMenu } from 'components/AnytimeMenu';
import { GlassSurface } from 'components/GlassSurface';
import { useAppSelector, useAppDispatch } from 'store';
import { RootStackParamList } from 'services/navigation';
import { RewardStarOverlay } from 'components/RewardStar';
import { BirdAnimation } from 'animation/BirdAnimation.tsx';
import ConfirmationAlert from 'components/ConfirmationAlert';
import { selectBirdSoundEnabled } from 'store/slices/appSlice';
import { ListItemSkeleton, Skeleton } from 'components/Skeleton';
import ReplaceItemModal from 'components/modals/ReplaceItemModal';
import SwipeList, { SwipeValueChange } from 'components/SwipeList';
import { CelebrationConfetti } from 'components/CelebrationConfetti';
import ConfirmationReplaceModal from 'components/modals/ConfirmationReplaceModal';
import { useUpdatePatientGamblingPointsMutation } from 'store/api/gamblingPointsApi.ts';
import { OVERVIEW_TYPE, ENTITY_TYPE, SECTION, PHASE_ITEM_STATUS, SUBSTANCE_TYPE } from 'constants/spec';
import { selectDayOverview, addRecentlyCompletedPhase, meta as dayOverviewMeta } from 'store/slices/dayOverviewSlice';

interface EditProps {
    date?: string;
    phaseId?: string | number;
}

const convertTypeToTitle = (type: string, capitalize = false) => {
    const title = type.replace(/_/g, ' ').toLowerCase();
    return capitalize ? title.charAt(0).toUpperCase() + title.slice(1) : title;
};

const SWIPE_LOCK_THRESHOLD = 12;

export const Edit: React.FC<EditProps> = ({ phaseId, date }) => {
    const theme = useTheme();
    const route = useRoute<any>();
    const dispatch = useAppDispatch();
    const { date: currentDate } = useAppSelector(selectDayOverview);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [scrollEnabled, setScrollEnabled] = useState(true);
    const [localItems, setLocalItems] = useState<PhaseItem[]>([]);
    const [isAddingAddedItem, setIsAddingAddedItem] = useState(false);
    const [shouldScrollToAddedEnd, setShouldScrollToAddedEnd] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const [showRescueFoodsModal, setShowRescueFoodsModal] = useState(false);

    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showSwapConfirmation, setShowSwapConfirmation] = useState(false);
    const [replacementData, setReplacementData] = useState<{ prevItem: PhaseItem | null; nextItem: any }>({
        prevItem: null,
        nextItem: null,
    });
    const includeRescueFoodsInShoppingList = useAppSelector(state => state.app?.user?.includeRescueFoodsInShoppingList);
    const birdSoundEnabled = useAppSelector(selectBirdSoundEnabled);
    const targetDate = date || currentDate || moment().format('YYYY-MM-DD');
    const initialPhaseId = phaseId || route.params?.phaseId;

    // Phase ids are date-specific (Breakfast on May 27 != Breakfast on May 28). The header
    // date arrows only change the date, so we re-resolve the phase id for the viewed day by
    // matching the opened phase's identity (meal name, or type for non-meal phases).
    const phaseIdentityRef = useRef<{ type?: string; mealName?: string } | null>(null);
    // `any` mirrors the previous `route.params?.phaseId` typing; call sites are runtime-guarded
    // by `if (!targetPhaseId || !currentPhase) return`, so the undefined (no-match) case is safe.
    const [targetPhaseId, setTargetPhaseId] = useState<any>(initialPhaseId);

    const haptics = useHaptic();
    const [birdAnimationStep, setBirdAnimationStep] = useState(false);
    const [birdCheckTrigger, setBirdCheckTrigger] = useState(0);
    const [celebrateSignal, setCelebrateSignal] = useState(0);
    const [checkboxAreaX] = useState(0);
    useEffect(() => {
        if ((localItems || []).length > 0) {
            const allDone = localItems.every(
                listItem => listItem.status === PHASE_ITEM_STATUS.DONE || listItem.status === PHASE_ITEM_STATUS.DID_NOT_EAT
            );
            setBirdAnimationStep(allDone);
        }
    }, [localItems]);

    const allItemsDone = useMemo(
        () =>
            localItems.length > 0
            && localItems.every(
                listItem =>
                    listItem.status === PHASE_ITEM_STATUS.DONE
                    || listItem.status === PHASE_ITEM_STATUS.DID_NOT_EAT
            ),
        [localItems]
    );

    const { currentData: dayOverviewData } = useGetDayOverviewQuery(targetDate, {
        skip: !targetDate,
    });

    // Capture the opened phase's identity once, then re-point targetPhaseId at the matching
    // phase whenever the viewed day changes. Resolves to undefined if the new day has no such
    // phase (e.g. no Breakfast planned) — the screen then shows its empty state.
    useEffect(() => {
        const phases = dayOverviewData?.phases;
        if (!phases?.length) { return; }

        if (!phaseIdentityRef.current) {
            const opened = phases.find(phase => phase.id === initialPhaseId);
            if (opened) {
                phaseIdentityRef.current = { type: opened.type, mealName: opened.meal?.name };
            }
        }

        const identity = phaseIdentityRef.current;
        if (!identity) { return; }

        const match = phases.find(phase =>
            (identity.mealName ? phase.meal?.name === identity.mealName : phase.type === identity.type));
        setTargetPhaseId(match?.id);
    }, [dayOverviewData, initialPhaseId]);

    const {
        currentData: phaseItems,
        refetch: refetchPhaseItems,
        isLoading: isPhaseItemsLoading
    } = useGetPhaseItemsQuery(targetPhaseId, {
        skip: !targetPhaseId,
    });
    // mutations
    const [addPhaseItem] = useAddPhaseItemMutation();
    const [deletePhaseItem] = useDeletePhaseItemMutation();
    // const [addPhaseRecipe] = useAddPhaseRecipeMutation();
    const [replacePhaseItem] = useReplacePhaseItemMutation();
    const [addPhaseMealItem] = useAddPhaseMealItemMutation();
    const [addPhaseCustomRecipe] = useAddPhaseCustomRecipeMutation();
    const [updateIncludeRescueFoods] = useUpdateIncludeRescueFoodsMutation();
    const [updatePatientGamblingPoints] = useUpdatePatientGamblingPointsMutation();
    const [updatePhase, { isLoading: isUpdatingPhase }] = useUpdatePhaseMutation();
    const [interchangeMeals, { isLoading: isSwapping }] = useInterchangeMealsMutation();
    const [updatePhaseItem, { isLoading: isUpdatingPhaseItem }] = useUpdatePhaseItemMutation();
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
    // Drop the previous day's items the moment the phase context changes, so they don't
    // linger while the new day's items load (or stay empty if nothing is planned).
    useEffect(() => {
        setLocalItems([]);
    }, [targetPhaseId]);

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
                prevItem: null,
                date: targetDate,
                substanceType: 'FOOD',
                entityType: 'PATIENT_FOOD',
                onApply: async (payload: any) => {
                    let isAddSuccessful = false;
                    setShouldScrollToAddedEnd(true);
                    setIsAddingAddedItem(true);
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
                            initialAmount: selectedItem?.amount || 1,
                            section: selectedItem?.section || 'Added',
                            // initialAmount: selectedItem?.servingAmount || 1,

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
                            await addPhaseMealItem({
                                data: itemData,
                                phaseId: targetPhaseId,
                            }).unwrap();
                        } else if (itemEntityType === ENTITY_TYPE.RECIPE || itemEntityType === 'PATIENT_RECIPES' || itemEntityType === 'RESTAURANT') {
                            const hasModifiedIngredients = selectedItem.recipe?.ingredients?.some((ing: any) => ing?.modified);
                            const isCustomRecipe = selectedItem.recipe && hasModifiedIngredients;

                            if (isCustomRecipe) {
                                itemData.type = 'RECIPE';
                                itemData.recipe = { ...selectedItem.recipe, modified: true };
                                await addPhaseCustomRecipe({
                                    phaseId: targetPhaseId,
                                    data: itemData,
                                }).unwrap();
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
                                }).unwrap();
                            }
                        } else if (itemEntityType === ENTITY_TYPE.MEASUREMENT) {
                            itemData.measurement = { id: selectedItem.id };
                            itemData.type = ENTITY_TYPE.MEASUREMENT;
                            await updatePhaseItem({
                                id: currentPhase?.id,
                                phaseId: targetPhaseId,
                                data: itemData,
                            }).unwrap();
                        } else if (itemEntityType === ENTITY_TYPE.MEDICATION) {
                            itemData.medication = { id: selectedItem.id };
                            itemData.type = ENTITY_TYPE.MEDICATION;
                            await updatePhaseItem({
                                id: currentPhase?.id,
                                phaseId: targetPhaseId,
                                data: itemData,
                            }).unwrap();
                        } else if (itemEntityType === ENTITY_TYPE.SUPPLEMENT) {
                            itemData.supplement = { id: selectedItem.id };
                            itemData.type = ENTITY_TYPE.SUPPLEMENT;
                            await updatePhaseItem({
                                id: currentPhase?.id,
                                phaseId: targetPhaseId,
                                data: itemData,
                            }).unwrap();
                        } else if (itemEntityType === ENTITY_TYPE.PHYSICAL_ACTIVITY) {
                            itemData.physicalActivity = { id: selectedItem.id };
                            itemData.type = ENTITY_TYPE.PHYSICAL_ACTIVITY;
                            await updatePhaseItem({
                                id: currentPhase.id,
                                phaseId: targetPhaseId,
                                data: itemData,
                            }).unwrap();
                        }
                        await refetchPhaseItems();
                        isAddSuccessful = true;
                    } catch (error) {
                        console.error('Error adding item:', error);
                        setShouldScrollToAddedEnd(false);
                    } finally {
                        setIsAddingAddedItem(false);
                        if (!isAddSuccessful) {
                            setShouldScrollToAddedEnd(false);
                        }
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
        if (!targetPhaseId || !currentPhase) {
            navigation.navigate(ROUTES.DAY_OVERVIEW);
            return;
        }

        try {
            const { items, ...phaseWithoutItems } = currentPhase as any;
            const allItemsDoneNow = localItems.every(
                listItem => listItem.status === PHASE_ITEM_STATUS.DONE || listItem.status === PHASE_ITEM_STATUS.DID_NOT_EAT
            );

            const nextPhaseStatus = allItemsDoneNow
                ? PHASE_ITEM_STATUS.DONE
                : PHASE_ITEM_STATUS.PENDING;

            await updatePhase({
                id: targetPhaseId,
                data: {
                    ...phaseWithoutItems,
                    status: nextPhaseStatus
                }
            });

            if (nextPhaseStatus === PHASE_ITEM_STATUS.DONE) {
                dispatch(addRecentlyCompletedPhase(targetPhaseId));
            }
        } catch (error) {
            console.error('Error marking phase as done:', error);
        }

        navigation.navigate(ROUTES.DAY_OVERVIEW);
    };

    const handleCheckboxStatus = async (item: PhaseItem) => {
        const prevFromList = localItems.find(prevItem => prevItem.id === item.id);
        const wasDone = prevFromList?.status === PHASE_ITEM_STATUS.DONE;
        const isNowDone = item.status === PHASE_ITEM_STATUS.DONE;
        const isMealLikePhase = currentPhase?.type === OVERVIEW_TYPE.MEAL
            || currentPhase?.type === OVERVIEW_TYPE.ADDED_BY_PATIENT;
        const mealDatePast = moment(targetDate).isBefore(moment(), 'day');
        const mealDateFuture = moment(targetDate).isAfter(moment(), 'day');

        setLocalItems(prevItems => {
            const nextItems = prevItems.map(prevItem =>
                (prevItem.id === item.id ? { ...item } : prevItem)
            );
            const allDoneNow = nextItems.every(
                listItem => listItem.status === PHASE_ITEM_STATUS.DONE || listItem.status === PHASE_ITEM_STATUS.DID_NOT_EAT
            );
            if (item.status === PHASE_ITEM_STATUS.DONE && !allDoneNow) {
                Promise.resolve().then(() => setBirdCheckTrigger(t => t + 1));
            } else if (item.status === PHASE_ITEM_STATUS.DONE && allDoneNow && !mealDateFuture) {
                // Completing the final item of the phase — celebrate.
                Promise.resolve().then(() => {
                    setCelebrateSignal(s => s + 1);
                    haptics.success();
                });
            }
            return nextItems;
        });

        try {
            await updatePhaseItem({
                id: item.id,
                phaseId: targetPhaseId,
                data: {
                    ...item,
                    amount: item.amount || item.initialAmount
                },
                date: targetDate,
            });
            if (isMealLikePhase && !mealDatePast && !mealDateFuture) {
                if (!wasDone && isNowDone) {
                    updatePatientGamblingPoints({ action: 'EARN', amount: 1 }).unwrap().catch((gamblingPointsError: unknown) => {
                        console.error('Gambling points EARN failed:', gamblingPointsError);
                    });
                } else if (wasDone && !isNowDone) {
                    updatePatientGamblingPoints({ action: 'SPEND', amount: 1 }).unwrap().catch((gamblingPointsError: unknown) => {
                        console.error('Gambling points SPEND failed:', gamblingPointsError);
                    });
                }
            }
            setLocalItems(currentItems => {
                const allItemsDoneNow = currentItems.every(
                    listItem => listItem.status === PHASE_ITEM_STATUS.DONE || listItem.status === PHASE_ITEM_STATUS.DID_NOT_EAT
                );

                if (currentPhase && targetPhaseId) {
                    const newPhaseStatus = allItemsDoneNow
                        ? PHASE_ITEM_STATUS.DONE
                        : PHASE_ITEM_STATUS.PENDING;
                    if (currentPhase.status !== newPhaseStatus) {
                        const { items, ...phaseWithoutItems } = currentPhase as any;
                        updatePhase({
                            id: targetPhaseId,
                            data: {
                                ...phaseWithoutItems,
                                status: newPhaseStatus
                            }
                        }).then(() => {
                            if (newPhaseStatus === PHASE_ITEM_STATUS.DONE) {
                                dispatch(addRecentlyCompletedPhase(targetPhaseId));
                            }
                        });
                    }
                }
                return currentItems;
            });
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
                    prevItem: prevItemWithoutRating,
                    substanceType: prevItem.substanceType || 'FOOD',
                    entityType: prevItem.substanceType === 'DRINK' ? 'PATIENT_DRINK' : 'PATIENT_FOOD',
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
                navigation.navigate(ROUTES.ADD_REPLACE_RECIPE, {
                    date: targetDate,
                    phaseId: targetPhaseId,
                    prevItem: prevItemWithoutRating,
                    title: currentPhase?.meal?.name || 'Replace Recipe',
                    entityType: prevItem.recipe?.surrogateRecipe ? 'SURROGATE_RECIPE' : 'RECIPE',
                });
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
        return !!item?.recipe && item.section === SECTION.ADDED_BY_HEALTHENE;

    };

    const handleScrollEnabled = () => {
        setScrollEnabled(true);
        // restore native-stack swipe-back gesture once the row is closed
        navigation.setOptions({ gestureEnabled: true } as any);
    };
    const handleScrollDisabled = (sv: SwipeValueChange) => {
        if (Math.abs(sv.value) > SWIPE_LOCK_THRESHOLD) {
            setScrollEnabled(false);
            // prevent iOS swipe-back from triggering while a row is open
            navigation.setOptions({ gestureEnabled: false } as any);
        }
    };

    useEffect(() => {
        return () => {
            navigation.setOptions({ gestureEnabled: true } as any);
        };
    }, [navigation]);

    const isLoading = isPhaseItemsLoading || isSwapping;

    // if (isLoading) {
    //     return (
    //         <View style={styles.section}>
    //             <Skeleton width={200} height={20} />
    //             <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: OFFSET.HORIZONTAL * 2 }} >
    //                 <ListItemSkeleton />
    //                 <Skeleton width={25} height={25} />
    //             </View>
    //             <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: OFFSET.HORIZONTAL * 2 }} >
    //                 <ListItemSkeleton />
    //                 <Skeleton width={25} height={25} />
    //             </View>
    //             <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: OFFSET.HORIZONTAL * 2 }} >
    //                 <ListItemSkeleton />
    //                 <Skeleton width={25} height={25} />
    //             </View>
    //             <Skeleton width={200} height={20} />
    //             <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: OFFSET.HORIZONTAL * 2 }} >
    //                 <ListItemSkeleton />
    //                 <Skeleton width={25} height={25} />
    //             </View>
    //             <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: OFFSET.HORIZONTAL * 2 }} >
    //                 <ListItemSkeleton />
    //                 <Skeleton width={25} height={25} />
    //             </View>
    //             <Skeleton width={200} height={20} />
    //             <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: OFFSET.HORIZONTAL * 2 }} >
    //                 <ListItemSkeleton />
    //                 <Skeleton width={25} height={25} />
    //             </View>
    //             <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: OFFSET.HORIZONTAL * 2 }} >
    //                 <ListItemSkeleton />
    //                 <Skeleton width={25} height={25} />
    //             </View>
    //             {/* <ListItemSkeleton showImage={false} lines={3} /> */}
    //         </View>
    //     );
    // }
    const groupedBySection = groupBy(localItems, 'section');
    const sortedSections = Object.entries(groupedBySection).sort(([sectionA], [sectionB]) => {
        if (sectionA === 'Added') { return 1; }
        if (sectionB === 'Added') { return -1; }
        return 0;
    });
    const title = currentPhase?.meal?.name
                  || phaseIdentityRef.current?.mealName
                  || (currentPhase?.type === 'QUESTION' ? 'Health Question'
                      : currentPhase?.type === 'ANYTIME' ? 'Anytime'
                          : convertTypeToTitle(currentPhase?.type || phaseIdentityRef.current?.type || '', true));
    const isPastDate = moment(targetDate).isBefore(moment(), 'day');
    const isFutureDate = moment(targetDate).isAfter(moment(), 'day');

    const today = moment().format('YYYY-MM-DD');
    const { currentData: todayDayOverviewData } = useGetDayOverviewQuery(today, {
        skip: !isFutureDate,
    });
    const todayMealAnalog = (todayDayOverviewData?.phases || [])
        .find((phase: any) => phase.type === OVERVIEW_TYPE.MEAL
            && phase.meal?.id
            && phase.meal.id === (currentPhase as any)?.meal?.id);
    const isInterchangeEnable = currentPhase?.type === OVERVIEW_TYPE.MEAL
        && isFutureDate
        && !!todayMealAnalog
        && (todayMealAnalog as any).status !== PHASE_ITEM_STATUS.DONE;

    const handleSwapMeal = async () => {
        if (!todayMealAnalog || !currentPhase) { return; }
        const todayPhaseId = (todayMealAnalog as any).id;
        setShowSwapConfirmation(false);
        try {
            await interchangeMeals({
                futurePhaseId: currentPhase.id,
                phaseId: todayPhaseId,
            }).unwrap();
            dispatch(dayOverviewMeta({
                date: today,
                isPastDate: false,
                isFutureDate: false,
                isCurrentDate: true,
            }));
            navigation.navigate(ROUTES.EDIT, {
                phaseId: todayPhaseId,
                isToast: false,
            });
        } catch (error) {
            console.error('Error swapping meals:', error);
        }
    };

    return (
        <Screen initialized={!isLoading} style={styles.container}>
            <CelebrationConfetti signal={celebrateSignal} />
            {config.features.birdAnimationEnabled && currentPhase?.type === OVERVIEW_TYPE.MEAL && (
                <BirdAnimation
                    muted={!birdSoundEnabled}
                    checkboxAreaX={checkboxAreaX}
                    allChecked={birdAnimationStep}
                    checkTrigger={birdCheckTrigger}
                />
            )}
            <View style={[styles.title, { backgroundColor: theme.colors.surfaceAlt }, isFutureDate && styles.opacity]}>
                <View>
                    <Text style={styles.titleText} color={theme.colors.text}>
                        {title}
                    </Text>
                </View>
                {isInterchangeEnable ? (
                    <View style={styles.titleButtons}>
                        <TouchableOpacity onPress={() => setShowSwapConfirmation(true)}>
                            <Text style={{ textDecorationLine: 'underline' }} color={theme.colors.primary}>
                                Eat Today
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : currentPhase?.type === OVERVIEW_TYPE.MEAL && !isPastDate && (
                    <View style={[styles.titleButtons, isFutureDate && styles.opacity]}>
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
            {/* if (onlyPhaseItemsFetching) {
            sortedSections.push(['Added', [{
                id: 'skeleton',
                type: ENTITY_TYPE.FOOD,
                title: 'Loading...',
                rating: null,
                order: 0,
                section: 'Added',
            } as PhaseItem]])
        } */}
            <View style={styles.list}>
                <ScrollView
                    ref={scrollViewRef}
                    scrollEnabled={scrollEnabled}
                    style={isFutureDate && styles.opacity}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => {
                        if (shouldScrollToAddedEnd && !isAddingAddedItem) {
                            setTimeout(() => {
                                scrollViewRef.current?.scrollToEnd({ animated: true });
                            }, 0);
                            setShouldScrollToAddedEnd(false);
                        }
                    }}
                >
                    {!isEmpty(localItems) ? (
                        sortedSections.map(([section, sectionItems]) => (
                            <SwipeList
                                key={section}
                                data={sectionItems}
                                scrollEnabled={false}
                                closeOnScroll={false}
                                isPastDate={isPastDate}
                                isFutureDate={isFutureDate}
                                onDelete={handleDeleteItem}
                                onReplace={handleReplaceItem}
                                recipeReplacementEnable={true}
                                type={currentPhase?.type || ''}
                                noReplaceItem={handleNoReplaceItem}
                                onRowDidClose={handleScrollEnabled}
                                directionalDistanceChangeThreshold={10}
                                onSwipeValueChange={handleScrollDisabled}
                                handleCheckboxStatus={handleCheckboxStatus}
                                keyExtractor={({ id }) => String(id)}
                                renderItem={({ item, index }, ...restProps) => {
                                    return <ListItem
                                        item={item}
                                        date={targetDate}
                                        isFutureDate={isFutureDate}
                                        updateData={updatePhaseItem}
                                        handleCheckboxStatus={handleCheckboxStatus}
                                        disabled={isUpdatingPhase || isUpdatingPhaseItem}
                                    />;
                                    // return (
                                    //     isPhaseItemsFetching
                                    //     ?
                                    //     <>
                                    //     <ListItem
                                    //        item={item}
                                    //        disabled={false}
                                    //        date={targetDate}
                                    //        isFutureDate={isFutureDate}
                                    //        updateData={updatePhaseItem}
                                    //        nextSection={item?.section || ''}
                                    //        handleCheckboxStatus={handleCheckboxStatus}
                                    //    />;
                                    //        nextSection={item?.section || ''}
                                    //        handleCheckboxStatus={handleCheckboxStatus}
                                    //    />;

                                //         <Skeleton width={200} height={20} />
                                //         </>
                                //         : <ListItem
                                //             item={item}
                                //             disabled={false}
                                //             date={targetDate}
                                //             isFutureDate={isFutureDate}
                                //             updateData={updatePhaseItem}
                                //             nextSection={item?.section || ''}
                                //             handleCheckboxStatus={handleCheckboxStatus}
                                //         />
                                // );
                                }}
                                ListHeaderComponent={() => (
                                    (sectionItems[0]?.food || sectionItems[0]?.recipe) ? (
                                        <View style={[
                                            styles.separatorWrapper,
                                            { backgroundColor: theme.colors.surfaceAlt }
                                        ]}>
                                            <Text variant="h3" style={styles.offset} color={theme.colors.text}>
                                                {section || 'No section'}
                                            </Text>
                                        </View>
                                    ) : null
                                )}
                                ListFooterComponent={() => (
                                    section === 'Added' && isAddingAddedItem ? (
                                        <View style={styles.addedSkeletonContainer}>
                                            <View style={styles.addedSkeletonRow}>
                                                <ListItemSkeleton />
                                                <Skeleton width={25} height={25} />
                                            </View>
                                        </View>
                                    ) : null
                                )}
                            />
                        ))
                    ) : (
                        <Text style={[styles.emptyScreen, { textAlign: 'center', color: theme.colors.grey }]}>
                            {currentPhase ? 'No items found' : `No "${title}" planned for this day`}
                        </Text>
                    )}
                </ScrollView>

                {/* {(currentPhase?.type === OVERVIEW_TYPE.MEAL
              || currentPhase?.type === OVERVIEW_TYPE.ADDED_BY_PATIENT) ? ( */}
                <GlassSurface
                    intensity={10}
                    style={styles.glassBar}
                    tint={theme.dark ? 'dark' : 'light'}
                >
                    <View style={styles.buttonContainer}>
                        <Button
                            icon="plus"
                            title="Add"
                            variant="primary"
                            onPress={handleAddItem}
                            disabled={isFutureDate}
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
                                disabled={!allItemsDone || isLoading}
                                textStyle={styles.textMealDoneButton}
                                style={{
                                    ...styles.button,
                                    ...styles.mealDoneButton,
                                    ...isLoading && styles.mealDoneButtonDisabled,
                                    // ...((!allItemsDone || isLoading) && styles.mealDoneButtonDisabled),
                                }}
                            />
                        )}
                    </View>
                </GlassSurface>
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

            <ConfirmationAlert
                applyTxt="Swap"
                cancelTxt="Cancel"
                title="Swap meals?"
                disabled={isSwapping}
                onSubmit={handleSwapMeal}
                message="This will swap meal"
                isOpen={showSwapConfirmation}
                onClose={() => setShowSwapConfirmation(false)}
            />

            {config.features.gamblingEnabled && (
                <RewardStarOverlay
                    gamblingPointsQueryEnabled={
                        (currentPhase?.type === OVERVIEW_TYPE.MEAL
                            || currentPhase?.type === OVERVIEW_TYPE.ADDED_BY_PATIENT)
                        && !isPastDate
                        && !isFutureDate
                    }
                />
            )}

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
        fontSize: 18,
        fontWeight: '600',
    },
    titleButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    list: {
        flex: 1,
    },
    listContent: {
        // Leave room so the last items can scroll up above the floating glass bar.
        paddingBottom: 96,
    },
    glassBar: {
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 10,
        position: 'absolute',
    },
    separatorWrapper: {
        backgroundColor: '#F3F3F380', // 50% opacity
        paddingTop: 10,
        paddingBottom: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.GREY,
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
    mealDoneButtonDisabled: {
        backgroundColor: '#E0E0E0',
        opacity: 0.6,
    },
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
    addedSkeletonContainer: {
        marginRight: OFFSET.HORIZONTAL * 2,
    },
    addedSkeletonRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
