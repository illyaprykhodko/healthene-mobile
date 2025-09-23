// outsource dependencies
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
// local dependencies
import { useTheme } from 'hooks/useTheme';

const iconStyles = StyleSheet.create({
    container: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabled: {
        opacity: 0.5,
    },
});

interface IconProps {
  disabled?: boolean;
  size?: number;
}

export const FoodIcon: React.FC<IconProps> = ({ disabled = false, size = 24 }) => {
    const theme = useTheme();
    return (
        <View style={[
            iconStyles.container,
            { backgroundColor: disabled ? theme.colors.lightGrey : '#FFE0B3' },
            disabled && iconStyles.disabled
        ]}>
            <Icon
                name="utensils"
                size={size}
                color={disabled ? theme.colors.grey : '#C56A00'}
            />
        </View>
    );
};

export const DrinkIcon: React.FC<IconProps> = ({ disabled = false, size = 24 }) => {
    const theme = useTheme();
    return (
        <View style={[
            iconStyles.container,
            { backgroundColor: disabled ? theme.colors.lightGrey : '#E3F2FD' },
            disabled && iconStyles.disabled
        ]}>
            <Icon
                name="glass-martini"
                size={size}
                color={disabled ? theme.colors.grey : '#1976D2'}
            />
        </View>
    );
};

export const SupplementIcon: React.FC<IconProps> = ({ disabled = false, size = 24 }) => {
    const theme = useTheme();
    return (
        <View style={[
            iconStyles.container,
            { backgroundColor: disabled ? theme.colors.lightGrey : '#F3E5F5' },
            disabled && iconStyles.disabled
        ]}>
            <Icon
                name="capsules"
                size={size}
                color={disabled ? theme.colors.grey : '#7B1FA2'}
            />
        </View>
    );
};

export const MeasurementIcon: React.FC<IconProps> = ({ disabled = false, size = 24 }) => {
    const theme = useTheme();
    return (
        <View style={[
            iconStyles.container,
            { backgroundColor: disabled ? theme.colors.lightGrey : '#E8F5E8' },
            disabled && iconStyles.disabled
        ]}>
            <Icon
                name="ruler"
                size={size}
                color={disabled ? theme.colors.grey : '#388E3C'}
            />
        </View>
    );
};

export const ActivityIcon: React.FC<IconProps> = ({ disabled = false, size = 24 }) => {
    const theme = useTheme();
    return (
        <View style={[
            iconStyles.container,
            { backgroundColor: disabled ? theme.colors.lightGrey : '#FFF3E0' },
            disabled && iconStyles.disabled
        ]}>
            <Icon
                name="running"
                size={size}
                color={disabled ? theme.colors.grey : '#F57C00'}
            />
        </View>
    );
};

