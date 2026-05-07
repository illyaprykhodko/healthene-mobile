// outsource dependencies
import {
    type Recorder,
    type CameraRef,
    usePhotoOutput,
    useVideoOutput,
    useCameraDevice,
    Camera as RNCamera,
    type CameraPosition,
    useCameraPermission,
    useMicrophonePermission,
} from 'react-native-vision-camera';
import Toast from 'react-native-toast-message';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';

// local dependencies
import { Attachment } from 'types/messenger.ts';
import { useAppState } from 'hooks/useAppState.ts';
import CameraControls from 'components/Camera/CameraControls.tsx';
import NoCameraPermissions from 'components/Camera/NoCameraPermissions.tsx';
import RecordPreview, { type CapturedMedia } from 'components/RecordPreview.tsx';

interface CameraProps {
    cameraPosition?: CameraPosition;
    captureMode?: 'photo' | 'video';
    onCapture: (item: Attachment) => void;
}

const Camera = ({ cameraPosition = 'back', captureMode = 'photo', onCapture }: CameraProps) => {
    const appState = useAppState();
    const isFocused = useIsFocused();
    const camera = useRef<CameraRef>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [result, setResult] = useState<CapturedMedia | null>(null);
    const [position, setPosition] = useState<CameraPosition>(cameraPosition);
    const recordingStartRef = useRef<number | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const recorderRef = useRef<Recorder | null>(null);
    const toggleCameraPosition = () => {
        setPosition(position === 'front' ? 'back' : 'front');
    };
    const isActive = isFocused && appState === 'active';
    const device = useCameraDevice(position);
    const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } = useMicrophonePermission();
    const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();

    const photoOutput = usePhotoOutput({ qualityPrioritization: 'balanced' });
    const videoOutput = useVideoOutput({ enableAudio: true });

    useEffect(() => {
        const requestPermissions = async () => {
            if (!hasCameraPermission) {
                await requestCameraPermission();
            }
            if (!hasMicPermission) {
                await requestMicPermission();
            }
        };

        (async () => {
            await requestPermissions();
            if (!device) {
                Toast.show({
                    type: 'error',
                    text1: 'Camera not detected',
                    text2: 'Please check if your camera is connected or enabled.',
                });
            }
        })();
    }, [
        device,
        hasMicPermission,
        hasCameraPermission,
        requestMicPermission,
        requestCameraPermission,
    ]);

    useEffect(() => () => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
    }, []);

    if (!hasCameraPermission || !hasMicPermission) {
        return <NoCameraPermissions
            hasMicPermission={hasMicPermission}
            hasCameraPermission={hasCameraPermission}
        />;
    }
    if (result) {
        return <RecordPreview
            file={result}
            recordType="camera"
            onCapture={onCapture}
            onRetake={() => setResult(null)}
        />;
    }

    const takePhoto = async () => {
        if (isRecording) { return; }
        const photo = await photoOutput.capturePhoto({ flashMode: 'off' }, {});
        try {
            const path = await photo.saveToTemporaryFileAsync();
            setResult({ path, type: 'photo' });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Capture failed',
                text2: error instanceof Error ? error.message : 'Failed to capture photo',
            });
        } finally {
            photo.dispose();
        }
    };

    const stopRecordingTimer = () => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        recordingStartRef.current = null;
        setIsRecording(false);
    };

    const startRecording = async () => {
        if (isRecording) { return; }
        try {
            const recorder = await videoOutput.createRecorder({});
            recorderRef.current = recorder;
            recordingStartRef.current = Date.now();
            setRecordingDuration(0);
            setIsRecording(true);

            recordingTimerRef.current = setInterval(() => {
                if (!recordingStartRef.current) { return; }

                const elapsedMs = Date.now() - recordingStartRef.current;
                setRecordingDuration(Math.floor(elapsedMs / 1000));
            }, 500);

            await recorder.startRecording(
                filePath => {
                    const elapsedMs = recordingStartRef.current ? Date.now() - recordingStartRef.current : 0;
                    stopRecordingTimer();
                    recorderRef.current = null;
                    setResult({
                        type: 'video',
                        path: filePath,
                        duration: Math.floor(elapsedMs / 1000),
                    });
                },
                error => {
                    stopRecordingTimer();
                    recorderRef.current = null;
                    Toast.show({
                        type: 'error',
                        text2: error.message,
                        text1: 'Recording failed',
                    });
                },
            );
        } catch (error) {
            stopRecordingTimer();
            recorderRef.current = null;
            Toast.show({
                type: 'error',
                text1: 'Recording failed',
                text2: error instanceof Error ? error.message : 'Failed to start recording',
            });
        }
    };

    const stopRecording = async () => {
        if (!isRecording || !recorderRef.current) { return; }

        await recorderRef.current.stopRecording();
    };

    const toggleRecording = async () => {
        if (isRecording) {
            await stopRecording();
            return;
        }
        await startRecording();
    };

    return <View style={styles.flex}>
        {device && hasCameraPermission && hasMicPermission
            ? <>
                <RNCamera
                    ref={camera}
                    device={device}
                    isActive={isActive}
                    style={StyleSheet.absoluteFill}
                    outputs={[photoOutput, videoOutput]}
                />
                <CameraControls
                    onTakePhoto={takePhoto}
                    captureMode={captureMode}
                    isRecording={isRecording}
                    onToggleRecording={toggleRecording}
                    recordingDuration={recordingDuration}
                    changePosition={toggleCameraPosition}
                />
            </>
            : null
        }
    </View>;
};

export default Camera;

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
});
