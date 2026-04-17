// outsource dependencies
import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle, View } from 'react-native';
import Rive, { Alignment, Fit, RiveRef } from 'rive-react-native';

const checkboxRiv = require('../../../assets/riv/checkbox.riv');

const STATE_MACHINE = 'CheckboxStateMachine';
const INPUT_IS_CHECKED = 'isChecked';

export interface RiveCheckboxProps {
    checked: boolean;
    onCheckedChange: () => void;
    disabled?: boolean;
    /** Outer hit target and Rive bounds; default 32. */
    size?: number;
    style?: StyleProp<ViewStyle>;
    testID?: string;
}

export const RiveCheckbox: React.FC<RiveCheckboxProps> = ({
    checked,
    size = 44,
    onCheckedChange,
    disabled = false,
    style,
    testID,
}) => {
    const riveRef = useRef<RiveRef>(null);

    // useEffect(() => {
    //     const rive = riveRef.current;
    //     if (!rive) { return; }
    //     console.log('STATE_MACHINE ', STATE_MACHINE);
    //     console.log('INPUT_IS_CHECKED ', INPUT_IS_CHECKED);
    //     console.log('checked: ', checked);
    //     rive.setInputState(STATE_MACHINE, INPUT_IS_CHECKED, checked);
    //     console.log('rive', rive);
    // }, [checked]);


    return (
        <Pressable
            testID={testID}
            disabled={disabled}
            onPress={onCheckedChange}
            style={{ width: size, height: size }}
        >
            <View pointerEvents="none" style={{ width: '100%', height: '100%' }}>
                <Rive
                    ref={riveRef}
                    fit={Fit.Contain}
                    style={styles.rive}
                    source={checkboxRiv}
                    alignment={Alignment.Center}
                    stateMachineName={STATE_MACHINE}
                    dataBinding={{ type: 'autobind', value: !checked }}
                />
            </View>
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
