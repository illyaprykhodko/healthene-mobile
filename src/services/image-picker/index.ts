// outsource dependencies
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import ImagePicker, { Image as PickerImage, CropRect } from 'react-native-image-crop-picker';
import { check, PERMISSIONS, request, RESULTS, openSettings, type Permission } from 'react-native-permissions';

// local dependencies
import { store } from 'store';
import { uploadImageInitiate, DIR } from 'store/api/s3ServiceApi.ts';

const openAppSettings = () => {
    openSettings().catch(() => console.warn('Cannot open app settings'));
};

const PERMISSIONS_ITEM = {
    CAMERA: Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA,
    MEDIA: Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
};

const CROPPER_OPTIONS = {
    width: 512,
    height: 512,
    cropperCircleOverlay: true,
    mediaType: 'photo' as const,
    cropperToolbarColor: '#156F93',
    cropperActiveWidgetColor: '#FFFFFF',
    cropperToolbarWidgetColor: '#FFFFFF',
    cropperToolbarTitle: 'Crop your image',
};

const isCancellation = (error: any): boolean =>
    error?.code === 'E_PICKER_CANCELLED' || error?.message?.includes('cancel');

const checkPermission = async (permission: Permission): Promise<boolean> => {
    const showPermissionBlockedToast = () => {
        Toast.show({
            type: 'error',
            onPress: openAppSettings,
            text1: 'Permission denied',
            text2: 'You need to grant access to upload photos',
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

const pickAndCrop = async (
    pickOriginal: () => Promise<PickerImage>
): Promise<string | undefined> => {
    try {
        const original = await pickOriginal();
        const cropped = await ImagePicker.openCropper({
            ...CROPPER_OPTIONS,
            path: original.path,
        });
        if (!cropped.cropRect?.width || !cropped.cropRect?.height) {
            return;
        }
        return uploadPicture(original, cropped.cropRect);
    } catch (error) {
        if (isCancellation(error)) {
            return;
        }
        throw error;
    }
};

export const takePicture = async () => {
    const isPermissionGranted = await checkPermission(PERMISSIONS_ITEM.CAMERA);
    if (!isPermissionGranted) {
        return;
    }
    return pickAndCrop(() =>
        ImagePicker.openCamera({
            multiple: false,
            useFrontCamera: true,
            mediaType: 'photo',
        })
    );
};

export const getPicture = async () => {
    const isPermissionGranted = Platform.OS === 'android' ? true : await checkPermission(PERMISSIONS_ITEM.MEDIA);
    if (!isPermissionGranted) {
        return;
    }
    return pickAndCrop(() =>
        ImagePicker.openPicker({
            multiple: false,
            mediaType: 'photo',
        })
    );
};

const uploadPicture = async (original: PickerImage, cropRect: CropRect) => {
    try {
        const body = new FormData();
        const fileName = (original.filename || '').replace(/[^\d|A-Z|a-z]/g, '_').replace(/_+/g, '_') || 'image';
        const fileNameWithExt = `${fileName}.jpg`;
        body.append('dir', DIR.USER);
        body.append('file', {
            uri: original.path,
            type: original.mime,
            name: fileNameWithExt,
        });
        const imageUrl = await store.dispatch(
            uploadImageInitiate({
                body,
                params: {
                    x: cropRect.x,
                    y: cropRect.y,
                    width: cropRect.width,
                    height: cropRect.height,
                },
            })
        );
        return imageUrl.data?.url;
    } catch (e) {
        Toast.show({
            type: 'error',
            text1: 'Image upload failed',
            text2: 'Please try again later.',
        });
    }
};
