// outsource dependencies
import React from 'react';
import moment from 'moment/moment';
import * as Sentry from '@sentry/react-native';
import Toast from 'react-native-toast-message';
import { ReactNativeBlobUtilStat } from 'react-native-blob-util';

// local dependencies
import { store } from 'store';
import { CapturedMedia } from 'components/RecordPreview.tsx';
import { uploadAttachmentInitiate } from 'store/api/s3ServiceApi.ts';
import { Platform } from 'react-native';

type captureType = 'video' | 'image' | 'audio'
interface CaptureProps {
    captureType: captureType,
    file: CapturedMedia | ReactNativeBlobUtilStat,
    setPreloader: React.Dispatch<React.SetStateAction<boolean>>
}
export const handleCapture = async ({
    file,
    captureType,
    setPreloader
}: CaptureProps) => {
    if (!file) { return; }
    setPreloader(true);

    const prepareFile = (type: captureType) => {
        const date = moment().format('YYYY-MM-DD_HH-mm-ss');
        switch (type) {
            default:
                return {
                    mimeType: 'video/mp4',
                    fileTitle: `Video ${date}`,
                    fileName: `video_${date}.mp4`,
                    fileDescription: 'Video captured from camera'
                };
            case 'image':
                return {
                    mimeType: 'image/jpeg',
                    fileTitle: `Photo ${date}`,
                    fileName: `photo_${date}.jpg`,
                    fileDescription: 'Photo captured from camera'
                };
            case 'audio':
                return {
                    mimeType: 'audio/m4a',
                    fileTitle: `Audio ${date}`,
                    fileName: `audio_${date}.m4a`,
                    fileDescription: 'Audio recorded by user'
                };
        }

    };

    const { mimeType, fileTitle, fileName, fileDescription } = prepareFile(captureType);
    try {
        const formData = new FormData();
        const fileUri = normalizeUri(file?.path);
        formData.append('file', {
            name: fileName,
            type: mimeType,
            uri: fileUri,
        } as any);
        formData.append('title', fileTitle);
        formData.append('description', fileDescription);
        return await store.dispatch(uploadAttachmentInitiate({
            body: formData
        })).unwrap();
    } catch (error) {
        Sentry.captureException(error);
        Toast.show({
            type: 'error',
            text1: 'Upload failed',
            text2: 'File selection cancelled or failed',
        });
    } finally {
        setPreloader(false);
    }
};

const normalizeUri = (path?: string) => {
    if (!path) { return ''; }

    // content:// => Android SAF
    if (path.startsWith('content://')) { return path; }

    // file://
    if (path.startsWith('file://')) { return path; }

    // Only android
    if (Platform.OS === 'android') {
        return `file://${path}`;
    }

    return path;
};
