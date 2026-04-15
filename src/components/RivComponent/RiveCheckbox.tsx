// outsource dependencies
import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Rive, { Alignment, Fit, RiveRef } from 'rive-react-native';

const checkboxRiv = require('../../../assets/riv/checkbox.riv');

const STATE_MACHINE = 'State Machine 1';
const INPUT_IS_CHECKED = 'isChecked';

export interface RiveCheckboxProps {
    checked: boolean;
    onCheckedChange: (next: boolean) => void;
    disabled?: boolean;
    /** Outer hit target and Rive bounds; default 32. */
    size?: number;
    style?: StyleProp<ViewStyle>;
    testID?: string;
}

export const RiveCheckbox: React.FC<RiveCheckboxProps> = ({
    checked,
    onCheckedChange,
    disabled = false,
    size = 32,
    style,
    testID,
}) => {
    const riveRef = useRef<RiveRef>(null);

    const syncRive = useCallback(() => {
        riveRef.current?.setInputState(STATE_MACHINE, INPUT_IS_CHECKED, checked);
    }, [checked]);

    useEffect(() => {
        syncRive();
    }, [syncRive]);

    const handlePlay = useCallback(() => {
        syncRive();
    }, [syncRive]);

    return (
        <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked, disabled }}
            disabled={disabled}
            hitSlop={8}
            onPress={() => onCheckedChange(!checked)}
            style={[styles.hit, { width: size, height: size }, style]}
            testID={testID}
        >
            <Rive
                ref={riveRef}
                source={checkboxRiv}
                stateMachineName={STATE_MACHINE}
                style={styles.rive}
                autoplay
                fit={Fit.Contain}
                alignment={Alignment.Center}
                onPlay={handlePlay}
            />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    hit: {
        overflow: 'hidden',
    },
    rive: {
        width: '100%',
        height: '100%',
    },
});
