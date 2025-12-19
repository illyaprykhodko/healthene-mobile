// outsource dependencies
import React from 'react';
import moment from 'moment/moment';
import Toast from 'react-native-toast-message';
import { ReactNativeBlobUtilStat } from 'react-native-blob-util';
import { VideoFile, PhotoFile } from 'react-native-vision-camera';

// local dependencies
import { store } from 'store';
import { uploadAttachmentInitiate } from 'store/api/s3ServiceApi.ts';

interface CaptureProps {
    isVideo: boolean,
    file: PhotoFile | VideoFile | ReactNativeBlobUtilStat,
    setPreloader: React.Dispatch<React.SetStateAction<boolean>>
}
export const handleCapture = async ({
    file,
    isVideo,
    setPreloader
}: CaptureProps) => {
    if (!file) { return; }
    setPreloader(true);

    const mimeType = isVideo
        ? 'video/mp4'
        : 'image/jpeg';
    const date = moment().format('YYYY-MM-DD_HH-mm-ss');
    const fileTitle = isVideo ? `Video ${date}` : `Photo ${date}`;
    const fileName = isVideo ? `video_${date}.mp4` : `photo_${date}.jpg`;
    const fileDescription = isVideo ? 'Video captured from camera' : 'Photo captured from camera';
    try {
        const formData = new FormData();
        formData.append('file', {
            name: fileName,
            type: mimeType,
            uri: file?.path,
        });
        formData.append('title', fileTitle);
        formData.append('description', fileDescription);
        return await store.dispatch(uploadAttachmentInitiate({
            body: formData
        })).unwrap();
    } catch (error) {
        Toast.show({
            type: 'error',
            text1: 'Upload failed',
            text2: 'File selection cancelled or failed',
        });
    } finally {
        setPreloader(false);
    }
};
