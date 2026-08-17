// outsource dependencies
import { StyleSheet, View } from 'react-native';
import React, { memo, useCallback } from 'react';

// local dependencies
import Text from 'components/Text';
import type { StockItem } from './types';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import Checkbox from 'components/Checkbox';
import DefImage from 'components/DefImage';
import { useDevHeightAssert } from 'hooks/useDevHeightAssert';
import { PressableScale } from 'components/PressableScale';
import { NAME_MAX_LINES, IMAGE_SIZE, ROW_BORDER, ROW_CONTENT_INSET, ROW_PADDING } from './metrics';

const GRAMS_IN_KILOGRAM = 1000;
const POUNDS_IN_KILOGRAM = 2.20462;
const OUNCES_IN_GRAM = 0.03527396195;

/** Grams -> lbs, falling back to oz for anything that rounds away to zero pounds. */
export const formatStockWeight = (gramWeight: number): string => {
    const pounds = Math.round((gramWeight / GRAMS_IN_KILOGRAM) * POUNDS_IN_KILOGRAM * 100) / 100;
    if (pounds > 0) { return `${pounds} lbs`; }
    return `${Math.round(gramWeight * OUNCES_IN_GRAM * 1000) / 1000} oz`;
};

interface StockListItemProps {
    item: StockItem;
    /** Fixed row height, supplied by the screen so it always equals what getItemLayout reports. */
    height: number;
    disabled: boolean;
    isChecked: boolean;
    onToggle: (item: StockItem) => void;
}

const StockListItemComponent: React.FC<StockListItemProps> = ({
    item,
    height,
    disabled,
    onToggle,
    isChecked,
}) => {
    const handlePress = useCallback(() => onToggle(item), [onToggle, item]);
    // Guards the text column, not the row: the row's height is pinned by the style, so only the
    // content can reveal that the metrics and the StyleSheet have drifted apart.
    const assertContentHeight = useDevHeightAssert('StockListItem', height - ROW_CONTENT_INSET);

    return (
        <PressableScale
            scale={1}
            haptic="success"
            disabled={disabled}
            onPress={handlePress}
            style={[styles.itemContainer, { height }]}
        >
            <DefImage
                src={item.food?.coverImage?.url}
                style={isChecked ? { ...styles.image, ...styles.imageChecked } : styles.image}
            />
            <View style={styles.textContainer} onLayout={assertContentHeight}>
                <Text
                    variant="h5"
                    numberOfLines={NAME_MAX_LINES}
                    style={isChecked ? styles.textDecoration : undefined}
                >
                    {item.food?.name}
                </Text>
                <Text
                    variant="h6"
                    numberOfLines={1}
                    color={COLORS.GREY}
                    style={isChecked ? styles.textDecoration : undefined}
                >
                    {formatStockWeight(item.gramWeight)}
                </Text>
            </View>
            {/* Visual-only checkbox — pointerEvents=none so the row PressableScale owns the tap. */}
            <View pointerEvents="none" style={styles.checkboxWrap}>
                <Checkbox
                    editable={false}
                    value={isChecked}
                    onChange={() => {}}
                />
            </View>
        </PressableScale>
    );
};

StockListItemComponent.displayName = 'StockListItem';

export const StockListItem = memo(StockListItemComponent);
export default StockListItem;

const styles = StyleSheet.create({
    itemContainer: {
        padding: ROW_PADDING,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // Integral border (not hairlineWidth) so the height math in `metrics.ts` is exact on any DPR.
        borderBottomWidth: ROW_BORDER,
        borderBottomColor: COLORS.LIGHT_GREY,
    },
    image: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: 8,
    },
    imageChecked: {
        opacity: 0.5,
    },
    textContainer: {
        flex: 1,
        marginLeft: OFFSET.HORIZONTAL,
    },
    textDecoration: {
        color: COLORS.GREY,
        textDecorationStyle: 'solid',
        textDecorationLine: 'line-through',
    },
    // Visual checkbox is `<Checkbox>` (FA5 icon). This wrapper just reserves space + right alignment.
    checkboxWrap: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
