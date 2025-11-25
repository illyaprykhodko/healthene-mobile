// outsource dependencies
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
// local dependencies
import ListItem from './ListItem';
import Text from 'components/Text';
import { useAppSelector } from 'store';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { Button } from 'components/Button';
import { PhaseItem } from 'types/overview';
import SwipeList from 'components/SwipeList';
import { groupBy, isEmpty } from 'utils/general';
import { RootStackParamList } from 'services/navigation';
import ReplaceItemModal from 'components/modals/ReplaceItemModal';
import { selectDayOverview } from 'store/slices/dayOverviewSlice';
import { OVERVIEW_TYPE, ENTITY_TYPE, SECTION, PHASE_ITEM_STATUS } from 'constants/spec';
import { useGetDayOverviewQuery, useGetPhaseItemsQuery, useUpdatePhaseItemMutation,
    useDeletePhaseItemMutation, useAddPhaseItemMutation, useUpdatePhaseMutation, useReplacePhaseItemMutation,
    useUpdateIncludeRescueFoodsMutation } from 'store/api/dayOverviewApi';


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
    const includeRescueFoodsInShoppingList = useAppSelector(state => state.app?.user?.includeRescueFoodsInShoppingList);
    const targetDate = date || currentDate || moment().format('YYYY-MM-DD');
    const targetPhaseId = phaseId || route.params?.phaseId;
  
    // get day overview data
    const { data: dayOverviewData, isLoading: isDayOverviewLoading } = useGetDayOverviewQuery(targetDate, {
        skip: !targetDate,
    });
  
    // get phase items
    const { data: phaseItems, isLoading: isPhaseItemsLoading } = useGetPhaseItemsQuery(targetPhaseId, {
        skip: !targetPhaseId,
        refetchOnFocus: true,
        refetchOnReconnect: true,
        // refetchOnMountOrArgChange: true,
    });
    // mutations
    const [updatePhase] = useUpdatePhaseMutation();
    const [addPhaseItem] = useAddPhaseItemMutation();
    const [deletePhaseItem] = useDeletePhaseItemMutation();
    const [replacePhaseItem] = useReplacePhaseItemMutation();
    const [updateIncludeRescueFoods] = useUpdateIncludeRescueFoodsMutation();
    const [updatePhaseItem, { isLoading: isUpdatePhaseItemLoading }] = useUpdatePhaseItemMutation();

    const currentPhase = dayOverviewData?.phases?.find(phase => phase.id === targetPhaseId);
  
    const items: PhaseItem[] = React.useMemo(() => {
        if (!phaseItems) { return []; }
    
        const flatItems: PhaseItem[] = [];
        Object.entries(phaseItems).forEach(([type, typeItems]) => {
            (typeItems as any[]).forEach((item: any) => {
                flatItems.push({
                    id: item.id,
                    type: item.type,
                    food: item.food,
                    order: item.order,
                    phase: item.phase,
                    recipe: item.recipe,
                    status: item.status,
                    amount: item.amount,
                    weight: item.weight,
                    rating: item.rating,
                    serving: item.serving,
                    section: item.section,
                    modified: item.modified,
                    useServing: item.useServing,
                    medication: item.medication,
                    supplement: item.supplement,
                    measurement: item.measurement,
                    initialAmount: item.initialAmount,
                    physicalActivity: item.physicalActivity,
                    peopleEatingNumber: item.peopleEatingNumber,
                    patientFoodCategoryQuestion: item.patientFoodCategoryQuestion,
                    recipeOilyFishProteinReplaced: item.recipeOilyFishProteinReplaced,
                    patientFoodCategoryAttachment: item.patientFoodCategoryAttachment,
                    title: item.food?.name || item.recipe?.name || item.measurement?.name || item.medication?.name || item.supplement?.name || item.physicalActivity?.name || 'Item',
                });
            });
        });
    
        return flatItems.sort((a, b) => (a.order || 0) - (b.order || 0));
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
    
        navigation.navigate(ROUTES.ADD_REPLACE_ITEM, {
            date: targetDate,
            prevItem: null,
            excludeIds,
            entityType,
            onApply: async (selectedItem: any) => {
                try {
                    await addPhaseItem({
                        phaseId: targetPhaseId,
                        data: {
                            type: entityType,
                            order: items.length,
                            name: selectedItem.name,
                            status: PHASE_ITEM_STATUS.PENDING,
                        }
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

    const handleCheckboxStatus = async (item: PhaseItem) => {
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

            setLocalItems(prevItems =>
                prevItems.map(prevItem =>
                    (prevItem.id === item.id
                        ? { ...item }
                        // ? { ...prevItem, status: newStatus }
                        : prevItem)
                )
            );
            await updatePhaseItem({
                id: item.id,
                phaseId: targetPhaseId,
                data: {
                    ...item,
                    // status: newStatus,
                    amount: item.amount || item.initialAmount
                }
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
            // await deletePhaseItem(item.id);
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
                        handleConfirmReplaceFood(prevItemWithoutRating, data.item);
                    },
                });
                break;
            }
            case ENTITY_TYPE.RECIPE: {
                if (prevItem.recipe?.surrogateRecipe) {
                    navigation.navigate(ROUTES.ADD_REPLACE_RECIPE, {
                        date: targetDate,
                        entityType: 'SURROGATE_RECIPE',
                        title: currentPhase?.meal?.name || 'Meal',
                        prevItem: prevItemWithoutRating,
                        phaseId: targetPhaseId,
                    });
                } else {
                    navigation.navigate(ROUTES.ADD_REPLACE_RECIPE, {
                        date: targetDate,
                        entityType: 'RECIPE',
                        title: currentPhase?.meal?.name || 'Meal',
                        prevItem: prevItemWithoutRating,
                        phaseId: targetPhaseId,
                    });
                }
                break;
            }
            case ENTITY_TYPE.MEASUREMENT:
            case ENTITY_TYPE.SUPPLEMENT:
            case ENTITY_TYPE.MEDICATION:
            case ENTITY_TYPE.PHYSICAL_ACTIVITY: {
                // Navigate to simple list-based selection
                const excludeIds = items.map(item => String(item.id));
                
                navigation.navigate(ROUTES.ADD_REPLACE_ITEM, {
                    date: targetDate,
                    prevItem: prevItemWithoutRating,
                    entityType: prevItem.type,
                    excludeIds,
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

    const handleConfirmReplaceFood = async (prevItem: PhaseItem, nextItem: any) => {
        try {
            await replacePhaseItem({
                itemId: prevItem.id,
                phaseId: targetPhaseId,
                replacementItem: {
                    id: nextItem.id,
                    type: nextItem.type,
                    name: nextItem.name,
                },
            });
        } catch (error) {
            console.error('Error replacing food item:', error);
        }
    };

    const handleConfirmReplaceItem = async (prevItem: PhaseItem, nextItem: any, field: string) => {
        try {
            await replacePhaseItem({
                itemId: prevItem.id,
                phaseId: targetPhaseId,
                replacementItem: {
                    id: nextItem.id,
                    type: nextItem.type,
                    name: nextItem.name,
                },
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
    const handleScrollDisabled = () => setScrollEnabled(false);

    const isLoading = isDayOverviewLoading || isPhaseItemsLoading;
  
    if (isLoading) {
        return (
            <Screen initialized={false} style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>Loading...</Text>
                </View>
            </Screen>
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
});
