// outsource dependencies
import React from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { TouchableOpacity, StyleSheet } from 'react-native';

// local dependencies
import { useTheme } from '../hooks/useTheme';

interface HamburgerProps {
    onPress: () => void;
    style?: any;
}

export const Hamburger: React.FC<HamburgerProps> = ({ onPress, style }) => {
    const theme = useTheme();

    return (
        <TouchableOpacity
            onPress={onPress}
            accessibilityLabel="Open menu"
            style={[styles.container, style]}
            accessibilityHint="Opens the navigation menu"
        >
            <Icon
                size={24}
                name="bars"
                color={theme.colors.text}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
