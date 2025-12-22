// outsource dependencies
import React from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { TouchableOpacity, StyleSheet } from 'react-native';

// local dependencies
import { useTheme } from 'hooks/useTheme';

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
                iconStyle="solid"
                color={theme.colors.background}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
