// outsource dependencies
import React, { useEffect, useState } from 'react';
import {
    Pressable, StyleSheet, View
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { formatDuration } from 'utils/general.ts';

// configure
const BUTTON_SIZE = 60;
const CAMERA_SWITCH_SIZE = 48;
const WAIT_BUTTON_SIZE = BUTTON_SIZE - (BUTTON_SIZE * 0.15) * 2;
const STOP_BUTTON_SIZE = BUTTON_SIZE - (BUTTON_SIZE * 0.35) * 2;

interface CameraControlsProps {
    isRecording: boolean;
    onTakePhoto: () => void;
    changePosition: () => void;
    onToggleRecording: () => void;
    captureMode: 'photo' | 'video';
}

const CameraControls = ({
    captureMode,
    isRecording,
    onTakePhoto,
    changePosition,
    onToggleRecording,
}: CameraControlsProps) => {
    const theme = useTheme();
    // Timer lives here so per-second ticks do not re-render the parent <Camera>,
    // which would pass a fresh `outputs` reference to <RNCamera> and reconfigure the
    // native session mid-recording on Android.
    const [recordingDuration, setRecordingDuration] = useState(0);

    useEffect(() => {
        if (!isRecording) {
            setRecordingDuration(0);
            return;
        }
        const startedAt = Date.now();
        setRecordingDuration(0);
        const interval = setInterval(() => {
            setRecordingDuration(Math.floor((Date.now() - startedAt) / 1000));
        }, 500);
        return () => clearInterval(interval);
    }, [isRecording]);

    const controlBtn = () => {
        const isVideo = captureMode === 'video';
        const onPress = isVideo ? onToggleRecording : onTakePhoto;
        const innerStyle = isVideo && isRecording
            ? styles.stopBtn
            : styles.waitBtn;

        return (
            <Pressable
                onPress={onPress}
                style={[styles.buttonContainer, { backgroundColor: theme.colors.lighterGrey }]}
            >
                <View style={[
                    innerStyle,
                    {
                        backgroundColor: theme.colors.red,
                        borderRadius: isVideo && isRecording ? 8 : WAIT_BUTTON_SIZE / 2,
                    },
                ]}
                />
            </Pressable>
        );
    };

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
        width: WAIT_BUTTON_SIZE,
        height: WAIT_BUTTON_SIZE,
        borderRadius: WAIT_BUTTON_SIZE / 2,
    },
    stopBtn: {
        width: STOP_BUTTON_SIZE,
        height: STOP_BUTTON_SIZE,
    },
    cameraSwitch: {
        position: 'absolute',
        bottom: OFFSET.VERTICAL - ((BUTTON_SIZE - CAMERA_SWITCH_SIZE)),
        left: OFFSET.HORIZONTAL * 2
    }
});
