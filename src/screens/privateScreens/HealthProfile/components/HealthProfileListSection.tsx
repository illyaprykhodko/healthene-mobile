// outsource dependencies
import { MaterialIndicator } from 'react-native-indicators';
import { ListRenderItemInfo, StyleSheet, View } from 'react-native';
import React, { memo, useMemo, useRef, useState, useCallback } from 'react';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';

// local dependencies
import Footer from './Footer.tsx';
import Text from 'components/Text.tsx';
import ListHeader from './ListHeader.tsx';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { MedicalTermItem } from 'types/healthProfile.ts';
import Separator from 'components/FlatListSeparator.tsx';
import LoadingOverlay from 'components/LoadingOverlay.tsx';
import HealthProfileListItem from './HealthProfileListItem.tsx';
import { useFindMedicalTermQuery } from 'store/api/healthProfileApi.ts';
import ListHeaderComponent from 'components/Selector/components/ListHeader.tsx';

export type HealthProfileSectionType = 'medication' | 'medicationAllergy' | 'medicalProblem';

interface HealthProfileListSectionProps {
    title: string;
    value?: string;
    emptyText: string;
    onAddPress: () => void;
    type: HealthProfileSectionType;
}

const HealthProfileListSection = ({ title, value = '', type, emptyText, onAddPress }: HealthProfileListSectionProps) => {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(), []);
    const modalSheetRef = useRef<BottomSheetModal>(null);
    
    const [page, setPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    
    const openModalSheet = () => {
        modalSheetRef.current?.present();
        onAddPress?.();
    };

    const handleSheetChange = useCallback((index: number) => {
        // Index > -1 means modal is open (snap point index)
        // Index -1 means modal is closed
        setIsModalOpen(index > -1);
        // Reset search and page when modal closes
        if (index === -1) {
            setSearchTerm('');
            setPage(0);
            setSelectedItems(new Set());
        }
    }, []);

    const { data: medicalTermData, isLoading: isLoadingMedicalTerms, isFetching: isFetchingMedicalTerms } = useFindMedicalTermQuery({
        data: { name: searchTerm },
        params: { page },
    }, {
        skip: type !== 'medicationAllergy' || !isModalOpen,
    });

    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term);
        setPage(0); // Reset to first page when search changes
    }, []);

    const loadMore = useCallback(() => {
        // Only load more for types that use medicalTermData
        if (type === 'medicationAllergy'
            && medicalTermData
            && medicalTermData.page < medicalTermData.totalPages - 1
        ) {
            setPage(medicalTermData.page + 1);
        }
    }, [medicalTermData, type]);

    const handleToggleItem = useCallback((id: number) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    // Data source placeholder (will later be fed by RTK Query by `type`)
    // Important: keep UI logic unchanged for now.
    const items: any[] = (() => {
        switch (type) {
            case 'medication':
                return [];
            case 'medicationAllergy':
                return medicalTermData?.data ?? [];
            case 'medicalProblem': return [];
            default: return [];
        }
    })();
  
    const isEmpty = items.length === 0;
    const isLoadingData = isLoadingMedicalTerms && page === 0 && searchTerm === '';
    const isLoadingMore = isFetchingMedicalTerms && page > 0 && !isEmpty;
    // Show overlay when searching (has search term) or when clearing search (fetching with empty term but not initial load)
    const isSearching = isFetchingMedicalTerms && page === 0 && !isLoadingData;

    return (
        <View>
            <ListHeader
                title={title}
                onAction={openModalSheet}
            />
            {
                isEmpty
                    ? <Text
                        style={styles.emptyText}
                        textAlign="center"
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
                            keyExtractor={(item: MedicalTermItem) => `${item?.id}`}
                            ListFooterComponent={<Footer isLoading={isLoadingMore} />}
                            ListHeaderComponent={<ListHeaderComponent
                                value={value}
                                placeholder="Search..."
                                onSearch={handleSearch}
                                searchValue={searchTerm}
                            />}
                            renderItem={({ item }: ListRenderItemInfo<MedicalTermItem>) => (
                                <HealthProfileListItem
                                    item={item}
                                    onToggle={handleToggleItem}
                                    isChecked={selectedItems.has(item.id)}
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
    }
});
