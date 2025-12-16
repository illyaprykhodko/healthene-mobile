// outsource dependencies
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { VideoFile, PhotoFile } from 'react-native-vision-camera';
import { Dimensions, Image, Platform, StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { OFFSET } from 'constants/offset.ts';
import { Button } from 'components/Button.tsx';
import LoadingOverlay from 'components/LoadingOverlay.tsx';
import { setAttachment } from 'store/slices/messengerSlice.ts';
import { handleCapture } from 'utils/attachment/mediaCapture.ts';

interface CameraPreviewProps {
    onRetake: () => void;
    file: PhotoFile | VideoFile | null,
}

export const CameraPreview = ({ file, onRetake }: CameraPreviewProps) => {
    const dispatch = useDispatch();
    const isVideo = Boolean(file && 'duration' in file);
    const [preloader, setPreloader] = useState<boolean>(false);

    const onPressSave = async () => {
        if (!file) { return; }
        const attachment = await handleCapture({
            file,
            isVideo,
            setPreloader
        });
        if (attachment) {
            dispatch(setAttachment(attachment));
        }
    };

    return <>
        <LoadingOverlay init={preloader} />
        <View style={styles.container}>
            <Text style={styles.title} textAlign="center" variant="h2">Review your capture</Text>
            <View style={styles.wrapper}>
                <Image source={{ uri: `file://${file?.path}` }} style={styles.media} />
                <View style={styles.actions}>
                    <Button variant="outline" style={styles.flex} title="Retake" onPress={() => onRetake()} />
                    <Button variant="outline" style={styles.flex} title="Ready" onPress={() => onPressSave()} />
                </View>
            </View>
        </View>
    </>;
};

export default CameraPreview;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        marginVertical: OFFSET.VERTICAL,
    },
    wrapper: {
        width: Dimensions.get('window').width * 0.8,
        ...Platform.select({
            ios: { height: Dimensions.get('window').width * 0.8 * (4 / 3) },
            android: { height: Dimensions.get('window').width * 0.8 * (5 / 3) },
        })
    },
    media: {
        width: '100%',
        height: '100%',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        marginVertical: OFFSET.VERTICAL,
        gap: OFFSET.POINT * 4
    },
    flex: {
        flex: 1
    }
});
