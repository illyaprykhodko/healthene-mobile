// outsource dependencies
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';

// configure
const BUTTON_SIZE = 60;
const CAMERA_SWITCH_SIZE = 48;
const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m}:${s.toString().padStart(2, '0')}`;
};

interface AudioControlsProps {
    onPress: () => void;
    isRecording: boolean;
    recordingDuration: number
    onStopRecording: () => void;
    onStartRecording: () => void;
}

const AudioControls = ({ isRecording, onPress, onStopRecording, onStartRecording, recordingDuration }: AudioControlsProps) => {
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
        {controlBtn()}
    </View>;
};

export default AudioControls;

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
