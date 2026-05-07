// outsource dependencies
import Video from 'react-native-video';
import React, { useState } from 'react';
import Icon from '@react-native-vector-icons/material-icons';
import { ReactNativeBlobUtilStat } from 'react-native-blob-util';
import { Dimensions, Image, Platform, StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { Button } from 'components/Button.tsx';
import { Attachment } from 'types/messenger.ts';
import AudioPlayer from 'components/AudioPlayer.tsx';
import LoadingOverlay from 'components/LoadingOverlay.tsx';
import { handleCapture } from 'utils/attachment/mediaCapture.ts';

export interface CapturedMedia {
    path: string;
    duration?: number;
    type: 'photo' | 'video';
}

interface RecordPreviewProps {
    onRetake: () => void;
    recordType: 'camera' | 'audio'
    onCapture: (item: Attachment) => void;
    file: CapturedMedia | ReactNativeBlobUtilStat | null,
}

export const RecordPreview = ({ file, onRetake, onCapture, recordType }: RecordPreviewProps) => {
    const theme = useTheme();
    const isVideo = Boolean(file && 'type' in file && file.type === 'video');
    const [preloader, setPreloader] = useState<boolean>(false);

    const getCaptureType = () => {
        if (isVideo) { return 'video'; }
        if (recordType === 'audio') { return 'audio'; }
        return 'image';
    };

    const onPressSave = async () => {
        if (!file) { return; }
        const captureType = getCaptureType();
        const attachment = await handleCapture({
            file,
            captureType,
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
            {recordType === 'camera' && file?.path
                ? <View style={[styles.wrapper, styles.height]}>
                    {isVideo
                        ? <Video paused controls source={{ uri: `file://${file?.path}` }} style={styles.media}/>
                        : <Image source={{ uri: `file://${file?.path}` }} style={styles.media}/>
                    }
                </View>
                : <View style={[styles.audioWrapper, styles.height]}>
                    <Icon
                        size={168}
                        style={styles.icon}
                        name="multitrack-audio"
                        color={theme.colors.darkGrey}
                    />
                    <View style={styles.marginAuto}>
                        <AudioPlayer file={file?.path} />
                    </View>
                </View>
            }
            <View style={[styles.actions, styles.wrapper]}>
                <Button variant="outline" style={styles.flex} title="Retake" onPress={() => onRetake()} />
                <Button variant="outline" style={styles.flex} title="Ready" onPress={() => onPressSave()} />
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
    },
    height: {
        ...Platform.select({
            ios: { height: Dimensions.get('window').width * 0.8 * (4 / 3) },
            android: { height: Dimensions.get('window').width * 0.8 * (5 / 3) },
        })
    },
    audioWrapper: {
        width: '100%',
        paddingHorizontal: OFFSET.HORIZONTAL,
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
    icon: {
        alignSelf: 'center',
    },
    marginAuto: {
        marginTop: 'auto'
    },
    flex: {
        flex: 1
    }
});
