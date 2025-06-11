import React from 'react';
import {
    ViewStyle,
    TextStyle,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import Text from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  textStyle?: TextStyle;
  size?: ButtonSize;
  loading?: boolean;
  style?: ViewStyle;
  color?: string;
  title: string;
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    loading = false,
    size = 'md',
    title,
    style,
    textStyle,
    disabled,
    ...props
}) => {
    const theme = useTheme();

    const getBackgroundColor = () => {
        if (disabled) { return theme.colors.textSecondary; }
        switch (variant) {
            case 'primary':
                return theme.colors.primary;
            case 'secondary':
                return theme.colors.secondary;
            case 'outline':
            case 'text':
                return 'transparent';
            default:
                return theme.colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) { return theme.colors.textSecondary; }
        switch (variant) {
            case 'primary':
            case 'secondary':
                return theme.colors.background;
            case 'outline':
            case 'text':
                return theme.colors.primary;
            default:
                return theme.colors.background;
        }
    };

    const getBorderColor = () => {
        if (disabled) { return theme.colors.textSecondary; }
        switch (variant) {
            case 'outline':
                return theme.colors.primary;
            default:
                return 'transparent';
        }
    };

    const getPadding = () => {
        switch (size) {
            case 'sm':
                return theme.spacing.sm;
            case 'lg':
                return theme.spacing.lg;
            default:
                return theme.spacing.md;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    padding: getPadding(),
                    borderRadius: theme.borderRadius.sm,
                },
                variant === 'outline' && styles.outline,
                style,
            ]}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text
                    variant="bold"
                    color={getTextColor()}
                    style={textStyle}
                >
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    outline: {
        borderWidth: 1,
    },
});
