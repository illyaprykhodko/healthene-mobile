// outsource dependencies
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { formatDuration } from 'utils/general.ts';

// configure
const BUTTON_SIZE = 60;
const CAMERA_SWITCH_SIZE = 48;

interface CameraControlsProps {
    onPress: () => void;
    isRecording: boolean;
    recordingDuration: number
    changePosition: () => void;
    onStopRecording: () => void;
    onStartRecording: () => void;
}

const CameraControls = ({ isRecording, onPress, changePosition, onStopRecording, onStartRecording, recordingDuration }: CameraControlsProps) => {
    const theme = useTheme();

    const controlBtn = () => <Pressable
        onPress={onPress}
        onTouchEnd={onStopRecording}
        onLongPress={onStartRecording}
        style={[styles.buttonContainer, { backgroundColor: theme.colors.lighterGrey }]}
    >
        <View style={[styles.waitBtn, { backgroundColor: theme.colors.red }]} />
    </Pressable>;
    return <View style={styles.container}>
        {isRecording && <Text style={styles.timer} color={theme.colors.white}>{formatDuration(recordingDuration)}</Text>}
        <Pressable onPress={changePosition} style={styles.cameraSwitch}>
            <Icon name="cameraswitch" size={CAMERA_SWITCH_SIZE} color={theme.colors.grey} />
        </Pressable>
        {controlBtn()}
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
    timer: {
        marginVertical: OFFSET.VERTICAL,
    },
    buttonContainer: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
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
