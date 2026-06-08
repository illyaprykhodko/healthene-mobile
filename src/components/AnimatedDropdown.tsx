// outsource dependencies
import Icon from '@react-native-vector-icons/fontawesome5';
import React, { useEffect, useMemo, useState } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { StyleSheet, TouchableOpacity, View, ScrollView, StyleProp, ViewStyle, TextStyle } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';

export interface AnimatedDropdownOption {
    id: number | string;
    label: string;
}

interface AnimatedDropdownProps {
    prefix?: string;
    valueLabel: string;
    maxHeight?: number;
    options: AnimatedDropdownOption[];
    triggerStyle?: StyleProp<ViewStyle>;
    containerStyle?: StyleProp<ViewStyle>;
    optionTextStyle?: StyleProp<TextStyle>;
    triggerTextStyle?: StyleProp<TextStyle>;
    onSelect: (option: AnimatedDropdownOption) => void;
}

export const AnimatedDropdown: React.FC<AnimatedDropdownProps> = ({
    options,
    onSelect,
    valueLabel,
    prefix = '',
    triggerStyle,
    containerStyle,
    maxHeight = 180,
    optionTextStyle,
    triggerTextStyle,
}) => {
    const theme = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const progress = useSharedValue(0);

    const hasManyOptions = options.length > 1;
    const computedMaxHeight = useMemo(() => {
        const estimatedContentHeight = options.length * 56;
        return Math.min(maxHeight, estimatedContentHeight || maxHeight);
    }, [maxHeight, options.length]);

    useEffect(() => {
        progress.value = withTiming(isOpen ? 1 : 0, {
            duration: isOpen ? 350 : 250,
            easing: isOpen ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        });
    }, [isOpen, progress]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        maxHeight: computedMaxHeight * progress.value,
        transform: [{ scaleY: 0.96 + (0.04 * progress.value) }],
        overflow: 'hidden',
    }));
    const mergedTriggerTextStyle = useMemo(
        () => StyleSheet.flatten([styles.triggerText, { color: theme.colors.blue }, triggerTextStyle]) || {},
        [theme.colors.blue, triggerTextStyle]
    );
    const mergedOptionTextStyle = useMemo(
        () => StyleSheet.flatten([styles.optionText, { color: theme.colors.text }, optionTextStyle]) || {},
        [theme.colors.text, optionTextStyle]
    );

    return (
        <View style={[styles.container, containerStyle]}>
            <TouchableOpacity
                activeOpacity={hasManyOptions ? 0.75 : 1}
                disabled={!hasManyOptions}
                onPress={() => setIsOpen(prev => !prev)}
                style={[
                    styles.trigger,
                    {
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surfaceAlt,
                    },
                    triggerStyle
                ]}
            >
                <Text style={mergedTriggerTextStyle}>
                    {prefix}{valueLabel}
                </Text>
                {hasManyOptions && (
                    <Icon
                        size={16}
                        iconStyle="solid"
                        color={theme.colors.blue}
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                    />
                )}
            </TouchableOpacity>

            <Animated.View
                style={[styles.dropdown, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }, animatedStyle]}
                pointerEvents={isOpen ? 'auto' : 'none'}
            >
                <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                    {options.map((option, index) => {
                        const isSelected = option.label === valueLabel;
                        const isLast = index === options.length - 1;
                        return (
                            <TouchableOpacity
                                key={option.id}
                                onPress={() => {
                                    onSelect(option);
                                    setIsOpen(false);
                                }}
                                style={[
                                    styles.option,
                                    isLast && styles.optionLast,
                                    {
                                        borderBottomColor: theme.colors.border,
                                        backgroundColor: isSelected ? theme.colors.surfaceAlt : theme.colors.surface,
                                    }
                                ]}
                            >
                                <Text style={StyleSheet.flatten([mergedOptionTextStyle, isSelected && styles.optionTextSelected])}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '115%',
        alignSelf: 'center',
        position: 'relative',
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0,
        borderRadius: 0,
        paddingVertical: 12,
        paddingHorizontal: 16,
        zIndex: 5,
    },
    triggerText: {
        fontSize: 18,
        fontWeight: '600',
        marginRight: 8,
    },
    dropdown: {
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 30,
        marginTop: 0,
        borderWidth: 0,
        borderRadius: 0,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
    },
    dropdownScroll: {
        maxHeight: 137,
    },
    option: {
        width: '100%',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    optionLast: {
        borderBottomWidth: 0,
    },
    optionText: {
        fontSize: 21,
        textAlign: 'center',
        fontWeight: '500',
    },
    optionTextSelected: {
        fontWeight: '600',
    },
});

export default AnimatedDropdown;
