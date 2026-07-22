// outsource dependencies
import {
    type Recorder,
    type CameraRef,
    usePhotoOutput,
    useVideoOutput,
    useCameraDevice,
    Camera as RNCamera,
    useCameraPermission,
    type CameraPosition,
    useMicrophonePermission,
    type TargetCameraPosition,
} from 'react-native-vision-camera';
import Toast from 'react-native-toast-message';
import { useIsFocused } from '@react-navigation/native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform, StyleSheet, View } from 'react-native';
import { createThumbnail } from 'react-native-create-thumbnail';
import React, { useEffect, useMemo, useRef, useState } from 'react';

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

const PHOTO_OUTPUT_OPTIONS = { qualityPrioritization: 'balanced' as const };
const VIDEO_OUTPUT_OPTIONS = { enableAudio: true };

// Workaround for react-native-vision-camera 5.0.10: video recordings are written to a file
// whose name ends with the literal `mp4` (no dot). Without a real extension, Android's
// MediaExtractor / ExoPlayer crashes natively when the file is opened.
const ensureMp4Extension = async (path: string): Promise<string> => {
    if (/\.mp4$/i.test(path)) { return path; }
    const renamed = `${path.replace(/mp4$/i, '')}.mp4`;
    try {
        await ReactNativeBlobUtil.fs.mv(path, renamed);
        return renamed;
    } catch {
        return path;
    }
};

// Android: generate a first-frame image for the preview screen because <Video> crashes
// natively on some OEM media stacks (Honor MagicOS, etc.). MediaMetadataRetriever (used by
// react-native-create-thumbnail) is a different code path from ExoPlayer and is reliable here.
// Skipped on iOS — the iOS <Video> preview works fine and doesn't need a thumbnail.
const generateAndroidThumbnail = async (videoPath: string): Promise<string | undefined> => {
    if (Platform.OS !== 'android') { return undefined; }
    try {
        const thumb = await createThumbnail({
            url: `file://${videoPath}`,
            timeStamp: 100,
            format: 'jpeg',
        });
        return thumb.path.replace(/^file:\/\//, '');
    } catch {
        return undefined;
    }
};

const Camera = ({ cameraPosition = 'back', captureMode = 'photo', onCapture }: CameraProps) => {
    const appState = useAppState();
    const isFocused = useIsFocused();
    const camera = useRef<CameraRef>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [result, setResult] = useState<CapturedMedia | null>(null);
    // vision-camera 5.1: useCameraDevice now takes TargetCameraPosition (front/back/external,
    // no 'unspecified'). Coerce the incoming CameraPosition prop to a concrete target, defaulting
    // to the back camera.
    const [position, setPosition] = useState<TargetCameraPosition>(
        cameraPosition === 'front' || cameraPosition === 'external' ? cameraPosition : 'back',
    );
    const recordingStartRef = useRef<number | null>(null);
    const recorderRef = useRef<Recorder | null>(null);
    const permissionsRequestedRef = useRef(false);
    const toggleCameraPosition = () => {
        setPosition(position === 'front' ? 'back' : 'front');
    };
    const isActive = isFocused && appState === 'active';
    const device = useCameraDevice(position);
    const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } = useMicrophonePermission();
    const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();

    const photoOutput = usePhotoOutput(PHOTO_OUTPUT_OPTIONS);
    const videoOutput = useVideoOutput(VIDEO_OUTPUT_OPTIONS);

    // Mount only the output the current capture mode needs. Configuring photo + video
    // simultaneously causes CameraX session churn on Android, and the array identity needs
    // to stay stable so the native session is not re-configured mid-recording.
    const outputs = useMemo(
        () => (captureMode === 'video' ? [videoOutput] : [photoOutput]),
        [captureMode, photoOutput, videoOutput]
    );

    useEffect(() => {
        if (permissionsRequestedRef.current) { return; }
        permissionsRequestedRef.current = true;
        (async () => {
            if (!hasCameraPermission) {
                await requestCameraPermission();
            }
            if (!hasMicPermission) {
                await requestMicPermission();
            }
        })();
    }, []);

    // useCameraDevice() returns undefined on the first render before the camera service
    // resolves, so wait a beat before showing the "no device" toast — otherwise it always
    // fires on mount.
    useEffect(() => {
        if (!hasCameraPermission || !hasMicPermission) { return; }
        if (device) { return; }
        const timer = setTimeout(() => {
            Toast.show({
                type: 'error',
                text1: 'Camera not detected',
                text2: 'Please check if your camera is connected or enabled.',
            });
        }, 800);
        return () => clearTimeout(timer);
    }, [device, hasCameraPermission, hasMicPermission]);

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

    const resetRecordingState = () => {
        recordingStartRef.current = null;
        recorderRef.current = null;
        setIsRecording(false);
    };

    const startRecording = async () => {
        if (isRecording) { return; }
        try {
            const recorder = await videoOutput.createRecorder({});
            recorderRef.current = recorder;
            recordingStartRef.current = Date.now();
            setIsRecording(true);

            await recorder.startRecording(
                async filePath => {
                    const elapsedMs = recordingStartRef.current ? Date.now() - recordingStartRef.current : 0;
                    resetRecordingState();
                    // vision-camera 5.0.10 writes recordings to a file whose name ends in the
                    // literal `mp4` (no dot — bug in HybridVideoOutput.kt's createTempFile suffix).
                    // Rename to a proper `.mp4` so the uploader and any downstream consumer that
                    // dispatches on extension behave correctly.
                    const finalPath = await ensureMp4Extension(filePath);
                    const thumbnailPath = await generateAndroidThumbnail(finalPath);
                    setResult({
                        thumbnailPath,
                        type: 'video',
                        path: finalPath,
                        duration: Math.floor(elapsedMs / 1000),
                    });
                },
                error => {
                    resetRecordingState();
                    Toast.show({
                        type: 'error',
                        text2: error.message,
                        text1: 'Recording failed',
                    });
                },
            );
        } catch (error) {
            resetRecordingState();
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
                    outputs={outputs}
                    isActive={isActive}
                    style={StyleSheet.absoluteFill}
                />
                <CameraControls
                    onTakePhoto={takePhoto}
                    captureMode={captureMode}
                    isRecording={isRecording}
                    onToggleRecording={toggleRecording}
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
