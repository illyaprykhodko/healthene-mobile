// outsource dependencies
import {
    PhotoFile,
    VideoFile,
    useCameraDevice,
    Camera as RNCamera,
    useCameraPermission,
    useMicrophonePermission
} from 'react-native-vision-camera';
import Toast from 'react-native-toast-message';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { CameraPosition } from 'react-native-vision-camera/src/types/CameraDevice.ts';

// local dependencies
import { useTheme } from 'hooks/useTheme.ts';
import { Attachment } from 'types/messenger.ts';
import { useAppState } from 'hooks/useAppState.ts';
import CameraPreview from 'components/Camera/CameraPreview.tsx';
import CameraControls from 'components/Camera/CameraControls.tsx';
import NoCameraPermissions from 'components/Camera/NoCameraPermissions.tsx';

interface CameraProps {
    cameraPosition?: CameraPosition
    onCapture: (item: Attachment) => void
}

const Camera = ({ cameraPosition = 'back', onCapture }: CameraProps) => {
    const appState = useAppState();
    const isFocused = useIsFocused();
    const camera = useRef<RNCamera>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [result, setResult] = useState<PhotoFile | VideoFile | null>(null);
    const [position, setPosition] = useState<CameraPosition>(cameraPosition);
    const recordingStartRef = useRef<number | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const toggleCameraPosition = () => {
        setPosition(position === 'front' ? 'back' : 'front');
    };
    const isActive = isFocused && appState === 'active';
    const device = useCameraDevice(position);
    const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } = useMicrophonePermission();
    const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();

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
    }, [device, hasCameraPermission, hasMicPermission, requestCameraPermission, requestMicPermission]);

    if (!hasCameraPermission || !hasMicPermission) {
        return <NoCameraPermissions
            hasMicPermission={hasMicPermission}
            hasCameraPermission={hasCameraPermission}
        />;
    }
    if (result) {
        return <CameraPreview
            file={result}
            onCapture={onCapture}
            onRetake={() => setResult(null)}
        />;
    }

    const takePhoto = async () => {
        if (isRecording) { return; }
        const photo = await camera.current?.takePhoto({
            enableShutterSound: true
        });
        if (!photo) { return; }
        setResult(photo);
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
        if (isRecording || !camera.current) { return; }
        recordingStartRef.current = Date.now();
        setRecordingDuration(0);
        setIsRecording(true);

        recordingTimerRef.current = setInterval(() => {
            if (!recordingStartRef.current) { return; }

            const elapsedMs = Date.now() - recordingStartRef.current;
            setRecordingDuration(Math.floor(elapsedMs / 1000));
        }, 500);

        setIsRecording(true);

        camera.current.startRecording({
            onRecordingFinished: (video: VideoFile) => {
                setIsRecording(false);
                stopRecordingTimer();
                setResult(video);
            },
            onRecordingError: error => {
                setIsRecording(false);
                Toast.show({
                    type: 'error',
                    text1: 'Recording failed',
                    text2: error.message,
                });
            },
        });
    };

    const stopRecording = async () => {
        if (!isRecording || !camera.current) { return; }

        await camera.current.stopRecording();
    };

    return <View style={styles.flex}>
        {device && hasCameraPermission && hasMicPermission
            ? <>
                <RNCamera
                    video
                    audio
                    photo
                    ref={camera}
                    device={device}
                    isActive={isActive}
                    style={StyleSheet.absoluteFill}
                />
                <CameraControls
                    onPress={takePhoto}
                    isRecording={isRecording}
                    onStopRecording={stopRecording}
                    onStartRecording={startRecording}
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
