// outsource dependencies
import React, { memo, useCallback } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
// local dependencies
import { COLORS } from '../constants/colors';

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
    value = false,
    size = 22,
    status = 'PENDING',
    editable = true,
    isDayOverview = false,
    onChange,
    style,
}) => {
    const handlePress = useCallback(() => {
        if (!editable) { return; }
        onChange(!value);
    }, [editable, onChange, value]);

    const renderGeneralIcon = () => (value
        ? <Icon solid name="check-square" size={size + 15} color="#87CA67" />
        : <Icon name="square" size={size + 15} color={COLORS.WHITE} />
    );

    const renderDayOverviewIcon = () => {
        switch (status) {
            default:
                return <Icon name="square" size={size + 3} color={COLORS.WHITE} />;
            case 'DONE':
                return <Icon solid name="check-square" size={size + 13} color="#87CA67" />;
            case 'DID_NOT_EAT':
                return <Icon solid name="minus-square" size={size + 5} color={COLORS.DARK_BLUE} />;
        }
    };

    return (
        <TouchableOpacity
            hitSlop={clickableZone}
            onPress={handlePress}
            style={StyleSheet.flatten([styles.container, style, {
                paddingVertical: 0.5,
                borderColor: value ? 'transparent' : '#8A95A3',
                paddingHorizontal: status === 'DONE' ? 0 : 2.7,
            }])}
        >
            {isDayOverview ? renderDayOverviewIcon() : renderGeneralIcon()}
        </TouchableOpacity>
    );
};

export const Checkbox = memo(CheckboxComponent);
export default Checkbox;

