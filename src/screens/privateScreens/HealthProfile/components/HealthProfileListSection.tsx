// outsource dependencies
import Toast from 'react-native-toast-message';
import { MaterialIndicator } from 'react-native-indicators';
import { ListRenderItemInfo, StyleSheet, View } from 'react-native';
import React, { memo, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';

// local dependencies
import Footer from './Footer.tsx';
import {
    useFindMedicalTermQuery,
    useFindMedicationsQuery,
    useAddMedicationsMutation,
    useDeleteMedicationsMutation,
    useAddMedicalProblemsMutation,
    useDeleteMedicalProblemsMutation,
    useAddMedicationAllergiesMutation,
    useDeleteMedicationAllergiesMutation,
} from 'store/api/healthProfileApi.ts';
import Text from 'components/Text.tsx';
import ListHeader from './ListHeader.tsx';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { MEDICAL_TERM_TYPES } from 'constants/index.ts';
import Separator from 'components/FlatListSeparator.tsx';
import LoadingOverlay from 'components/LoadingOverlay.tsx';
import HealthProfileListItem from './HealthProfileListItem.tsx';
import SelectedItemsAccordion from './SelectedItemsAccordion.tsx';
import { MedicalEntityItem, MedicalEntity } from 'types/healthProfile.ts';
import ListHeaderComponent from 'components/Selector/components/ListHeader.tsx';

export type HealthProfileSectionType = 'medication' | 'medicationAllergy' | 'medicalProblem';

interface HealthProfileListSectionProps {
    title: string;
    value?: string;
    emptyText: string;
    data: MedicalEntity[];
    onAddPress: () => void;
    type: HealthProfileSectionType;
}

const HealthProfileListSection = ({ title, value = '', type, emptyText, onAddPress, data }: HealthProfileListSectionProps) => {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(), []);
    const modalSheetRef = useRef<BottomSheetModal>(null);
    
    const [page, setPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAccordionExpanded, setIsAccordionExpanded] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<MedicalEntity>>(new Set());
    
    const openModalSheet = () => {
        modalSheetRef.current?.present();
        onAddPress?.();
    };

    // Helper to get the item from MedicalEntity based on type
    const getEntityItem = useCallback((entity: MedicalEntity): MedicalEntityItem | undefined => {
        if (type === 'medication') {
            return entity.medication;
        }
        return entity.medicalTerm;
    }, [type]);

    // Check if list item (by id) is in selectedItems
    const isItemSelected = useCallback((itemId: number) => {
        return Array.from(selectedItems).some(
            entity => getEntityItem(entity)?.id === itemId
        );
    }, [selectedItems, getEntityItem]);
    
    // Sync selectedItems with data prop when it changes (e.g., after mutations)
    useEffect(() => {
        if (data && isModalOpen) {
            setSelectedItems(new Set<MedicalEntity>(data));
        }
    }, [data, isModalOpen]);

    const handleSheetChange = useCallback((index: number) => {
        // Index > -1 means modal is open (snap point index)
        // Index -1 means modal is closed
        setIsModalOpen(index > -1);
        // Initialize selectedItems from entities when modal opens
        if (index > -1 && data) {
            setSelectedItems(new Set<MedicalEntity>(data));
        }
        // Reset search and page when modal closes
        if (index === -1) {
            setSearchTerm('');
            setPage(0);
            setSelectedItems(new Set());
        }
    }, [type, data, getEntityItem]);

    // Get the correct medical term type based on section type
    const medicalTermType = useMemo(() => {
        if (type === 'medicationAllergy') {
            return MEDICAL_TERM_TYPES[0]; // 'MEDICATION_ALLERGY'
        }
        if (type === 'medicalProblem') {
            return MEDICAL_TERM_TYPES[1]; // 'MEDICAL_PROBLEMS'
        }
        return MEDICAL_TERM_TYPES[0];
    }, [type]);

    const { data: medicalTermData, isLoading: isLoadingMedicalTerms, isFetching: isFetchingMedicalTerms } = useFindMedicalTermQuery({
        data: { name: searchTerm, type: medicalTermType },
        params: { page },
    }, {
        skip: (type !== 'medicationAllergy' && type !== 'medicalProblem') || !isModalOpen,
    });

    const { data: medicationsData, isLoading: isLoadingMedications, isFetching: isFetchingMedications } = useFindMedicationsQuery({
        data: { name: searchTerm },
        params: { page },
    }, {
        skip: type !== 'medication' || !isModalOpen,
    });

    const [addMedicationAllergy] = useAddMedicationAllergiesMutation();
    const [deleteMedicationAllergy] = useDeleteMedicationAllergiesMutation();
    
    const [addMedicalProblem] = useAddMedicalProblemsMutation();
    const [deleteMedicalProblem] = useDeleteMedicalProblemsMutation();

    const [addMedication] = useAddMedicationsMutation();
    const [deleteMedication] = useDeleteMedicationsMutation();

    // Get type-specific labels
    const typeLabels = useMemo(() => {
        if (type === 'medicationAllergy') {
            return {
                addSuccess: 'Allergy added',
                addMessage: 'Medication allergy has been successfully added.',
                removeSuccess: 'Allergy removed',
                removeMessage: 'Medication allergy has been successfully removed.',
                addError: 'Failed to add allergy',
                removeError: 'Failed to remove allergy',
            };
        }
        if (type === 'medicalProblem') {
            return {
                addSuccess: 'Medical problem added',
                addMessage: 'Medical problem has been successfully added.',
                removeSuccess: 'Medical problem removed',
                removeMessage: 'Medical problem has been successfully removed.',
                addError: 'Failed to add medical problem',
                removeError: 'Failed to remove medical problem',
            };
        }
        if (type === 'medication') {
            return {
                addSuccess: 'Medication added',
                addMessage: 'Medication has been successfully added.',
                removeSuccess: 'Medication removed',
                removeMessage: 'Medication has been successfully removed.',
                addError: 'Failed to add medication',
                removeError: 'Failed to remove medication',
            };
        }
        return {
            addSuccess: 'Item added',
            addMessage: 'Item has been successfully added.',
            removeSuccess: 'Item removed',
            removeMessage: 'Item has been successfully removed.',
            addError: 'Failed to add item',
            removeError: 'Failed to remove item',
        };
    }, [type]);

    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term);
        setPage(0); // Reset to first page when search changes
    }, []);

    const loadMore = useCallback(() => {
        // Load more for medicationAllergy and medicalProblem using medicalTermData
        if ((type === 'medicationAllergy' || type === 'medicalProblem')
            && medicalTermData
            && medicalTermData.page < medicalTermData.totalPages - 1
        ) {
            setPage(medicalTermData.page + 1);
        }
        // Load more for medication using medicationsData
        if (type === 'medication'
            && medicationsData
            && medicationsData.page < medicationsData.totalPages - 1
        ) {
            setPage(medicationsData.page + 1);
        }
    }, [medicalTermData, medicationsData, type]);


    const handleToggleItem = useCallback(async (item: MedicalEntityItem) => {
        if (!type) {
            return;
        }

        const itemId = item.id;
        const foundEntity = Array.from(selectedItems).find(
            entity => getEntityItem(entity)?.id === itemId
        );
        const isCurrentlySelected = !!foundEntity;
        const entityIdToDelete = foundEntity?.id;

        // Optimistically update UI
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (isCurrentlySelected && foundEntity) {
                newSet.delete(foundEntity);
            } else {
                const stubEntity: MedicalEntity = type === 'medication'
                    ? { id: itemId, medication: item }
                    : { id: itemId, medicalTerm: item };
                newSet.add(stubEntity);
            }
            return newSet;
        });

        try {
            if (isCurrentlySelected && entityIdToDelete != null) {
                if (type === 'medicationAllergy') {
                    await deleteMedicationAllergy({ id: entityIdToDelete }).unwrap();
                } else if (type === 'medicalProblem') {
                    await deleteMedicalProblem({ id: entityIdToDelete }).unwrap();
                } else if (type === 'medication') {
                    await deleteMedication({ id: entityIdToDelete }).unwrap();
                }
                Toast.show({
                    type: 'success',
                    text1: typeLabels.removeSuccess,
                    text2: typeLabels.removeMessage,
                });
            } else {
                if (type === 'medicationAllergy') {
                    await addMedicationAllergy({ id: itemId }).unwrap();
                } else if (type === 'medicalProblem') {
                    await addMedicalProblem({ id: itemId }).unwrap();
                } else if (type === 'medication') {
                    await addMedication({ id: itemId }).unwrap();
                }
                Toast.show({
                    type: 'success',
                    text1: typeLabels.addSuccess,
                    text2: typeLabels.addMessage,
                });
            }
        } catch (error) {
            // Revert on error
            setSelectedItems(prev => {
                const newSet = new Set(prev);
                if (isCurrentlySelected && foundEntity) {
                    newSet.add(foundEntity);
                } else {
                    const toRemove = Array.from(newSet).find(
                        entity => getEntityItem(entity)?.id === itemId
                    );
                    if (toRemove) {
                        newSet.delete(toRemove);
                    }
                }
                return newSet;
            });
            Toast.show({
                type: 'error',
                text1: isCurrentlySelected ? typeLabels.removeError : typeLabels.addError,
                text2: 'Something went wrong. Please try again later.',
            });
        }
    }, [type, selectedItems, getEntityItem, addMedicationAllergy, deleteMedicationAllergy, addMedicalProblem, deleteMedicalProblem, addMedication, deleteMedication, typeLabels]);

    const handleRemoveItem = useCallback(async (id: number) => {
        try {
            if (type === 'medicationAllergy') {
                await deleteMedicationAllergy({ id }).unwrap();
            } else if (type === 'medicalProblem') {
                await deleteMedicalProblem({ id }).unwrap();
            } else if (type === 'medication') {
                await deleteMedication({ id }).unwrap();
            }
            Toast.show({
                type: 'success',
                text1: typeLabels.removeSuccess,
                text2: typeLabels.removeMessage,
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: typeLabels.removeError,
                text2: 'Something went wrong. Please try again later.',
            });
        }
    }, [type, deleteMedicationAllergy, deleteMedicalProblem, deleteMedication, typeLabels]);

    // Data source placeholder (will later be fed by RTK Query by `type`)
    // Important: keep UI logic unchanged for now.
    const items: any[] = (() => {
        switch (type) {
            case 'medication':
                return medicationsData?.data ?? [];
            case 'medicalProblem':
            case 'medicationAllergy':
                return medicalTermData?.data ?? [];
            default: return [];
        }
    })();
  
    const isEmpty = items.length === 0;
    // Disable search input while any list request is in flight (initial load or after typing)
    const isSearchInputDisabled = (() => {
        if (type === 'medication') {
            return isLoadingMedications || isFetchingMedications;
        }
        return isLoadingMedicalTerms || isFetchingMedicalTerms;
    })();
    // Loading states for different types
    const isLoadingData = (() => {
        if (type === 'medication') {
            return isLoadingMedications && page === 0 && searchTerm === '';
        }
        return isLoadingMedicalTerms && page === 0 && searchTerm === '';
    })();
    const isLoadingMore = (() => {
        if (type === 'medication') {
            return isFetchingMedications && page > 0 && !isEmpty;
        }
        return isFetchingMedicalTerms && page > 0 && !isEmpty;
    })();
    // Show overlay when searching (has search term) or when clearing search (fetching with empty term but not initial load)
    const isSearching = (() => {
        if (type === 'medication') {
            return isFetchingMedications && page === 0 && !isLoadingData;
        }
        return isFetchingMedicalTerms && page === 0 && !isLoadingData;
    })();

    const toggleAccordion = useCallback(() => {
        setIsAccordionExpanded(prev => !prev);
    }, []);

    const showAccordionToggle = (type === 'medicationAllergy' || type === 'medicalProblem' || type === 'medication') && data.length > 0;

    return (
        <View>
            <ListHeader
                title={title}
                onAction={openModalSheet}
                onToggleAccordion={toggleAccordion}
                isAccordionExpanded={isAccordionExpanded}
                showAccordionToggle={showAccordionToggle}
            />
            {showAccordionToggle && (
                <SelectedItemsAccordion
                    data={data}
                    type={type}
                    onRemove={handleRemoveItem}
                    isExpanded={isAccordionExpanded}
                />
            )}
            {
                data.length === 0
                    ? <Text
                        textAlign="center"
                        style={styles.emptyText}
                        color={theme.colors.grey}
                    >
                        {emptyText}
                    </Text>
                    : null
            }
            <BottomSheetModal
                ref={modalSheetRef}
                snapPoints={['90%']}
                enablePanDownToClose
                enableDynamicSizing={false}
                onChange={handleSheetChange}
                handleStyle={[styles.handleStyle, isSearching ? styles.handleStylePreloader : { backgroundColor: theme.colors.white }]}
                backdropComponent={backdropProps => (
                    <BottomSheetBackdrop
                        {...backdropProps}
                        opacity={0.5}
                        appearsOnIndex={0}
                        disappearsOnIndex={-1}
                    />
                )}>
                <LoadingOverlay init={isSearching} />
                {isLoadingData ? (
                    <View style={styles.loadingContainer}>
                        <MaterialIndicator color={theme.colors.primary} size={60} />
                    </View>
                ) : (
                    <View>
                        <BottomSheetFlatList
                            data={items}
                            onEndReached={loadMore}
                            stickyHeaderIndices={[0]}
                            onEndReachedThreshold={0.6}
                            ItemSeparatorComponent={Separator}
                            keyExtractor={(item: MedicalEntityItem) => `${item?.id}`}
                            ListFooterComponent={<Footer isLoading={isLoadingMore} />}
                            ListHeaderComponent={<ListHeaderComponent
                                value={value}
                                placeholder="Search..."
                                onSearch={handleSearch}
                                searchValue={searchTerm}
                                disabled={isSearchInputDisabled}
                            />}
                            renderItem={({ item }: ListRenderItemInfo<MedicalEntityItem>) => (
                                <HealthProfileListItem
                                    item={item}
                                    onToggle={handleToggleItem}
                                    isChecked={isItemSelected(item.id)}
                                />
                            )}
                        />
                    </View>
                )}
            </BottomSheetModal>
          
        </View>
    );
};

export default memo(HealthProfileListSection);

const createStyles = () => StyleSheet.create({
    emptyText: {
        paddingVertical: OFFSET.VERTICAL,
    },
    itemText: {
        paddingVertical: OFFSET.VERTICAL,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: OFFSET.VERTICAL * 4,
    },
    handleStyle: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    handleStylePreloader: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
});
