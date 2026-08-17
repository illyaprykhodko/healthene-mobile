
// outsource dependencies
import Icon from '@react-native-vector-icons/feather';
import { StyleSheet, View, TextInput } from 'react-native';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

// local dependencies
import Text from 'components/Text';
import { COLORS } from 'constants/colors';
import { useTheme } from 'hooks/useTheme';
import Checkbox from 'components/Checkbox';
import DefImage from 'components/DefImage';
import { NAME_MAX_LINES, ROW_CONTENT_INSET } from './itemMetrics';
import { MAX_FONT_SCALE } from 'constants/typography';
import { useDevHeightAssert } from 'hooks/useDevHeightAssert';
import { PressableScale } from 'components/PressableScale';
import { SHOPPING_STATUS } from 'constants/spec';

interface ShoppingItemProps {
    item: any;
    /** Fixed row height, supplied by the screen so it always equals what getItemLayout reports. */
    height: number;
    status: string;
    /** True when the select control is replaced by the read-only amount pill. */
    compact: boolean;
    disabled?: boolean;
    /** currentStep === SHOPPING_STEP.MAIN — gates the exclude button only. */
    isMainStep: boolean;
    isConfirmed: boolean;
    onUpdate: (item: any) => void;
    onAmountFocus?: (itemId: number) => void;
}

const ShoppingItem: React.FC<ShoppingItemProps> = memo(({
    item,
    status,
    height,
    compact,
    onUpdate,
    disabled,
    isMainStep,
    isConfirmed,
    onAmountFocus,
}) => {
    const theme = useTheme();
    const ref = useRef<TextInput>(null);
    const [editable, setEditable] = useState(false);
    const [amount, setAmount] = useState(String(item?.amount || 1));

    const isExcluded = item?.excluded;
    // Guards the text column, not the row: the row's height is pinned by the style, so only the
    // content can reveal that the metrics and the StyleSheet have drifted apart.
    const assertContentHeight = useDevHeightAssert('ShoppingItem', height - ROW_CONTENT_INSET);
    const [isPurchased, setIsPurchased] = useState<boolean>(!!item?.bought);

    useEffect(() => {
        setIsPurchased(!!item?.bought);
    }, [item?.bought]);

    const isItemDisabled = isExcluded || isConfirmed;

    // Clean numeric string input
    const cleanedStr = useCallback((str: string) => {
        const dotIndex = str.indexOf('.');
        const commaIndex = str.indexOf(',');
        let firstSeparatorIndex = -1;

        if (dotIndex !== -1 || commaIndex !== -1) {
            if (dotIndex === -1) {
                firstSeparatorIndex = commaIndex;
            } else if (commaIndex === -1) {
                firstSeparatorIndex = dotIndex;
            } else {
                firstSeparatorIndex = Math.min(dotIndex, commaIndex);
            }
        }
        let result = '';
        let separatorAdded = false;
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if (/\d/.test(char)) {
                result += char;
            } else if ((char === '.' || char === ',') && !separatorAdded && i === firstSeparatorIndex) {
                result += '.';
                separatorAdded = true;
            }
        }
        if (!separatorAdded && result.length > 1 && result[0] === '0') {
            result = `${result[0]}.${result.slice(1)}`;
        }
        return result;
    }, []);

    // Handle amount button press - focus input
    const handleAmount = useCallback(() => {
        if (isItemDisabled) { return; }
        setEditable(true);
        setTimeout(() => ref.current?.focus(), 0);
    }, [isItemDisabled]);

    // Handle input blur - submit changes
    const handleBlur = useCallback(() => {
        setEditable(false);
        const cleanedAmount = cleanedStr(amount);
        if (cleanedAmount && cleanedAmount !== String(item?.amount)) {
            onUpdate({
                ...item,
                amount: parseFloat(cleanedAmount) || 1,
            });
        }
    }, [amount, item, cleanedStr, onUpdate]);

    const handleExclude = useCallback(() => {
        if (disabled || isConfirmed) { return; }
        onUpdate({
            ...item,
            excluded: !isExcluded,
        });
    }, [item, isExcluded, disabled, isConfirmed, onUpdate]);

    const handlePurchase = useCallback(() => {
        if (disabled) { return; }
        const nextValue = !isPurchased;
        setIsPurchased(nextValue);
        onUpdate({
            ...item,
            bought: nextValue,
        });
    }, [item, isPurchased, disabled, isConfirmed, onUpdate]);

    // HS-3113: Final Check step removed. Was:
    //   (currentStep === SHOPPING_STEP.MAIN || currentStep === SHOPPING_STEP.CHECK)
    // CHECK is now unreachable, so the clause was dropped.
    // `isMainStep` / `compact` are computed by the screen (compact also feeds the row height), which
    // removes a per-row Redux subscription to `selectCurrentStep`. They are NOT interchangeable:
    // exclude is MAIN-only, while the select control also shows in MEAL.
    const showExcludeButton = isMainStep
        && status !== SHOPPING_STATUS.CONFIRMED
        && status !== SHOPPING_STATUS.SHOP_ON_MY_OWN
    ;
    const showShoppingCheckbox = status === SHOPPING_STATUS.SHOP_ON_MY_OWN;

    return (
        <View style={[
            styles.container,
            { height, backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
            isExcluded && styles.excluded,
        ]}>
            <DefImage
                src={item?.coverImage?.url}
                style={isExcluded ? { ...styles.image, ...styles.excludedImage } : styles.image}
            />
            <View style={styles.textContainer} onLayout={assertContentHeight}>
                <Text
                    variant="h5"
                    color={theme.colors.text}
                    numberOfLines={NAME_MAX_LINES}
                    style={[styles.name, isExcluded && styles.excludedText]}
                >
                    {item.name || item.food?.name}
                </Text>
                <View style={styles.itemInfo}>
                    {!compact ? (
                        <View style={styles.controlsContainer}>
                            <PressableScale
                                // haptic="light"
                                haptic="medium"
                                onPress={handleAmount}
                                disabled={isItemDisabled}
                                style={[styles.selectBtn, isItemDisabled && styles.selectBtnDisabled]}
                            >
                                <TextInput
                                    ref={ref}
                                    maxLength={4}
                                    onBlur={handleBlur}
                                    editable={editable}
                                    keyboardType="numeric"
                                    onChangeText={setAmount}
                                    value={cleanedStr(amount)}
                                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                                    onFocus={() => onAmountFocus?.(item?.id)}
                                    style={[
                                        styles.selectInput,
                                        {
                                            backgroundColor: theme.colors.surface,
                                            color: editable ? theme.colors.text : theme.colors.textSecondary,
                                            borderColor: isItemDisabled ? theme.colors.border : theme.colors.primary,
                                        }
                                    ]}
                                />
                                <Text style={[styles.selectBtnText, isItemDisabled && styles.selectBtnTextDisabled]}>
                                    select
                                </Text>
                            </PressableScale>
                        </View>
                    ) : (
                        <View style={[
                            styles.amountContainer,
                            { borderColor: theme.colors.border },
                            isExcluded && styles.amountContainerExcluded,
                        ]}>
                            <Text color={theme.colors.text} style={[styles.amount, isExcluded && styles.excludedText]}>
                                {item.amount}
                            </Text>
                        </View>
                    )}
                    <Text color={theme.colors.textSecondary} style={styles.unit}>
                        {item?.unitOfMeasure}
                    </Text>
                </View>
            </View>

            {showExcludeButton && (
                <PressableScale
                    haptic="light"
                    disabled={disabled}
                    onPress={handleExclude}
                    style={styles.actionBtn}
                >
                    <Icon
                        size={24}
                        name={isExcluded ? 'plus-square' : 'trash-2'}
                        color={isExcluded ? theme.colors.text : theme.colors.textSecondary}
                    />
                </PressableScale>
            )}
            {/*{isConfirmed && (*/}
            {/*    <TouchableOpacity*/}
            {/*        // onPress={handleConfirm}*/}
            {/*        disabled*/}
            {/*        style={styles.actionBtn}*/}
            {/*    >*/}
            {/*        <Icon name="check" size={24} color={COLORS.GREEN} />*/}
            {/*    </TouchableOpacity>*/}
            {/*)}*/}

            {showShoppingCheckbox && (
                <Checkbox
                    value={isPurchased}
                    editable={!disabled}
                    style={styles.checkbox}
                    onChange={handlePurchase}
                />
            )}
        </View>
    );
});

export default ShoppingItem;

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        // Integral border (not hairlineWidth) so the height math in ./itemMetrics stays exact on any DPR.
        borderBottomWidth: 1,
        paddingHorizontal: 16,
        backgroundColor: COLORS.WHITE,
        borderBottomColor: COLORS.LIGHT_GREY,
    },
    excluded: {
        opacity: 0.5,
    },
    image: {
        width: 100,
        height: 100,
    },
    excludedImage: {
        opacity: 0.5,
    },
    textContainer: {
        flex: 1,
        marginLeft: 16,
    },
    name: {
        marginBottom: 8,
    },
    itemInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    excludedText: {
        textDecorationLine: 'line-through',
        color: COLORS.GREY,
    },
    actionBtn: {
        padding: 8,
    },
    checkbox: {
        padding: 8,
    },
    checkboxInner: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: COLORS.THEME_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.GREEN,
        borderColor: COLORS.GREEN,
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectBtn: {
        borderWidth: 1,
        marginRight: 15,
        borderRadius: 10,
        borderBottomWidth: 5,
        borderColor: COLORS.DARK_BLUE,
        backgroundColor: COLORS.DARK_BLUE,
    },
    selectBtnDisabled: {
        borderColor: COLORS.GREY,
        backgroundColor: COLORS.GREY,
    },
    selectBtnText: {
        fontSize: 16,
        // Explicit lineHeight: the `common` Text variant has none, so the label's height would
        // otherwise depend on platform font metrics and break the exact row height in itemMetrics.
        lineHeight: 20,
        color: COLORS.WHITE,
        width: '100%',
        paddingBottom: 2,
        fontWeight: '400',
        textAlign: 'center',
        fontFamily: 'Arial',
        backgroundColor: COLORS.DARK_BLUE,
    },
    selectBtnTextDisabled: {
        color: COLORS.WHITE,
        backgroundColor: COLORS.GREY,
    },
    selectInput: {
        width: 67,
        minHeight: 48,
        padding: 10,
        maxWidth: 67,
        fontSize: 20,
        borderWidth: 1,
        borderRadius: 10,
        textAlign: 'center',
        backgroundColor: COLORS.WHITE,
    },
    amountContainer: {
        width: 60,
        minHeight: 40,
        marginRight: 5,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderRadius: 20,
        borderColor: COLORS.LIGHTER_GREY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    amountContainerExcluded: {
        borderColor: COLORS.GREY,
    },
    amount: {
        fontSize: 12,
        textAlign: 'center',
    },
    unit: {
        flex: 1,
        fontSize: 12,
        marginLeft: 5,
    },
});
