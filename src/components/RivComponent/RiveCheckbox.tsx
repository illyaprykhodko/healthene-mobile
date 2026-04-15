// outsource dependencies
import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle, View } from 'react-native';
import Rive, { Alignment, Fit, RiveRef } from 'rive-react-native';
import { RiveGeneralEvent, RiveOpenUrlEvent } from 'rive-react-native/lib/typescript/types';
import log from 'eslint-plugin-react/lib/util/log';

const checkboxRiv = require('../../../assets/riv/checkbox.riv');

const STATE_MACHINE = 'State Machine 1';
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
    const isRiveReady = useRef(false);

    useEffect(() => {
        if (!isRiveReady.current) { return; }
        riveRef.current?.setInputState(STATE_MACHINE, INPUT_IS_CHECKED, checked);
    }, [checked]);

    return (
        <Pressable
            testID={testID}
            disabled={disabled}
            onPress={onCheckedChange}
            style={{ width: size, height: size }}
        >
            <View pointerEvents="none" style={{ width: '100%', height: '100%' }}>
                <Rive
                    autoplay
                    ref={riveRef}
                    fit={Fit.Contain}
                    style={styles.rive}
                    source={checkboxRiv}
                    alignment={Alignment.Center}
                    stateMachineName={STATE_MACHINE}
                    onPlay={() => {
                        isRiveReady.current = true;
                        // Устанавливаем начальное состояние
                        riveRef.current?.setInputState(STATE_MACHINE, INPUT_IS_CHECKED, checked);
                    }}
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
