// outsource dependencies
import React from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

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

const Controls: React.FC<ControlsProps> = ({
    style,
    unit = '',
    amount = 1,
    updateData,
    disabled = false,
    isSurrogateRecipe = false,
}) => {
    const handleUpdateData = (newAmount: number) => {
        const prepareAmount = newAmount - Math.floor(newAmount);
        if (prepareAmount < 0.5 && prepareAmount !== 0) {
            updateData(Math.floor(newAmount) + 0.5);
        } else if (prepareAmount > 0.5 && prepareAmount < 1) {
            updateData(Math.ceil(newAmount));
        } else {
            updateData(newAmount);
        }
    };

    // const formatAmount = (value: number): string => {
    //     if (value % 1 === 0) {
    //         return value.toString();
    //     }
    //     if (value % 1 === 0.5) {
    //         const whole = Math.floor(value);
    //         return whole > 0 ? `${whole} ½` : '½';
    //     }
    //     return value.toFixed(2);
    // };

    return (
        <View style={[styles.wrapper, style]}>
            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.icon}
                    hitSlop={clickableZone}
                    disabled={disabled || amount <= 0.5}
                    onPress={() => !(disabled || amount <= 0.5) && handleUpdateData(amount - 0.5)}
                >
                    <Icon name="minus" color="#76A7D8" size={24} />
                </TouchableOpacity>
                {/* <Text style={styles.count}>{formatAmount(amount)}</Text> */}
                <Text style={styles.count}>{decimalsToFractions(amount)}</Text>
                <TouchableOpacity
                    disabled={disabled}
                    style={styles.icon}
                    hitSlop={clickableZone}
                    onPress={() => !disabled && handleUpdateData(amount + 0.5)}
                >
                    <Icon name="plus" color="#76A7D8" size={24} />
                </TouchableOpacity>
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
    count: {
        color: COLORS.BLACK,
        fontSize: 57,
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
