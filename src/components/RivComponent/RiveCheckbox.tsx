// outsource dependencies
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle, View } from 'react-native';
import {
    Alignment,
    Fit,
    RiveView,
    useRiveFile,
    useRiveBoolean,
    useViewModelInstance, useRive, useRiveTrigger,
} from '@rive-app/react-native';

const checkboxRiv = require('../../../assets/riv/checkbox.riv');

const IS_CHECKED = 'isChecked';
const STATE_MACHINE = 'CheckboxStateMachine';

export interface RiveCheckboxProps {
    checked: boolean;
    onCheckedChange: () => void;
    disabled?: boolean;
    size?: number;
    style?: StyleProp<ViewStyle>;
    testID?: string;
}

export const RiveCheckbox: React.FC<RiveCheckboxProps> = memo(({
    checked,
    size = 44,
    onCheckedChange,
    disabled = false,
    style,
    testID,
}) => {
    const { riveFile } = useRiveFile(checkboxRiv);
    const { riveViewRef, setHybridRef } = useRive();
    const [isChecked, setIsChecked] = useState<boolean>(false);
    const { instance: viewModelInstance } = useViewModelInstance(riveFile);
    const { setValue: setRiveChecked } = useRiveBoolean(IS_CHECKED, viewModelInstance);

    return (
        <Pressable
            testID={testID}
            disabled={disabled}
            onPress={() => {
                setIsChecked(prev => {
                    const next = !prev;
                    setRiveChecked(next);
                    return next;
                });
            }}
            style={[{ width: size, height: size }, style]}
        >
            <View style={{ width: '100%', height: '100%' }}>
                {riveFile && viewModelInstance && (
                    <RiveView
                        file={riveFile}
                        fit={Fit.Contain}
                        style={styles.rive}
                        alignment={Alignment.Center}
                        stateMachineName={STATE_MACHINE}
                    />
                )}
            </View>
        </Pressable>
    );
});

const styles = StyleSheet.create({
    rive: {
        width: '100%',
        height: '100%',
    },
});
