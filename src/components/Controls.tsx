// outsource dependencies
import React, { memo } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { StyleSheet, View, TouchableOpacity } from 'react-native';

// local dependencies
import Text from './Text';
import { OFFSET } from 'constants/offset';

interface ControlsProps {
    amount: number;
    unit?: string;
    disabled?: boolean;
    multiplier?: number;
    isSurrogateRecipe?: boolean;
    updateData: (amount: number) => void;
}

const Controls: React.FC<ControlsProps> = ({ amount, updateData, disabled, unit }) => {
    return (
        <View style={styles.container}>
            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.icon}
                    activeOpacity={0.7}
                    onPress={() => !(disabled || amount <= 1) && updateData(amount - 1)}
                >
                    <Icon iconStyle="solid" name="minus" color="#76A7D8" size={24} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.count}>
                        {amount}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.icon}
                    activeOpacity={0.7}
                    onPress={() => !disabled && updateData(amount + 1)}
                >
                    <Icon iconStyle="solid" name="plus" color="#76A7D8" size={24} />
                </TouchableOpacity>
            </View>
            {unit && (
                <Text style={styles.units}>{unit}</Text>
            )}
        </View>
    );
};

export default memo(Controls);

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        borderWidth: 2,
        borderColor: '#76A7D8',
        borderRadius: 50,
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E0EBF7',
    },
    count: {
        fontSize: 50,
        fontWeight: '500',
        textAlign: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL,
        color: '#000000',
    },
    units: {
        textTransform: 'uppercase',
        color: '#7B7B7B',
        textAlign: 'center',
        marginTop: 8,
        fontSize: 14,
    },
});
