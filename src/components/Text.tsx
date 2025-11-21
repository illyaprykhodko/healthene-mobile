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
  | 'caption';

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
    return (
        <UIText style={StyleSheet.flatten(allStyles)} numberOfLines={numberOfLines} {...attr}>
            {children}
        </UIText>
    );
};

export default Text;

const textStyles: Record<TextVariant, TextStyle> = {
    common: {
        fontSize: 16
    },
    bold: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    h1: {
        fontSize: 32,
        lineHeight: 40,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 24,
        lineHeight: 32,
        fontWeight: '700',
        letterSpacing: -0.25,
    },
    h3: {
        fontSize: 20,
        lineHeight: 28,
        letterSpacing: 0,
        fontWeight: '600',
    },
    h4: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '600',
        letterSpacing: 0.15,
    },
    h5: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '500',
        letterSpacing: 0.15,
    },
    h6: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
        letterSpacing: 0.1,
    },
    body: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '400',
        letterSpacing: 0.5,
    },
    caption: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '400',
        letterSpacing: 0.4,
    },
    small: {
        fontSize: 10,
        lineHeight: 14,
        fontWeight: '400',
        letterSpacing: 0.4,
    },
};
