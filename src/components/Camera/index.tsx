// outsource dependencies
import {
    useCameraDevice,
    Camera as RNCamera,
    useCameraPermission,
    useMicrophonePermission
} from 'react-native-vision-camera';
import React, { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { StyleSheet, View } from 'react-native';

// local dependencies
import { Button } from 'components/Button.tsx';
import NoCameraPermissions from 'components/Camera/NoCameraPermissions.tsx';

interface CameraProps {
    cameraPosition?: 'back' | 'front'
}

const Camera = ({ cameraPosition = 'back' }: CameraProps) => {
    const device = useCameraDevice(cameraPosition);
    const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } = useMicrophonePermission();
    const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();


    // console.log('hasMicPermission', hasMicPermission);
    // console.log('hasCameraPermission', hasCameraPermission);

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

    if (!hasCameraPermission || !hasMicPermission) { return <NoCameraPermissions hasCameraPermission={hasCameraPermission} hasMicPermission={hasMicPermission} />; }

    return <View style={styles.flex}>
        {device && hasCameraPermission && hasMicPermission
            ? <RNCamera
                video
                audio
                isActive
                device={device}
                style={StyleSheet.absoluteFill}
            />
            : null
        }
        <Button title="Start Recording" />
    </View>;
};

export default Camera;

const styles = StyleSheet.create({
    flex: {
        flex: 1
    },
});
