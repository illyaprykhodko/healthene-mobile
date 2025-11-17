// outsource dependencies
import React, { memo, useCallback } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { StyleSheet, TouchableOpacity, ViewStyle, StyleProp, GestureResponderEvent } from 'react-native';
// local dependencies
import { useTheme } from 'hooks/useTheme';

// Temporary status type until full migration
export type PhaseItemStatus = 'DONE' | 'PENDING' | 'DID_NOT_EAT' | string;

export interface CheckboxProps {
    size?: number;
    value?: boolean;
    editable?: boolean;
    isDayOverview?: boolean;
    status?: PhaseItemStatus;
    applyClickableZone?: boolean;
    style?: StyleProp<ViewStyle>;
    onChange: (next: boolean, event: GestureResponderEvent) => void;
}

const clickableZone = { bottom: 25, left: 25, right: 25, top: 25 } as const;

const styles = StyleSheet.create({
    container: {
        borderWidth: 2,
        borderRadius: 5,
        display: 'flex',
        flexDirection: 'column',
    },
});

const CheckboxComponent: React.FC<CheckboxProps> = ({
    style,
    onChange,
    size = 22,
    value = false,
    editable = true,
    status = 'PENDING',
    isDayOverview = false,
    applyClickableZone = true,
}) => {
    const theme = useTheme();
    const handlePress = useCallback((event: GestureResponderEvent) => {
        if (!editable) { return; }
        onChange(!value, event);
    }, [editable, onChange, value]);

    const renderGeneralIcon = () => (value
        ? <Icon solid name="check-square" size={size + 15} color={theme.colors.successAlt} />
        : <Icon name="square" size={size + 15} color={theme.colors.white} />
    );

    const renderDayOverviewIcon = () => {
        switch (status) {
            default:
                return <Icon name="square" size={size + 3} color={theme.colors.white} />;
            case 'DONE':
                return <Icon solid name="check-square" size={size + 13} color={theme.colors.successAlt} />;
            case 'DID_NOT_EAT':
                return <Icon solid name="minus-square" size={size + 5} color={theme.colors.darkBlue} />;
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            hitSlop={applyClickableZone ? clickableZone : undefined}
            style={StyleSheet.flatten([styles.container, style, {
                paddingVertical: 0.5,
                paddingHorizontal: status === 'DONE' ? 0 : 2.7,
                borderColor: value ? 'transparent' : theme.colors.border,
            }])}
        >
            {isDayOverview ? renderDayOverviewIcon() : renderGeneralIcon()}
        </TouchableOpacity>
    );
};

export const Checkbox = memo(CheckboxComponent);
export default Checkbox;
