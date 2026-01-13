import React from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { StyleSheet, TouchableOpacity } from 'react-native';
// local dependencies
import Text from 'components/Text';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';

interface BackBtnProps {
    color?: string;
    label?: string;
    onPress: () => void;
}

const BackBtn: React.FC<BackBtnProps> = ({
    onPress,
    label = 'Back',
    color = COLORS.WHITE,
}) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <Icon iconStyle="solid" name="chevron-left" size={16} color={color} />
            <Text style={[styles.text, { color }]}>{label}</Text>
        </TouchableOpacity>
    );
};

export default BackBtn;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    text: {
        fontSize: 16,
        marginLeft: OFFSET.HORIZONTAL / 2,
        fontWeight: '600',
    },
});
