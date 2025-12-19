// outsource dependencies
import Video from 'react-native-video';
import React, { useState } from 'react';
import { ReactNativeBlobUtilStat } from 'react-native-blob-util';
import { VideoFile, PhotoFile } from 'react-native-vision-camera';
import { Dimensions, Image, Platform, StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { OFFSET } from 'constants/offset.ts';
import { Attachment } from 'types/messenger.ts';
import { Button } from 'components/Button.tsx';
import LoadingOverlay from 'components/LoadingOverlay.tsx';
import { handleCapture } from 'utils/attachment/mediaCapture.ts';

interface RecordPreviewProps {
    onRetake: () => void;
    recordType: 'camera' | 'audio'
    onCapture: (item: Attachment) => void;
    file: PhotoFile | VideoFile | ReactNativeBlobUtilStat | null,
}

export const RecordPreview = ({ file, onRetake, onCapture, recordType }: RecordPreviewProps) => {
    const isVideo = Boolean(file && 'duration' in file);
    const [preloader, setPreloader] = useState<boolean>(false);
    console.log('recordType', recordType);
    const onPressSave = async () => {
        if (!file) { return; }
        const attachment = await handleCapture({
            file,
            isVideo,
            setPreloader
        });
        if (attachment) {
            onCapture(attachment);
        }
        onRetake();
    };

    return <>
        <LoadingOverlay init={preloader} />
        <View style={styles.container}>
            <Text style={styles.title} textAlign="center" variant="h2">Review your capture</Text>
            <View style={styles.wrapper}>
                {recordType === 'camera'
                    ? isVideo
                        ? <Video controls source={{ uri: `file://${file?.path}` }} style={styles.media}/>
                        : <Image source={{ uri: `file://${file?.path}` }} style={styles.media}/>
                    : <View style={styles.media}>

                    </View>
                }
                <View style={styles.actions}>
                    <Button variant="outline" style={styles.flex} title="Retake" onPress={() => onRetake()} />
                    <Button variant="outline" style={styles.flex} title="Ready" onPress={() => onPressSave()} />
                </View>
            </View>
        </View>
    </>;
};

export default RecordPreview;

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
