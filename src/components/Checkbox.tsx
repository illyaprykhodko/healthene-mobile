// outsource dependencies
import React, { memo, useCallback } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';

// local dependencies
import { useTheme } from 'hooks/useTheme';
import { PressableScale } from './PressableScale';

// Temporary status type until full migration
export type PhaseItemStatus = 'DONE' | 'PENDING' | 'DID_NOT_EAT' | string;

export interface CheckboxProps {
    size?: number;
    value?: boolean;
    editable?: boolean;
    isDayOverview?: boolean;
    status?: PhaseItemStatus;
    style?: StyleProp<ViewStyle>;
    onChange: (next: boolean) => void;
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
}) => {
    const theme = useTheme();
    const handlePress = useCallback(() => {
        if (!editable) { return; }
        onChange(!value);
    }, [editable, onChange, value]);

    const renderGeneralIcon = () => (value
        ? <Icon iconStyle="solid" name="check-square" size={size + 15} color={theme.colors.successAlt} />
        : <Icon name="square" size={size + 15} color={theme.colors.white} />
    );

    const renderDayOverviewIcon = () => {
        switch (status) {
            default:
                return <Icon name="square" size={size + 3} color={theme.colors.white} />;
            case 'DONE':
                return <Icon iconStyle="solid" name="check-square" size={size + 13} color={theme.colors.successAlt} />;
            case 'DID_NOT_EAT':
                return <Icon iconStyle="solid" name="minus-square" size={size + 5} color={theme.colors.darkBlue} />;
        }
    };

    return (
        <PressableScale
            haptic="success"
            onPress={handlePress}
            hitSlop={clickableZone}
            style={StyleSheet.flatten([styles.container, style, {
                paddingVertical: 0.5,
                paddingHorizontal: status === 'DONE' ? 0 : 2.7,
                borderColor: value ? 'transparent' : theme.colors.border,
            }])}
        >
            {isDayOverview ? renderDayOverviewIcon() : renderGeneralIcon()}
        </PressableScale>
    );
};

export const Checkbox = memo(CheckboxComponent);
export default Checkbox;
