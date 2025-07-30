// outside dependencies
import React from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { StyleSheet, TouchableOpacity, View, StyleProp, ViewStyle } from 'react-native';
// local dependencies
import Text from './Text';
import { useTheme } from '../hooks/useTheme';
import { useKeyboard } from 'services/keyboard';

type IconType = 'brand' | 'light' | 'solid' | null;

interface BaseProps {
  // icon: string;
  size?: number;
  color?: string;
  textLeft?: string;
  textRight?: string;
  disabled?: boolean;
  iconType?: IconType;
  closeKeyboard?: boolean;
  style?: StyleProp<ViewStyle>;
  // CustomIcon?: React.ReactNode;
  onPress?: (...args: any[]) => void;
}

interface PropsWithIcon extends BaseProps {
  icon: string;
  CustomIcon?: undefined;
}

interface PropsWithCustomIcon extends BaseProps {
  CustomIcon?: React.ReactNode;
  icon?: undefined;
}

type IconButtonProps = PropsWithIcon | PropsWithCustomIcon;

export const IconButton: React.FC<IconButtonProps> = props => {
    const {
        // icon,
        style,
        color,
        onPress,
        size = 22,
        textLeft = '',
        textRight = '',
        iconType = null,
        disabled = false,
        // CustomIcon = null,
        closeKeyboard = false,
    } = props;

    const theme = useTheme();
    const keyboard = useKeyboard();
    const buttonColor = color || theme.colors.primary;

    const handleOnPress = (...args: any[]) => {
        if (closeKeyboard) {
            keyboard.hideKeyboard();
        }
        if (!disabled && typeof onPress === 'function') {
            onPress(...args);
        }
    };

    const containerStyle = StyleSheet.flatten([
        styles.container,
        style,
    ]);

    const iconColor = disabled ? `${buttonColor}99` : buttonColor; // 60% opacity when disabled

    return (
        <TouchableOpacity
            disabled={disabled}
            style={containerStyle}
            onPress={handleOnPress}
            activeOpacity={disabled ? 1 : 0.5}
        >
            <View style={styles.contentContainer}>
                {textLeft && (
                    <Text
                        color={iconColor}
                        style={[styles.text, { fontSize: size, marginBottom: Math.floor(size / 5) }]}
                    >
                        {textLeft}{' '}
                    </Text>
                )}
                {props.CustomIcon != null && props.CustomIcon}
                {props.icon != null
          && <Icon
              size={size}
              name={props.icon}
              color={iconColor}
              {...(iconType ? { [iconType]: true } : {})}
          />}
                {textRight && (
                    <Text
                        color={iconColor}
                        style={[styles.text, { fontSize: size }]}
                    >
                        {' '}{textRight}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    text: {
        flex: 1,
    },
});
