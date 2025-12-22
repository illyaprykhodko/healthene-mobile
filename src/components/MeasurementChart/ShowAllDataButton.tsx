// outsource dependencies
import React, { memo } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ShowAllDataButtonProps {
    onPress: () => void;
}

const ShowAllDataButton: React.FC<ShowAllDataButtonProps> = ({ onPress }) => (
    <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>Show All Data</Text>
        <Icon iconStyle="solid" name="chevron-right" size={14} color="#000" />
    </TouchableOpacity>
);

export default memo(ShowAllDataButton);

const styles = StyleSheet.create({
    button: {
        padding: 20,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#E0E0E0',
        backgroundColor: '#E0EBF780',
        justifyContent: 'space-between',
    },
    buttonText: {
        fontSize: 18,
        color: '#000',
        fontWeight: '500',
    },
});
