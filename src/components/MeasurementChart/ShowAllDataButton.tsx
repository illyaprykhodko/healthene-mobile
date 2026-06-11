// outsource dependencies
import React, { memo } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

// local dependencies
import { useTheme } from 'hooks/useTheme';

interface ShowAllDataButtonProps {
    onPress: () => void;
}

const ShowAllDataButton: React.FC<ShowAllDataButtonProps> = ({ onPress }) => {
    const theme = useTheme();
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.button, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}
        >
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>Show All Data</Text>
            <Icon iconStyle="solid" name="chevron-right" size={14} color={theme.colors.text} />
        </TouchableOpacity>
    );
};

export default memo(ShowAllDataButton);

const styles = StyleSheet.create({
    button: {
        padding: 20,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '500',
    },
});
