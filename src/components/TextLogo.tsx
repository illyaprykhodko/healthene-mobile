// outsource dependencies
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ImageBackground, Platform, StyleProp, TextStyle, ViewStyle } from 'react-native';
// local dependencies
import { useTheme } from 'hooks/useTheme';
import { useFontScale } from 'hooks/useFontScale';
import { MAX_FONT_SCALE } from 'constants/typography';
import { useBoldTextEnabled } from 'hooks/useBoldTextEnabled';

interface TextLogoProps {
    color?: string;
    style?: StyleProp<TextStyle>;
}

export const TextLogo: React.FC<TextLogoProps> = ({ style, color }) => {
    const theme = useTheme();
    const fontScale = useFontScale();
    const boldText = useBoldTextEnabled();
    const resolved = color || theme.colors.white;
    return (
        // Re-key on scale/bold change so the single-line logo re-measures instead of staying
        // truncated ("Health…") after a live OS text-size change. See note in components/Text.
        <Text
            key={`${boldText ? 'b' : 'n'}-${fontScale}`}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            style={StyleSheet.flatten([
                styles.textLogo,
                resolved ? { color: resolved } : {},
                style,
            ])}
            numberOfLines={1}
        >
            {' '}Healthene®{' '}
        </Text>
    );
};

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
