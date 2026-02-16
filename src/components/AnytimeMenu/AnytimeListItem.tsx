// outsource dependencies
import Icon from '@react-native-vector-icons/fontawesome5';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
// local dependencies
import Text from 'components/Text';
import { COLORS } from 'constants/colors';
import { useTheme } from 'hooks/useTheme';
import { filters } from 'services/filter';
import Checkbox from 'components/Checkbox';
import type { AnytimeItem, AnytimeFoodItem, AnytimeDrinkItem } from 'types/anytime.ts';
import { splitAmountToServings, getServingState, isServingEnabled, isServingDone, applyServingToggle } from './serving';

interface AnytimeListItemProps {
  item: AnytimeItem;
  disabled?: boolean;
  isFutureDate?: boolean;
  onPress?: (item: AnytimeItem) => void; // For measurements
  onUpdateItem: (item: AnytimeItem) => void;
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
                image: item.measurement?.coverImage?.url,
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
    onPress,
    onUpdateItem,
    disabled = false,
    isFutureDate = false,
}) => {
    const theme = useTheme();
    const { name, details, image } = getItemDisplayData(item);

    const isCompleted = item.status === 'DONE';
    const canToggle = !disabled && !isFutureDate;
    const isMeasurement = item.type === 'MEASUREMENT';

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

    const handleItemPress = () => {
        if (isMeasurement && !isCompleted && onPress) {
            onPress(item);
        }
    };

    const unitName = isFoodOrDrink
        ? (item as (AnytimeFoodItem | AnytimeDrinkItem)).weight?.unit?.name || ''
        : item.type === 'MEASUREMENT'
            ? (item as any)?.measurement?.measurement?.units?.[0]?.name || (item as any)?.measurement?.units?.[0]?.name || ''
            : '';

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
    const detailsProgress = useSharedValue(0);
    const detailsMaxHeight = useMemo(() => childItems.length * 62, [childItems.length]);

    const handleChevronPress = useCallback(() => setExpanded(v => !v), []);
    const onToggleServing = useCallback((unitAmount: number, isDone: boolean) => {
        if (disabled || !canToggle || !isFoodOrDrink) { return; }
        const nextConsumed = applyServingToggle(consumedAmount, unitAmount, item.amount || 0, isDone);
        const willBeDone = nextConsumed === (item.amount || 0);
        onUpdateItem({ ...item, status: willBeDone ? 'DONE' : 'PENDING', consumedAmount: nextConsumed } as AnytimeItem);
    }, [disabled, canToggle, isFoodOrDrink, consumedAmount, item.amount, onUpdateItem, item]);

    useEffect(() => {
        const shouldExpand = expanded && isDetailsEnabled;
        detailsProgress.value = withTiming(shouldExpand ? 1 : 0, {
            duration: shouldExpand ? 350 : 250,
            easing: shouldExpand ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        });
    }, [detailsProgress, expanded, isDetailsEnabled]);

    const detailsAnimatedStyle = useAnimatedStyle(() => ({
        opacity: detailsProgress.value,
        maxHeight: detailsMaxHeight * detailsProgress.value,
        transform: [{ scaleY: 0.96 + (0.04 * detailsProgress.value) }],
        overflow: 'hidden',
    }));
    return (
        <View>
            <TouchableOpacity
                onPress={handleItemPress}
                activeOpacity={isMeasurement ? 0.7 : 1}
                disabled={!isMeasurement || isCompleted || !onPress}
                style={[
                    styles.container,
                    isCompleted && styles.completed,
                    { borderBottomColor: theme.colors.border },
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
                                <Icon iconStyle="solid" name={expanded ? 'chevron-up' : 'chevron-down'} color={theme.colors.blue} size={18} />
                            </TouchableOpacity>
                        )}
                        {isMeasurement && !isCompleted && (
                            <Icon iconStyle="solid" name="chevron-right" size={22} color={theme.colors.blue} style={{ marginRight: 4 }} />
                        )}
                        {showParentCheckbox && !isMeasurement && (
                            <Checkbox
                                value={isCompleted}
                                editable={!disabled}
                                onChange={handleToggleParent}
                            />
                        )}
                        {/* Measurement completed checkbox (read-only visual) */}
                        {isMeasurement && isCompleted && (
                            <Checkbox
                                value={true}
                                editable={false}
                                onChange={() => {}}
                            />
                        )}
                    </View>
                )}
            </TouchableOpacity>

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
            {isDetailsEnabled && (
                <Animated.View
                    style={detailsAnimatedStyle}
                    pointerEvents={expanded ? 'auto' : 'none'}
                >
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
                </Animated.View>
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
        marginBottom: 4,
        fontWeight: '500',
        color: COLORS.BLACK,
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
        padding: 7,
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
