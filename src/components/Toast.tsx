// outsource dependencies
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// local dependencies
import { useTheme } from '../hooks/useTheme';
import { MAX_FONT_SCALE } from '../constants/typography';

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 8,
        marginHorizontal: 16,
        // shadowColor: '#000',
        // shadowOpacity: 0.25,
        // shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
    },
});

const ToastContent: React.FC<{
    text1?: string;
    text2?: string;
    type: 'success' | 'error' | 'warning' | 'info';
}> = ({ type, text1, text2 }) => {
    const theme = useTheme();
  
    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return theme.colors.success;
            case 'error':
                return theme.colors.error;
            case 'warning':
                return theme.colors.warning;
            case 'info':
                return theme.colors.info;
            default:
                return theme.colors.primary;
        }
    };

    const getTextColor = () => {
        return theme.colors.background === '#000000' ? '#FFFFFF' : '#000000';
    };

    return (
        <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
            {text1 && <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.title, { color: getTextColor() }]}>{text1}</Text>}
            {text2 && <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.message, { color: getTextColor() }]}>{text2}</Text>}
        </View>
    );
};

export const toastConfig = {
    success: ({ text1, text2 }: { text1?: string; text2?: string }) => (
        <ToastContent type="success" text1={text1} text2={text2} />
    ),
    error: ({ text1, text2 }: { text1?: string; text2?: string }) => (
        <ToastContent type="error" text1={text1} text2={text2} />
    ),
    warning: ({ text1, text2 }: { text1?: string; text2?: string }) => (
        <ToastContent type="warning" text1={text1} text2={text2} />
    ),
    info: ({ text1, text2 }: { text1?: string; text2?: string }) => (
        <ToastContent type="info" text1={text1} text2={text2} />
    ),
};
