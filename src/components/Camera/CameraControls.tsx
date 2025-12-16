// outsource dependencies
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// local dependencies
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';

// configure
const BUTTON_SIZE = 60;
const CAMERA_SWITCH_SIZE = 48;

interface CameraControlsProps {
    onPress: () => void;
    isRecording: boolean;
    changePosition: () => void;
}

const CameraControls = ({ isRecording, onPress, changePosition }: CameraControlsProps) => {
    const theme = useTheme();
    const recordingBtn = () => <Pressable style={[styles.buttonContainer, { backgroundColor: theme.colors.lighterGrey }]}>
        <View style={[styles.stopBtn, { backgroundColor: theme.colors.darkGrey }]} />
    </Pressable>;

    const waitingBtn = () => <Pressable onPress={onPress} style={[styles.buttonContainer, { backgroundColor: theme.colors.lighterGrey }]}>
        <View style={[styles.waitBtn, { backgroundColor: theme.colors.red }]} />
    </Pressable>;
    return <View style={styles.container}>
        <Pressable onPress={changePosition} style={styles.cameraSwitch}>
            <Icon name="cameraswitch" size={CAMERA_SWITCH_SIZE} color={theme.colors.grey} />
        </Pressable>
        {isRecording ? recordingBtn() : waitingBtn()}
    </View>;
};

export default CameraControls;

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        bottom: OFFSET.VERTICAL,
    },
    buttonContainer: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stopBtn: {
        width: BUTTON_SIZE * 0.35,
        height: BUTTON_SIZE * 0.35,
    },
    waitBtn: {
        width: BUTTON_SIZE - (BUTTON_SIZE * 0.15) * 2,
        height: BUTTON_SIZE - (BUTTON_SIZE * 0.15) * 2,
        borderRadius: (BUTTON_SIZE - (BUTTON_SIZE * 0.15) * 2) / 2,
    },
    cameraSwitch: {
        position: 'absolute',
        bottom: OFFSET.VERTICAL - ((BUTTON_SIZE - CAMERA_SWITCH_SIZE)),
        left: OFFSET.HORIZONTAL * 2
    }
});
