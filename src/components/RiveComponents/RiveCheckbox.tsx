// outsource dependencies
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import {
    RiveView,
    useRive,
    Fit,
    Alignment,
    RiveEventType,
    type RiveFile,
} from '@rive-app/react-native';

export const RIVE_CHECKBOX_VISUAL_SIZE = 40;

export type RiveCheckboxProps = {
    file: RiveFile;
    value: boolean;
    onChange: (next: boolean) => void;
    size?: number;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    booleanInputName?: string;
    stateMachineName?: string;
    artboardName?: string;
};

/**
 * Rive-чекбокс в области size×size (по умолчанию 40×40). Касания обрабатывает Rive.
 * `value` синхронизируется в state machine; при событии из Rive (General) вызывается `onChange`.
 * При необходимости добавьте в .riv Fire Event на клик или оставьте только внешний контроль через `value`.
 */
export function RiveCheckbox({
    file,
    value,
    onChange,
    size = RIVE_CHECKBOX_VISUAL_SIZE,
    disabled = false,
    style,
    booleanInputName = 'Checked',
    stateMachineName,
    artboardName,
}: RiveCheckboxProps) {
    const { setHybridRef, riveViewRef } = useRive();
    const valueRef = useRef(value);
    const disabledRef = useRef(disabled);
    const onChangeRef = useRef(onChange);
    valueRef.current = value;
    disabledRef.current = disabled;
    onChangeRef.current = onChange;

    useEffect(() => {
        let cancelled = false;
        const sync = async () => {
            const ref = riveViewRef;
            if (!ref) {
                return;
            }
            try {
                await ref.awaitViewReady();
            } catch {
                return;
            }
            if (cancelled) {
                return;
            }
            try {
                ref.setBooleanInputValue(booleanInputName, value);
            } catch {
                /* имя input может отличаться */
            }
        };
        sync();
        return () => {
            cancelled = true;
        };
    }, [booleanInputName, riveViewRef, value]);

    useEffect(() => {
        const ref = riveViewRef;
        if (!ref) {
            return undefined;
        }
        let cancelled = false;
        const run = async () => {
            try {
                await ref.awaitViewReady();
            } catch {
                return;
            }
            if (cancelled) {
                return;
            }
            ref.onEventListener((event) => {
                if (event.type !== RiveEventType.General) {
                    return;
                }
                if (disabledRef.current) {
                    return;
                }
                onChangeRef.current(!valueRef.current);
            });
        };
        run();
        return () => {
            cancelled = true;
            try {
                ref.removeEventListeners();
            } catch {
                /* noop */
            }
        };
    }, [riveViewRef]);

    return (
       
            <View style={styles.inner} collapsable={false}>
                <RiveView
                    
                    file={file}
                    artboardName={artboardName}
                    stateMachineName={stateMachineName}
                    style={styles.rive}
                />
            </View>
        
    );
}

const styles = StyleSheet.create({
    wrap: {},
    inner: {
        flex: 1,
        width: 40,
        height: 40,
    },
    rive: {
        width: '100%',
        height: '100%',
    },
});
