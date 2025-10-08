// outsource dependencies
import Icon from 'react-native-vector-icons/FontAwesome5';
import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
// local dependencies
import Text from 'components/Text';
import { COLORS } from 'constants/colors';
import { useTheme } from 'hooks/useTheme';
import { filters } from 'services/filter';
import Checkbox from 'components/Checkbox';
import type { AnytimeItem, AnytimeFoodItem, AnytimeDrinkItem } from '../../types/anytime';
import { splitAmountToServings, getServingState, isServingEnabled, isServingDone, applyServingToggle } from './serving';

interface AnytimeListItemProps {
  item: AnytimeItem;
  onUpdateItem: (item: AnytimeItem) => void;
  disabled?: boolean;
  isFutureDate?: boolean;
}

const getItemDisplayData = (item: AnytimeItem) => {
    switch (item.type) {
        case 'FOOD':
        case 'DRINK':
            return {
                image: item.food?.coverImage?.url,
                name: item.food?.name || 'Unknown Food',
                details: `${item.amount || 1} ${item.weight?.unit?.name || ''}`,
            };
        case 'SUPPLEMENT':
            return {
                image: item.supplement?.coverImage?.url,
                name: item.supplement?.name || 'Unknown Supplement',
                details: `${item.amount || 1} ${item.supplement?.servingSizes?.[0]?.unit || ''}`,
            };
        case 'MEASUREMENT':
            return {
                details: '',
                image: null,
                name: item.measurement?.name || 'Unknown Measurement',
            };
        case 'PHYSICAL_ACTIVITY':
            return {
                details: '',
                image: null,
                name: item.physicalActivity?.name || 'Exercise',
            };
        default:
            return {
                details: '',
                image: null,
                name: 'Unknown Item',
            };
    }
};

export const AnytimeListItem: React.FC<AnytimeListItemProps> = ({
    item,
    onUpdateItem,
    disabled = false,
    isFutureDate = false,
}) => {
    const theme = useTheme();
    const { name, details, image } = getItemDisplayData(item);

    const isCompleted = item.status === 'DONE';
    const canToggle = !disabled && !isFutureDate;

    const isFoodOrDrink = item.type === 'FOOD' || item.type === 'DRINK';
    // const multiAmount = isFoodOrDrink ? (item.amount || 0) > 1 : false;
    const [expanded, setExpanded] = useState(false);

    const handleToggleParent = () => {
        if (!canToggle) { return; }
        const amountTotal = (item.amount || 0);
        const nextStatus = isCompleted ? 'PENDING' : 'DONE';
        const nextConsumed = nextStatus === 'DONE' ? amountTotal : 0;
        onUpdateItem({ ...item, status: nextStatus, consumedAmount: nextConsumed } as AnytimeItem);
    };

    const unitName = isFoodOrDrink ? (item as (AnytimeFoodItem | AnytimeDrinkItem)).weight?.unit?.name || '' : '';

    const consumedAmount = isFoodOrDrink ? (item.consumedAmount ?? 0) : 0;
    const { integerConsumed, decimalConsumed } = getServingState(consumedAmount);

    // Build child items list for multi serving: N times 1 unit + optional fractional remainder unit
    const childItems = useMemo(() => {
        if (!isFoodOrDrink) { return []; }
        const img = (item as (AnytimeFoodItem | AnytimeDrinkItem)).food?.coverImage?.url;
        return splitAmountToServings(item.amount || 0).map(u => ({ ...u, unit: unitName, img }));
    }, [isFoodOrDrink, item.amount, unitName, (item as any)?.food?.coverImage?.url]);

    const isDetailsEnabled = !isFutureDate && isFoodOrDrink && (item.amount || 0) > 1;
    const showParentCheckbox = !isDetailsEnabled || item.status === 'DONE';

    const handleChevronPress = useCallback(() => setExpanded(v => !v), []);
    const onToggleServing = useCallback((unitAmount: number, isDone: boolean) => {
        if (disabled || !canToggle || !isFoodOrDrink) { return; }
        const nextConsumed = applyServingToggle(consumedAmount, unitAmount, item.amount || 0, isDone);
        const willBeDone = nextConsumed === (item.amount || 0);
        onUpdateItem({ ...item, status: willBeDone ? 'DONE' : 'PENDING', consumedAmount: nextConsumed } as AnytimeItem);
    }, [disabled, canToggle, isFoodOrDrink, consumedAmount, item.amount, onUpdateItem, item]);
    return (
        <View>
            <View
                style={[
                    styles.container,
                    { borderBottomColor: theme.colors.border },
                    isCompleted && styles.completed,
                ]}
            >
                <View style={styles.content}>
                    {image ? (
                        <Image
                            resizeMode="cover"
                            style={styles.image}
                            source={{ uri: image }}
                        />
                    ) : (
                        <View style={[styles.image, { backgroundColor: theme.colors.lightGrey }]} />
                    )}
            
                    <View style={styles.textContainer}>
                        <Text style={[styles.itemName, { color: theme.colors.text }]}>
                            {name}
                        </Text>
                        <Text style={[styles.itemDetails, { color: theme.colors.textSecondary }]}>
                            {isFoodOrDrink && consumedAmount > 0 && item.status !== 'DONE'
                                ? `${filters.decimalsToFractions(consumedAmount)} of ${filters.decimalsToFractions(item.amount || 0)} ${unitName}`
                                : details}
                        </Text>
                    </View>
                </View>

                {!isFutureDate && (
                    <View style={styles.rightControls}>
                        {isDetailsEnabled && (
                            <TouchableOpacity onPress={handleChevronPress} style={[styles.chevron, showParentCheckbox && styles.chevronWithCheckbox]}>
                                <Icon name={expanded ? 'chevron-up' : 'chevron-down'} color={theme.colors.blue} size={18} />
                            </TouchableOpacity>
                        )}
                        {showParentCheckbox && (
                            <Checkbox
                                value={isCompleted}
                                editable={!disabled}
                                onChange={handleToggleParent}
                            />
                        )}
                    </View>
                )}
            </View>

            {/* {expanded && isDetailsEnabled && (
                <FlatList
                    data={childItems}
                    keyExtractor={i => i.id}
                    renderItem={({ item: unitItem, index }) => {
                        const state = { integerConsumed, decimalConsumed };
                        const checkboxEnabled = isServingEnabled(index, unitItem.amount, state);
                        const isItemDone = isServingDone(index, unitItem.amount, state);

                        const toggleChild = () => {
                            if (disabled || !canToggle || !isFoodOrDrink) { return; }
                            const nextConsumed = applyServingToggle(consumedAmount, unitItem.amount, item.amount || 0, isItemDone);
                            const willBeDone = nextConsumed === (item.amount || 0);
                            onUpdateItem({
                                ...item,
                                status: willBeDone ? 'DONE' : 'PENDING',
                                consumedAmount: nextConsumed,
                            } as AnytimeItem);
                        };

                        return (
                            <View style={[styles.detailRow, isItemDone && styles.detailRowDone, { borderTopColor: theme.colors.border }]}>
                                {image ? (
                                    <Image style={styles.detailImage} resizeMode="cover" source={{ uri: unitItem.img }} />
                                ) : <View style={[styles.detailImage, { backgroundColor: theme.colors.lightGrey }]} />}
                                <View style={styles.detailTextContainer}>
                                    <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                                        {`${filters.decimalsToFractions(unitItem.amount)} ${unitName}`}
                                    </Text>
                                </View>
                                <View style={[styles.checkboxContainer, !checkboxEnabled && { opacity: 0.5 }] }>
                                    <Checkbox
                                        size={14}
                                        value={isItemDone}
                                        editable={checkboxEnabled && !disabled}
                                        onChange={toggleChild}
                                    />
                                </View>
                            </View>
                        );
                    }}
                />
            )} */}
            {expanded && isDetailsEnabled && (
                <View>
                    {childItems.map((unitItem, index) => {
                        const state = { integerConsumed, decimalConsumed };
                        const checkboxEnabled = isServingEnabled(index, unitItem.amount, state);
                        const isItemDone = isServingDone(index, unitItem.amount, state);

                        // const onToggle = () => {
                        //     if (disabled || !canToggle || !isFoodOrDrink) { return; }
                        //     const nextConsumed = applyServingToggle(consumedAmount, unitItem.amount, item.amount || 0, isItemDone);
                        //     const willBeDone = nextConsumed === (item.amount || 0);
                        //     onUpdateItem({
                        //         ...item,
                        //         status: willBeDone ? 'DONE' : 'PENDING',
                        //         consumedAmount: nextConsumed,
                        //     } as AnytimeItem);
                        // };
                    
                        return (
                            <View
                                key={unitItem.id}
                                style={[styles.detailRow, isItemDone && styles.detailRowDone, { borderTopColor: theme.colors.border }]}
                            >
                                {image
                                    ? <Image style={styles.detailImage} resizeMode="cover" source={{ uri: unitItem.img }} />
                                    : <View style={[styles.detailImage, { backgroundColor: theme.colors.lightGrey }]} />
                                }
                                <View style={styles.detailTextContainer}>
                                    <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                                        {`${filters.decimalsToFractions(unitItem.amount)} ${unitName}`}
                                    </Text>
                                </View>
                                <View style={[styles.checkboxContainer, !checkboxEnabled && { opacity: 0.5 }] }>
                                    <Checkbox
                                        size={14}
                                        value={isItemDone}
                                        editable={checkboxEnabled && !disabled}
                                        onChange={() => onToggleServing(unitItem.amount, isItemDone)}
                                    />
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E9E9E9',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    image: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: COLORS.LIGHTER_GREY,
    },
    textContainer: {
        flex: 1,
        marginRight: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.BLACK,
        marginBottom: 4,
    },
    itemDetails: {
        fontSize: 14,
        color: '#8E8E8E',
        fontWeight: '400',
    },
    checkboxContainer: {
        paddingLeft: 8,
    },
    rightControls: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 8,
    },
    chevron: {
        marginTop: 2,
        marginRight: 4,
    },
    chevronWithCheckbox: {
        marginRight: 12,
    },
    completed: {
        opacity: 0.6,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
    },
    detailRowDone: {
        opacity: 0.5,
    },
    detailImage: {
        width: 38,
        height: 38,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: COLORS.LIGHTER_GREY,
    },
    detailTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    detailText: {
        fontSize: 14,
    },
});
