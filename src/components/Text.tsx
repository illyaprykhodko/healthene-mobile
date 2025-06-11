import React from 'react';
import { StyleSheet, Text as UIText, TextStyle } from 'react-native';

// export type TextVariant = 'common' | 'bold' | 'caption';
export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body'
  | 'caption'
  | 'small'
  | 'common'
  | 'bold';

interface TextProps {
  children?: React.ReactNode;
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  style?: TextStyle | TextStyle[];
  color?: string;
  variant?: TextVariant;
}

const textStyles: Record<TextVariant, TextStyle> = {
    common: {
        fontSize: 16
    },
    bold: {
        fontWeight: 'bold',
        fontSize: 16
    },
    h1: {
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40,
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 32,
        letterSpacing: -0.25,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28,
        letterSpacing: 0,
    },
    h4: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: 0.15,
    },
    h5: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 22,
        letterSpacing: 0.15,
    },
    h6: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
        letterSpacing: 0.1,
    },
    body: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        letterSpacing: 0.5,
    },
    caption: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
        letterSpacing: 0.4,
    },
    small: {
        fontSize: 10,
        fontWeight: '400',
        lineHeight: 14,
        letterSpacing: 0.4,
    },
};

const allowedAlign = ['auto', 'left', 'right', 'center', 'justify'];

const Text: React.FC<TextProps> = ({
    children,
    textAlign,
    style,
    color = '#222',
    variant = 'common',
    ...attr
}) => {
    const allStyles: TextStyle[] = [textStyles[variant] || textStyles.common];
    if (textAlign && allowedAlign.includes(textAlign)) {
        allStyles.push({ textAlign });
    }
    if (color) {
        allStyles.push({ color });
    }
    if (style) {
        if (Array.isArray(style)) { allStyles.push(...style); } else { allStyles.push(style); }
    }
    return (
        <UIText style={StyleSheet.flatten(allStyles)} {...attr}>
            {children}
        </UIText>
    );
};

export default Text;
