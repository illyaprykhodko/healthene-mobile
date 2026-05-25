
// outsource dependencies
import Icon from '@react-native-vector-icons/feather';
import { StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

// local dependencies
import Text from 'components/Text';
import { useAppSelector } from 'store';
import { COLORS } from 'constants/colors';
import DefImage from 'components/DefImage';
import { selectCurrentStep } from 'store/slices/shoppingSlice';
import { SHOPPING_STATUS, SHOPPING_STEP } from 'constants/spec';

interface ShoppingItemProps {
    item: any;
    status: string;
    disabled?: boolean;
    isConfirmed: boolean;
    onUpdate: (item: any) => void;
    onAmountFocus?: (itemId: number) => void;
}

const ShoppingItem: React.FC<ShoppingItemProps> = memo(({
    item,
    status,
    onUpdate,
    disabled,
    isConfirmed,
    onAmountFocus,
}) => {
    const ref = useRef<TextInput>(null);
    const [editable, setEditable] = useState(false);
    const [amount, setAmount] = useState(String(item?.amount || 1));

    const currentStep = useAppSelector(selectCurrentStep);
    const isExcluded = item?.excluded;
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

    const showExcludeButton = (currentStep === SHOPPING_STEP.MAIN
        || currentStep === SHOPPING_STEP.CHECK)
        && status !== SHOPPING_STATUS.CONFIRMED
        && status !== SHOPPING_STATUS.SHOP_ON_MY_OWN
    ;
    const showShoppingCheckbox = status === SHOPPING_STATUS.SHOP_ON_MY_OWN;
    const showSelectButton = (currentStep === SHOPPING_STEP.MAIN || currentStep === SHOPPING_STEP.MEAL) && !isConfirmed;

    return (
        <View style={[styles.container, isExcluded && styles.excluded]}>
            <DefImage
                src={item?.coverImage?.url}
                style={isExcluded ? { ...styles.image, ...styles.excludedImage } : styles.image}
            />
            <View style={styles.textContainer}>
                <Text
                    variant="h5"
                    style={[styles.name, isExcluded && styles.excludedText]}
                >
                    {item.name || item.food?.name}
                </Text>
                <View style={styles.itemInfo}>
                    {showSelectButton ? (
                        <View style={styles.controlsContainer}>
                            <TouchableOpacity
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
                                    onFocus={() => onAmountFocus?.(item?.id)}
                                    style={[
                                        styles.selectInput,
                                        {
                                            color: editable ? COLORS.BLACK : COLORS.DARK_GREY,
                                            borderColor: isItemDisabled ? COLORS.GREY : COLORS.DARK_BLUE,
                                        }
                                    ]}
                                />
                                <Text style={[styles.selectBtnText, isItemDisabled && styles.selectBtnTextDisabled]}>
                                    select
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={[styles.amountContainer, isExcluded && styles.amountContainerExcluded]}>
                            <Text style={[styles.amount, isExcluded && styles.excludedText]}>
                                {item.amount}
                            </Text>
                        </View>
                    )}
                    <Text color={COLORS.GREY} style={styles.unit}>
                        {item?.unitOfMeasure}
                    </Text>
                </View>
            </View>

            {showExcludeButton && (
                <TouchableOpacity
                    disabled={disabled}
                    onPress={handleExclude}
                    style={styles.actionBtn}
                >
                    <Icon
                        size={24}
                        name={isExcluded ? 'plus-square' : 'trash-2'}
                        color={isExcluded ? COLORS.BLACK : COLORS.GREY}
                    />
                </TouchableOpacity>
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
                <TouchableOpacity
                    disabled={disabled}
                    style={styles.checkbox}
                    onPress={handlePurchase}
                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                >
                    <View style={[
                        styles.checkboxInner,
                        isPurchased && styles.checkboxChecked
                    ]}>
                        {isPurchased && (
                            <Icon name="check" size={16} color={COLORS.WHITE} />
                        )}
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
});

export default ShoppingItem;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: COLORS.WHITE,
        borderBottomWidth: StyleSheet.hairlineWidth,
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
        height: 48,
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
        height: 40,
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
