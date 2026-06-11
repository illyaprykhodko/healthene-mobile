// outsource dependencies
import React, { memo } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { StyleSheet, View, TouchableOpacity } from 'react-native';

// local dependencies
import Text from './Text';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';

interface ControlsProps {
    amount: number;
    unit?: string;
    disabled?: boolean;
    multiplier?: number;
    isSurrogateRecipe?: boolean;
    updateData: (amount: number) => void;
}

const Controls: React.FC<ControlsProps> = ({ amount, updateData, disabled, unit }) => {
    const theme = useTheme();
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
                    <Text style={[styles.count, { color: theme.colors.text }]}>
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
                <Text style={[styles.units, { color: theme.colors.textSecondary }]}>{unit}</Text>
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
    },
    units: {
        textTransform: 'uppercase',
        textAlign: 'center',
        marginTop: 8,
        fontSize: 14,
    },
});
