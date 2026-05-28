// outsource dependencies
import React, { useEffect, useRef, useState } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { OFFSET } from 'constants/offset';
import { COLORS } from 'constants/colors';
import { decimalsToFractions } from 'services/filter';

interface ControlsProps {
    unit?: string;
    amount?: number;
    style?: ViewStyle;
    disabled?: boolean;
    multiplier?: number;
    isSurrogateRecipe?: boolean;
    updateData: (amount: number) => void;
}

const clickableZone = { bottom: 25, left: 25, right: 25, top: 25 };

const normalizeAmount = (value: number): number => {
    const fraction = value - Math.floor(value);
    if (fraction < 0.5 && fraction !== 0) {
        return Math.floor(value) + 0.5;
    }
    if (fraction > 0.5 && fraction < 1) {
        return Math.ceil(value);
    }
    return value;
};

const Controls: React.FC<ControlsProps> = ({
    style,
    unit = '',
    amount = 1,
    updateData,
    disabled = false,
    isSurrogateRecipe = false,
}) => {
    const [localAmount, setLocalAmount] = useState(amount);
    const pendingAmount = useRef<number | null>(null);
    const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const updateDataRef = useRef(updateData);

    useEffect(() => {
        updateDataRef.current = updateData;
    }, [updateData]);

    useEffect(() => {
        setLocalAmount(amount);
    }, [amount]);

    // Flush any pending value on unmount so navigating away mid-debounce
    // doesn't drop the user's last change.
    useEffect(() => () => {
        if (flushTimer.current) {
            clearTimeout(flushTimer.current);
        }
        if (pendingAmount.current !== null) {
            updateDataRef.current(pendingAmount.current);
            pendingAmount.current = null;
        }
    }, []);

    const handleUpdateData = (next: number) => {
        const normalized = normalizeAmount(next);
        setLocalAmount(normalized);
        pendingAmount.current = normalized;
        if (flushTimer.current) {
            clearTimeout(flushTimer.current);
        }
        flushTimer.current = setTimeout(() => {
            flushTimer.current = null;
            if (pendingAmount.current !== null) {
                const value = pendingAmount.current;
                pendingAmount.current = null;
                updateDataRef.current(value);
            }
        }, 1000);
    };

    return (
        <View style={[styles.wrapper, style]}>
            <View style={styles.controls}>
                <Pressable
                    hitSlop={clickableZone}
                    unstable_pressDelay={0}
                    style={({ pressed }) => [styles.icon, pressed && styles.iconPressed]}
                    onPress={() => !(disabled || localAmount <= 0.5) && handleUpdateData(localAmount - 0.5)}
                >
                    <Icon iconStyle="solid" name="minus" color="#76A7D8" size={24} />
                </Pressable>
                <Text style={styles.count}>{decimalsToFractions(localAmount)}</Text>
                <Pressable
                    hitSlop={clickableZone}
                    unstable_pressDelay={0}
                    onPress={() => !disabled && handleUpdateData(localAmount + 0.5)}
                    style={({ pressed }) => [styles.icon, pressed && styles.iconPressed]}
                >
                    <Icon iconStyle="solid" name="plus" color="#76A7D8" size={24} />
                </Pressable>
            </View>
            {!unit ? null : (
                <Text
                    style={[
                        styles.units,
                        !isSurrogateRecipe ? styles.unitsTextTransform : {},
                    ]}
                >
                    {unit}
                </Text>
            )}
        </View>
    );
};

export default Controls;

const styles = StyleSheet.create({
    wrapper: {
        marginHorizontal: OFFSET.HORIZONTAL * 3,
    },
    controls: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    icon: {
        borderWidth: 2,
        borderColor: '#76A7D8',
        borderRadius: 50,
        width: 50,
        height: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E0EBF7',
    },
    iconPressed: {
        backgroundColor: '#C7DAEF',
    },
    count: {
        color: COLORS.BLACK,
        fontSize: 57,
        minWidth: 180,
        fontWeight: '500',
        textAlign: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL * 3,
    },
    units: {
        color: COLORS.DARK_GREY,
        textAlign: 'center',
        fontSize: 16,
        marginTop: OFFSET.VERTICAL,
    },
    unitsTextTransform: {
        textTransform: 'uppercase',
    },
});
