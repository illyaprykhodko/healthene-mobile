// outsource dependencies
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
// local dependencies
import { COLORS } from '../../constants/colors';

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

export const FoodIcon: React.FC<IconProps> = ({ disabled = false, size = 24 }) => (
    <View style={[
        iconStyles.container,
        { backgroundColor: disabled ? COLORS.LIGHT_GREY : '#FFE0B3' },
        disabled && iconStyles.disabled
    ]}>
        <Icon
            name="utensils"
            size={size}
            color={disabled ? COLORS.GREY : '#C56A00'}
        />
    </View>
);

export const DrinkIcon: React.FC<IconProps> = ({ disabled = false, size = 24 }) => (
    <View style={[
        iconStyles.container,
        { backgroundColor: disabled ? COLORS.LIGHT_GREY : '#E3F2FD' },
        disabled && iconStyles.disabled
    ]}>
        <Icon
            name="glass-martini"
            size={size}
            color={disabled ? COLORS.GREY : '#1976D2'}
        />
    </View>
);

export const SupplementIcon: React.FC<IconProps> = ({ disabled = false, size = 24 }) => (
    <View style={[
        iconStyles.container,
        { backgroundColor: disabled ? COLORS.LIGHT_GREY : '#F3E5F5' },
        disabled && iconStyles.disabled
    ]}>
        <Icon
            name="capsules"
            size={size}
            color={disabled ? COLORS.GREY : '#7B1FA2'}
        />
    </View>
);

export const MeasurementIcon: React.FC<IconProps> = ({ disabled = false, size = 24 }) => (
    <View style={[
        iconStyles.container,
        { backgroundColor: disabled ? COLORS.LIGHT_GREY : '#E8F5E8' },
        disabled && iconStyles.disabled
    ]}>
        <Icon
            name="ruler"
            size={size}
            color={disabled ? COLORS.GREY : '#388E3C'}
        />
    </View>
);

export const ActivityIcon: React.FC<IconProps> = ({ disabled = false, size = 24 }) => (
    <View style={[
        iconStyles.container,
        { backgroundColor: disabled ? COLORS.LIGHT_GREY : '#FFF3E0' },
        disabled && iconStyles.disabled
    ]}>
        <Icon
            name="running"
            size={size}
            color={disabled ? COLORS.GREY : '#F57C00'}
        />
    </View>
);

