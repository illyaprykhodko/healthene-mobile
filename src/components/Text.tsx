// outsource dependencies
import React from 'react';
import { StyleSheet, Text as UIText, TextStyle } from 'react-native';
// local dependencies
import { useTheme } from 'hooks/useTheme';

// export type TextVariant = 'common' | 'bold' | 'caption';
export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body'
  | 'bold'
  | 'small'
  | 'common'
  | 'caption'
  | 'semiBold';

interface TextProps {
    color?: string;
    variant?: TextVariant;
    numberOfLines?: number;
    children?: React.ReactNode;
    style?: TextStyle | TextStyle[];
    textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

const allowedAlign = ['auto', 'left', 'right', 'center', 'justify'];

const Text: React.FC<TextProps> = ({
    style,
    color,
    children,
    textAlign,
    numberOfLines,
    variant = 'common',
    ...attr
}) => {
    const theme = useTheme();
    const allStyles: TextStyle[] = [textStyles[variant] || textStyles.common];
    if (textAlign && allowedAlign.includes(textAlign)) {
        allStyles.push({ textAlign });
    }
    allStyles.push({ color: color || theme.colors.text });
    if (style) {
        if (Array.isArray(style)) { allStyles.push(...style); } else { allStyles.push(style); }
    }
    const flat = StyleSheet.flatten(allStyles);
    // RN 0.84 / iOS 26 SDK changed CoreText to apply `fontWeight` ON TOP of an explicit
    // `fontFamily` (synth-bold / weight-axis interpolation). On RN 0.81 it was ignored.
    // Our design system already encodes weight via the variant's fontFamily (Outfit-Regular /
    // Outfit-Medium / Outfit-Bold). Stripping fontWeight here keeps rendering deterministic
    // and matches the pre-upgrade visual.
    if (flat.fontFamily && flat.fontWeight != null) {
        delete flat.fontWeight;
    }
    return (
        <UIText style={flat} numberOfLines={numberOfLines} {...attr}>
            {children}
        </UIText>
    );
};

export default Text;

const textStyles: Record<TextVariant, TextStyle> = {
    common: {
        fontSize: 16,
        fontFamily: 'Outfit-Regular',
    },
    bold: {
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
    },
    semiBold: {
        fontSize: 16,
        fontFamily: 'Outfit-SemiBold',
    },
    h1: {
        fontSize: 32,
        lineHeight: 40,
        fontFamily: 'Outfit-Bold',
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 24,
        lineHeight: 32,
        fontFamily: 'Outfit-Bold',
        letterSpacing: -0.25,
    },
    h3: {
        fontSize: 20,
        lineHeight: 28,
        letterSpacing: 0.15,
        fontFamily: 'Outfit-Medium',
    },
    h4: {
        fontSize: 18,
        lineHeight: 24,
        fontFamily: 'Outfit-Regular',
        letterSpacing: 0.15,
    },
    h5: {
        fontSize: 16,
        lineHeight: 22,
        fontFamily: 'Outfit-Regular',
        letterSpacing: 0.44,
    },
    h6: {
        fontSize: 14,
        lineHeight: 20,
        fontFamily: 'Outfit-Regular',
        letterSpacing: 0.44,
    },
    body: {
        fontSize: 16,
        lineHeight: 24,
        fontFamily: 'Outfit-Regular',
        letterSpacing: 0.5,
    },
    caption: {
        fontSize: 12,
        lineHeight: 16,
        fontFamily: 'Outfit-Regular',
        letterSpacing: 0.4,
    },
    small: {
        fontSize: 10,
        lineHeight: 14,
        fontFamily: 'Outfit-Regular',
        letterSpacing: 0.4,
    },
};
