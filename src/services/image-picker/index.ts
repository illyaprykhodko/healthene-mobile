// outsource dependencies
import Toast from 'react-native-toast-message';
import { Linking, Platform } from 'react-native';
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import ImagePicker, { Image as PickerImage } from 'react-native-image-crop-picker';

// local dependencies
import { store } from 'store';
import { uploadImageInitiate, DIR } from 'store/api/s3ServiceApi.ts';

const openSettings = () => {
    Linking.openSettings();
};

const checkPermission = async () => {
    if (Platform.OS === 'ios') {
        const result = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);
        switch (result) {
            default: return true;
            case RESULTS.DENIED: return true;
            case RESULTS.BLOCKED:
                Toast.show({
                    type: 'info',
                    text1: 'Permission denied',
                    text2: 'Tap to open Settings',
                    onPress: () => openSettings()
                });
                break;
        }
    }
    // Android
    return false;
};

export const getPicture = async () => {
    await checkPermission();
    return ImagePicker.openPicker({
        cropping: true,
        multiple: false,
        includeBase64: true
    })
        .then(image => uploadPicture(image))
        .catch(() => {
            // updatePreloader();
        })
        .finally(() => {
            // store.dispatch({ type: appUpdateData.type, payload: { isProcess: false, l } });
        });


};


const uploadPicture = async (file: PickerImage) => {
    const body = new FormData();
    const blobData = `data:image/jpeg;base64,${file.data}`;
    const uri = Platform.OS === 'android' ? file.path : blobData;
    const fileName = (file.filename || '').replace(/[^\d|A-Z|a-z]/g, '_').replace(/_+/g, '_') || 'image';
    const fileNameWithExt = `${fileName}.jpg`;
    body.append('dir', DIR.USER);
    body.append('file', {
        uri,
        type: file.mime,
        name: fileNameWithExt,
    });

    if (file.cropRect?.width && file.cropRect?.height) {
        const imageUrl = await store.dispatch(
            uploadImageInitiate({
                body,
                params: {
                    x: 1,
                    y: 1,
                    width: file.cropRect?.width,
                    height: file.cropRect?.height,
                }
            })
        );
        console.log('imageUrl', imageUrl.data?.url);
    }
};
