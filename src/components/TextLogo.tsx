// outsource dependencies
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ImageBackground, Platform, StyleProp, TextStyle, ViewStyle } from 'react-native';
// local dependencies
import { COLORS } from '../constants/colors';

interface TextLogoProps {
    color?: string;
    style?: StyleProp<TextStyle>;
}

export const TextLogo: React.FC<TextLogoProps> = ({ style, color = COLORS.THEME_INVERSE }) => (
    <Text
        style={StyleSheet.flatten([
            styles.textLogo,
            color ? { color } : {},
            style,
        ])}
        numberOfLines={1}
    >
        {' '}Healthene{' '}
    </Text>
);

interface IconLogoProps {
    disabled?: boolean;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
}

export const IconLogo: React.FC<IconLogoProps> = ({ onPress, disabled = false, style }) => {
    const imageSource
    = Platform.OS === 'ios'
        ? require('../../assets/logo.png')
        : { uri: 'asset:/logo.png' };

    return (
        <TouchableOpacity onPress={onPress} disabled={disabled}>
            <ImageBackground source={imageSource} style={[styles.iconLogo, style]} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    textLogo: {
        fontSize: 26,
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconLogo: {
        width: 35,
        height: 35,
    },
});
