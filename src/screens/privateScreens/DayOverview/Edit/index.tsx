// outsource dependencies
import _ from 'lodash';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
// local dependencies
import ListItem from './ListItem';
import { OVERVIEW_TYPE } from '../types';
import Text from '../../../../components/Text';
import { useAppSelector } from '../../../../store';
import Screen from '../../../../components/Screen';
import { COLORS } from '../../../../constants/colors';
import { useTheme } from '../../../../hooks/useTheme';
import { Button } from '../../../../components/Button';
import SwipeList from '../../../../components/SwipeList';
import { selectDayOverview } from '../../../../store/slices/dayOverviewSlice';
import { useGetDayOverviewQuery, useGetPhaseItemsQuery, useUpdatePhaseItemMutation,
    useDeletePhaseItemMutation, useAddPhaseItemMutation, useUpdatePhaseMutation } from '../../../../store/api/dayOverviewApi';

// Temporary types until full migration
interface PhaseItem {
    food?: any;
    recipe?: any;
    type: string;
    title: string;
    order?: number;
    amount?: number;
    status?: string;
    section?: string;
    measurement?: any;
    id: string | number;
    initialAmount?: number;
}

interface EditProps {
    date?: string;
    phaseId?: string | number;
}

// Temporary constants until full migration
// const OVERVIEW_TYPE = {
//     MEAL: 'MEAL',
//     SUPPLEMENT: 'SUPPLEMENT',
//     MEDICATION: 'MEDICATION',
//     MEASUREMENT: 'MEASUREMENT',
//     ADDED_BY_PATIENT: 'ADDED_BY_PATIENT',
//     PHYSICAL_ACTIVITY: 'PHYSICAL_ACTIVITY',
//     QUESTION: 'QUESTION',
//     ANYTIME: 'ANYTIME',
// };

const PHASE_ITEM_STATUS = {
    DONE: 'DONE',
    PENDING: 'PENDING',
    DID_NOT_EAT: 'DID_NOT_EAT',
};

const convertTypeToTitle = (type: string, capitalize = false) => {
    const title = type.replace(/_/g, ' ').toLowerCase();
    return capitalize ? title.charAt(0).toUpperCase() + title.slice(1) : title;
};

export const Edit: React.FC<EditProps> = ({ phaseId, date }) => {
    const theme = useTheme();
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { date: currentDate } = useAppSelector(selectDayOverview);
  
    const [scrollEnabled, setScrollEnabled] = useState(true);
    const [initialized, setInitialized] = useState(false);
  
    const targetDate = date || currentDate || moment().format('YYYY-MM-DD');
    const targetPhaseId = phaseId || route.params?.phaseId;
  
    // Get day overview data
    const { data: dayOverviewData, isLoading: isDayOverviewLoading } = useGetDayOverviewQuery(targetDate, {
        skip: !targetDate,
    });
  
    // Get phase items
    const { data: phaseItems, isLoading: isPhaseItemsLoading } = useGetPhaseItemsQuery(targetPhaseId, {
        skip: !targetPhaseId,
    });

    // Mutations
    const [updatePhaseItem] = useUpdatePhaseItemMutation();
    const [deletePhaseItem] = useDeletePhaseItemMutation();
    const [addPhaseItem] = useAddPhaseItemMutation();
    const [updatePhase] = useUpdatePhaseMutation();

    useEffect(() => {
        if (targetDate) {
            navigation.setOptions({
                headerBackVisible: false,
                headerTitle: () => (
                    <Text style={{ color: COLORS.WHITE, fontSize: 18, fontWeight: '600' }}>
                        {moment(targetDate).format('ddd, MMM Do')}
                    </Text>
                )
            });
        }
        setInitialized(true);
    }, [targetDate, navigation]);

    // Find current phase data
    const currentPhase = dayOverviewData?.phases?.find(phase => phase.id === targetPhaseId);
  
    // Transform phase items to flat array
    const items: PhaseItem[] = React.useMemo(() => {
        if (!phaseItems) { return []; }
    
        const flatItems: PhaseItem[] = [];
        Object.entries(phaseItems).forEach(([type, typeItems]) => {
            typeItems.forEach((item: any) => {
                flatItems.push({
                    id: item.id,
                    type: item.type,
                    food: item.food,
                    order: item.order,
                    recipe: item.recipe,
                    status: item.status,
                    amount: item.amount,
                    section: item.section,
                    measurement: item.measurement,
                    initialAmount: item.initialAmount,
                    title: item.food?.name || item.recipe?.name || item.measurement?.name || 'Item',
                });
            });
        });
    
        return flatItems.sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [phaseItems]);

    const handleAddItem = () => {
        if (!targetPhaseId || !currentPhase) { return; }

        const excludeIds = items.map(item => String(item.id));
    
        (navigation as any).navigate('AddReplaceItem', {
            excludeIds,
            entityType: currentPhase.type,
            onApply: async (selectedItem: any) => {
                try {
                    // Add the selected item to the phase
                    await addPhaseItem({
                        phaseId: targetPhaseId,
                        data: {
                            order: items.length,
                            type: selectedItem.type,
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
            let newStatus: string;
      
            switch (item.status) {
                case PHASE_ITEM_STATUS.DONE:
                case PHASE_ITEM_STATUS.DID_NOT_EAT:
                    newStatus = PHASE_ITEM_STATUS.PENDING;
                    break;
                case PHASE_ITEM_STATUS.PENDING:
                    newStatus = PHASE_ITEM_STATUS.DONE;
                    break;
                default:
                    newStatus = PHASE_ITEM_STATUS.DID_NOT_EAT;
            }
      
            await updatePhaseItem({
                id: item.id,
                data: {
                    ...item,
                    status: newStatus,
                    amount: item.amount || item.initialAmount
                }
            });
        } catch (error) {
            console.error('Error updating item status:', error);
        }
    };

    const handleDeleteItem = async (item: PhaseItem) => {
        try {
            await deletePhaseItem(item.id);
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const handleReplaceItem = (item: PhaseItem) => {
    // TODO: Implement replace item functionality
        console.log('Replace item:', item.id);
    };

    const handleNoReplaceItem = (item: PhaseItem) => {
    // Return true if item should not be replaced
        return !item.recipe || item.recipe?.surrogateRecipe;
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

    const groupedBySection = _.groupBy(items, 'section');
    const title = currentPhase?.meal?.name
                  || (currentPhase?.type === 'QUESTION' ? 'Health Question'
                      : currentPhase?.type === 'ANYTIME' ? 'Anytime'
                          : convertTypeToTitle(currentPhase?.type || '', true));
    const isPastDate = moment(targetDate).isBefore(moment(), 'day');
    const isFutureDate = moment(targetDate).isAfter(moment(), 'day');

    return (
        <Screen initialized={initialized} style={styles.container}>
            <View style={[styles.title, isFutureDate && styles.opacity]}>
                <View>
                    <Text style={styles.titleText}>
                        {title}
                    </Text>
                </View>
                {currentPhase?.type === OVERVIEW_TYPE.MEAL && !isPastDate && (
                    <View style={styles.titleButtons}>
                        <TouchableOpacity onPress={() => console.log('Change meal')}>
                            <Text style={{ textDecorationLine: 'underline' }} color={theme.colors.primary}>
                Change Meal
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={styles.list}>
                <ScrollView style={isFutureDate && styles.opacity} scrollEnabled={scrollEnabled}>
                    {!_.isEmpty(items) ? (
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
                                        updateData={updatePhaseItem}
                                        nextSection={_.get(item, 'section')}
                                        handleCheckboxStatus={handleCheckboxStatus}
                                    />
                                )}
                                ListHeaderComponent={() => (
                                    (sectionItems[0]?.food || sectionItems[0]?.recipe) ? (
                                        <View style={[
                                            styles.separatorWrapper,
                                            {
                                                borderTopColor: theme.colors.black,
                                                borderTopWidth: section === 'Added' ? 0 : 1,
                                                backgroundColor: section === 'Added' ? '#E0EBF7' : `${theme.colors.lightGrey}80`
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

                {(currentPhase?.type === OVERVIEW_TYPE.MEAL
                  || currentPhase?.type === OVERVIEW_TYPE.ADDED_BY_PATIENT
                  || currentPhase?.type === OVERVIEW_TYPE.ANYTIME) ? (
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
                    ) : (
                        <Button
                            icon="plus"
                            title="Add"
                            variant="primary"
                            onPress={handleAddItem}
                            textStyle={{ color: '#7BAAC2' }}
                            style={{
                                ...styles.button,
                                ...styles.addButton,
                            }}
                        />
                    )}
            </View>
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
        backgroundColor: `${COLORS.LIGHT_GREY}80`, // 50% opacity
        paddingTop: 10,
        paddingBottom: 10,
        marginBottom: 10,
    },
    offset: {
        color: COLORS.DARK_GREY,
        marginLeft: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 24,
        marginBottom: 20,
    },
    mealDoneButton: {
        borderWidth: 0,
        backgroundColor: '#BCE8A6',
    },
    mealDoneButtonDisabled: {
        backgroundColor: COLORS.WHITE,
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
        marginTop: 40,
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
