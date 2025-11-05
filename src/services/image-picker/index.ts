// outsource dependencies
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import ImagePicker, { Image as PickerImage } from 'react-native-image-crop-picker';
import { check, PERMISSIONS, request, RESULTS, openSettings } from 'react-native-permissions';

// local dependencies
import { store } from 'store';
import { uploadImageInitiate, DIR } from 'store/api/s3ServiceApi.ts';
import type { Permission } from 'react-native-permissions/src/types.ts';

const openAppSettings = () => {
    openSettings().catch(() => console.warn('Cannot open app settings'));
};

const PERMISSIONS_ITEM = {
    CAMERA: Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA,
    MEDIA: Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
};

const checkPermission = async (permission: Permission): Promise<boolean> => {
    const showPermissionBlockedToast = () => {
        Toast.show({
            type: 'error',
            text1: 'Permission denied',
            text2: 'You need to grant access to upload photos',
            onPress: openAppSettings,
        });
        return false;
    };
    try {
        const currentStatus = await check(permission);

        if (currentStatus === RESULTS.GRANTED || currentStatus === RESULTS.LIMITED) {
            return true;
        }

        if (currentStatus === RESULTS.DENIED) {
            const requestStatus = await request(permission);

            if (requestStatus === RESULTS.GRANTED || requestStatus === RESULTS.LIMITED) {
                return true;
            }

            if (requestStatus === RESULTS.BLOCKED) {
                return showPermissionBlockedToast();
            }
        }

        if (currentStatus === RESULTS.BLOCKED) {
            return showPermissionBlockedToast();
        }
    } catch (error) {
        Toast.show({
            type: 'error',
            text1: 'Permission check failed',
            text2: 'An unexpected error occurred.',
        });
    }

    return false;
};

export const takePicture = async () => {
    const isPermissionGranted = await checkPermission(PERMISSIONS_ITEM.CAMERA);
    if (isPermissionGranted) {
        return ImagePicker.openCamera({
            width: 512,
            height: 512,
            cropping: true,
            multiple: false,
            includeBase64: true,
            cropperCircleOverlay: true,
            cropperToolbarColor: '#156F93',
            cropperActiveWidgetColor: '#FFFFFF',
            cropperToolbarWidgetColor: '#FFFFFF',
            cropperToolbarTitle: 'Crop your image',
        }).then(image => uploadPicture(image));
    }
};

export const getPicture = async () => {
    const isPermissionGranted = Platform.OS === 'android' ? true : await checkPermission(PERMISSIONS_ITEM.MEDIA);
    if (isPermissionGranted) {
        return ImagePicker.openPicker({
            width: 512,
            height: 512,
            cropping: true,
            multiple: false,
            includeBase64: true,
            cropperCircleOverlay: true,
            cropperToolbarColor: '#156F93',
            cropperActiveWidgetColor: '#FFFFFF',
            cropperToolbarWidgetColor: '#FFFFFF',
            cropperToolbarTitle: 'Crop your image',
        }).then(image => uploadPicture(image));
    }
};


const uploadPicture = async (file: PickerImage) => {
    try {
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
            return imageUrl.data?.url;
        }
    } catch (e) {
        Toast.show({
            type: 'error',
            text1: 'Image upload failed',
            text2: 'Please try again later.',
        });
    }
};
