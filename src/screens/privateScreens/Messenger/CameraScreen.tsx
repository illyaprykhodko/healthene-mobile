// outsource dependencies
import React from 'react';
import { StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { PhotoFile, VideoFile } from 'react-native-vision-camera';

// local dependencies
import Camera from 'components/Camera';
import { setAttachment } from 'store/slices/messengerSlice.ts';

interface CameraScreenProps {
  // props here
}

const CameraScreen = (props: CameraScreenProps) => {
    const dispatch = useDispatch();
    const handleCapture = (item: PhotoFile | VideoFile) => {
        // dispatch(setAttachment())
    };

    return <Camera cameraPosition="front" onCapture={handleCapture} />;
};

export default CameraScreen;

const styles = StyleSheet.create({
    container: {
    // style here
    },
});
