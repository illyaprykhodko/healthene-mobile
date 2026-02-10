// outsource dependencies
import React from 'react';
import {
    ViewStyle,
    TextStyle,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    TouchableOpacityProps,
} from 'react-native';
// local dependencies
import Text from './Text';
import { useTheme } from '../hooks/useTheme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  style?: ViewStyle | ViewStyle[];
  variant?: ButtonVariant;
  textStyle?: TextStyle;
  size?: ButtonSize;
  loading?: boolean;
  color?: string;
  title: string;
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({
    style,
    title,
    disabled,
    textStyle,
    size = 'md',
    loading = false,
    variant = 'primary',
    ...props
}) => {
    const theme = useTheme();

    const getBackgroundColor = () => {
        if (disabled) {
            switch (variant) {
                case 'primary':
                    return theme.colors.muted;
                case 'outline':
                    return theme.colors.background;
                default:
                    return theme.colors.textSecondary;
            }
        }
        switch (variant) {
            case 'primary':
                return theme.colors.successAlt;
                // return theme.colors.primary;
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
        if (disabled) {
            switch (variant) {
                case 'outline':
                case 'primary':
                    return theme.colors.textMuted;
                default:
                    return theme.colors.textSecondary;
            }
        }
        switch (variant) {
            case 'primary':
            case 'secondary':
                // return theme.colors.background;
                return theme.colors.successAltText;
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
                    padding: getPadding(),
                    borderColor: getBorderColor(),
                    borderRadius: theme.borderRadius.sm,
                    backgroundColor: getBackgroundColor(),
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
                    style={textStyle}
                    color={getTextColor()}
                >
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    outline: {
        borderWidth: 1,
    },
});
