// outsource dependencies
import moment from 'moment';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// local dependencies
import { Badge } from './Badge';
import Text from 'components/Text';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { PHASE_ITEM_STATUS } from 'constants/spec';
import { AnytimeListItem } from './AnytimeListItem';
import { BottomGlassModal } from 'components/BottomGlassModal';
import { MeasurementInputModal } from './MeasurementInputModal';
import {
    FoodIcon,
    DrinkIcon,
    CloseIcon,
    ActivityIcon,
    SupplementIcon,
    MeasurementIcon,
} from './AnytimeIcons';
import { useUpdatePhaseItemMutation } from 'store/api/dayOverviewApi';
import type { AnytimeItem, AnytimeModalProps, AnytimeMeasurementItem } from 'types/anytime';

const getIconComponent = (icon: string, size: number = 24) => {
    switch (icon) {
        case 'utensils':
            return <FoodIcon size={size} />;
        case 'glass-martini':
            return <DrinkIcon size={size} />;
        case 'capsules':
            return <SupplementIcon size={16} />;
        case 'ruler':
            return <MeasurementIcon size={size} />;
        case 'running':
            return <ActivityIcon size={size} />;
        default:
            return <FoodIcon size={size} />;
    }
};

// Backend contract for drinks in phase items is FOOD + substanceType DRINK.
const toApiAnytimeItem = (item: AnytimeItem) => {
    if (item.type === 'DRINK') {
        return { ...item, type: 'FOOD', substanceType: 'DRINK' };
    }
    return item;
};

export const AnytimeModal: React.FC<AnytimeModalProps> = ({
    date,
    icon,
    items,
    title,
    onClose,
    visible,
    maxHeight,
    disabled = false,
    fullScreen = true,
    isFutureDate = false,
}) => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const [updatePhaseItem] = useUpdatePhaseItemMutation();
    const [selectedMeasurement, setSelectedMeasurement] = useState<AnytimeMeasurementItem | null>(null);

    const pendingItems = items.filter(item =>
        item.status === PHASE_ITEM_STATUS.PENDING || item.status === PHASE_ITEM_STATUS.INCOMPLETE);
    const completedItems = items.filter(item => item.status === PHASE_ITEM_STATUS.DONE);

    const handleUpdateItem = async (data: AnytimeItem) => {
        if (disabled || !data.phaseId) { return; }
        try {
            await updatePhaseItem({
                id: data.id,
                phaseId: data.phaseId,
                data: toApiAnytimeItem(data) as any,
            }).unwrap();
        } catch (error) {
            console.error('Failed to update anytime item:', error);
        }
    };

    const handleMeasurementPress = (item: AnytimeItem) => {
        if (item.type === 'MEASUREMENT' && item.status !== 'DONE') {
            if (item.measurement?.type === 'WEIGHT') {
                onClose();
                navigation.navigate(ROUTES.WEIGHT_MEASUREMENT, {
                    measurementPhaseItem: item,
                    date: date || moment().format('YYYY-MM-DD'),
                });
                return;
            }
            setSelectedMeasurement(item as AnytimeMeasurementItem);
        }
    };

    const closeMeasurementModal = () => setSelectedMeasurement(null);

    const isMeasurementList = icon === 'ruler';
    const isExerciseStub = icon === 'running';

    return (
        <>
            <BottomGlassModal
                visible={visible}
                onClose={onClose}
                maxHeight={maxHeight}
                fullScreen={fullScreen}
            >
                <View style={[styles.header, { backgroundColor: theme.colors.surfaceAlt, borderBottomColor: theme.colors.border }]}>
                    <View style={styles.headerLeft}>
                        <Badge count={pendingItems.length} bgColor={theme.colors.aqua} showZero>
                            {getIconComponent(icon, 24)}
                        </Badge>
                        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                            {title}
                        </Text>
                    </View>

                    <TouchableOpacity onPress={onClose} disabled={disabled} style={styles.closeButton}>
                        <CloseIcon size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {isExerciseStub ? (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                Exercise functionality will be implemented separately
                            </Text>
                        </View>
                    ) : items.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                No items found
                            </Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.scrollView}>
                            {pendingItems.map(item => (
                                <AnytimeListItem
                                    item={item}
                                    disabled={disabled}
                                    key={`pending-${item.id}`}
                                    isFutureDate={isFutureDate}
                                    onUpdateItem={handleUpdateItem}
                                    onPress={isMeasurementList ? () => handleMeasurementPress(item) : undefined}
                                />
                            ))}
                            {completedItems.map(item => (
                                <AnytimeListItem
                                    item={item}
                                    disabled={disabled}
                                    isFutureDate={isFutureDate}
                                    key={`completed-${item.id}`}
                                    onUpdateItem={handleUpdateItem}
                                    onPress={isMeasurementList ? () => handleMeasurementPress(item) : undefined}
                                />
                            ))}
                        </ScrollView>
                    )}
                </View>
            </BottomGlassModal>

            {/* Nested measurement modal — sibling so it stacks above BottomGlassModal
                in its own native <Modal> layer. */}
            {selectedMeasurement && (
                <MeasurementInputModal
                    disabled={disabled}
                    item={selectedMeasurement}
                    visible={!!selectedMeasurement}
                    onClose={closeMeasurementModal}
                />
            )}
        </>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingVertical: 20,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        marginLeft: 16,
        fontWeight: '700',
    },
    closeButton: {
        borderRadius: 20,
    },
    content: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
});
