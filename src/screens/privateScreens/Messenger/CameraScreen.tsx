// outsource dependencies
import React from 'react';
import { StyleSheet } from 'react-native';

// local dependencies
import Camera from 'components/Camera';

interface CameraScreenProps {
  // props here
}

const CameraScreen = (props: CameraScreenProps) => {
    return <Camera />;
};

export default CameraScreen;

const styles = StyleSheet.create({
    container: {
    // style here
    },
});
