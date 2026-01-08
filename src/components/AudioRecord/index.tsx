// outsource dependencies
import Icon from '@react-native-vector-icons/material-icons';
import Sound, { RecordBackType } from 'react-native-nitro-sound';
import React, { memo, useCallback, useEffect, useState } from 'react';
import RNBlobUtil, { ReactNativeBlobUtilStat } from 'react-native-blob-util';
import { PermissionsAndroid, Platform, Pressable, StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { Attachment } from 'types/messenger.ts';
import { formatDuration } from 'utils/general.ts';
import RecordPreview from 'components/RecordPreview.tsx';
import NoMicPermission from 'components/AudioRecord/NoMicPermission.tsx';

// configure
const BUTTON_SIZE = 60;

interface AudioRecordProps {
    onCapture: (item: Attachment) => void
}

const AudioRecord = ({ onCapture }: AudioRecordProps) => {
    const theme = useTheme();
    const [permissionHasDenied, setPermissionHasDenied] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordTime, setRecordTime] = useState('0:00');
    const [result, setResult] = useState<ReactNativeBlobUtilStat | null>(null);

    // Helper to check microphone permission
    const checkMicrophonePermission = useCallback(async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
            if (granted) { return true; }
            const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
            return result === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    }, []);


    const startAudioRecording = useCallback(async () => {
        const hasPermission = await checkMicrophonePermission();
        setPermissionHasDenied(hasPermission);
        setRecordTime('00:00');

        Sound.addRecordBackListener((e: RecordBackType) => {
            const seconds = Math.floor(e.currentPosition / 1000);
            setRecordTime(formatDuration(seconds));
        });

        await Sound.startRecorder();
        setIsRecording(true);
    }, []);


    const stopAudioRecording = useCallback(async () => {
        const filePath = await Sound.stopRecorder();
        Sound.removeRecordBackListener();

        const path = filePath.replace('file://', '');

        const result = await RNBlobUtil.fs.stat(path);
        setResult(result);

        setIsRecording(false);
    }, [onCapture]);

    useEffect(() => {
        return () => {
            Sound.removeRecordBackListener();
        };
    }, []);

    if (result) {
        return <RecordPreview
            file={result}
            recordType="audio"
            onCapture={onCapture}
            onRetake={() => setResult(null)}
        />;
    }

    if (permissionHasDenied) {
        return <NoMicPermission />;
    }
    return <View style={styles.container}>
        <View style={styles.wrapper}>
            <Icon
                size={148}
                style={styles.icon}
                name="multitrack-audio"
                color={theme.colors.darkGrey}
            />
        </View>
        <View style={[styles.controlContainer, { backgroundColor: theme.colors.grey }]}>
            <View style={[styles.duration, { opacity: isRecording ? 1 : 0 }]}>
                <Text style={styles.recordDot} color={theme.colors.red}>●</Text>
                <Text variant="h3">{recordTime}</Text>
            </View>
            {isRecording
                ? <Pressable
                    onPress={stopAudioRecording}
                    style={[styles.buttonContainer, { backgroundColor: theme.colors.lighterGrey }]}
                >
                    <View style={[styles.stopBtn, { backgroundColor: theme.colors.darkGrey }]}/>
                </Pressable>
                : <Pressable
                    onPress={startAudioRecording}
                    style={[styles.buttonContainer, { backgroundColor: theme.colors.lighterGrey }]}
                >
                    <View style={[styles.waitBtn, { backgroundColor: theme.colors.red }]}/>
                </Pressable>}
        </View>
    </View>;
};

export default memo(AudioRecord);
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    controlContainer: {
        height: 170,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    wrapper: {
        flex: 1,
        justifyContent: 'center',
        marginVertical: OFFSET.VERTICAL,
    },
    icon: {
        alignSelf: 'center',
    },
    buttonContainer: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: OFFSET.VERTICAL,
    },
    waitBtn: {
        width: BUTTON_SIZE - (BUTTON_SIZE * 0.15) * 2,
        height: BUTTON_SIZE - (BUTTON_SIZE * 0.15) * 2,
        borderRadius: (BUTTON_SIZE - (BUTTON_SIZE * 0.15) * 2) / 2,
    },
    stopBtn: {
        width: BUTTON_SIZE * 0.35,
        height: BUTTON_SIZE * 0.35,
    },
    duration: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: - OFFSET.POINT * 2
    },
    recordDot: {
        marginRight: OFFSET.POINT * 2
    }
});
