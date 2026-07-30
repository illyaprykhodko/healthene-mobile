// outsource dependencies
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import ImagePicker, { Image as PickerImage, ImageOrVideo, CropRect } from 'react-native-image-crop-picker';
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

export type PickedMediaKind = 'photo' | 'video';

/**
 * A media file the user picked, shaped for a multipart upload. Unlike `getPicture`/`takePicture`
 * (avatar flow — square crop, uploaded via `uploadImage`, returns a URL), these helpers only
 * select the file and leave uploading to the caller, so it can go through `uploadAttachment`
 * and get the numeric attachment id that other APIs reference.
 */
export interface PickedMedia {
    uri: string;
    name: string;
    mimeType: string;
    kind: PickedMediaKind;
}

const FALLBACK_MIME = 'application/octet-stream';

const toPickedMedia = (asset: ImageOrVideo): PickedMedia => {
    const mimeType = asset.mime || FALLBACK_MIME;
    const kind: PickedMediaKind = mimeType.startsWith('video') ? 'video' : 'photo';
    // `filename` is absent for camera captures and for some library videos — synthesize one so
    // the upload still carries a sensible name and extension.
    const extension = mimeType.split('/')[1] || 'bin';
    const name = asset.filename || `${kind}-${Date.now()}.${extension}`;

    return { name, mimeType, kind, uri: asset.path };
};

/** Opens the system photo library for a single photo *or* video. No cropping. */
export const pickMediaFromLibrary = async (): Promise<PickedMedia | undefined> => {
    const isPermissionGranted = Platform.OS === 'android' ? true : await checkPermission(PERMISSIONS_ITEM.MEDIA);
    if (!isPermissionGranted) {
        return;
    }
    try {
        const asset = await ImagePicker.openPicker({
            multiple: false,
            cropping: false,
            mediaType: 'any',
        });
        return toPickedMedia(asset);
    } catch (error) {
        if (isCancellation(error)) {
            return;
        }
        throw error;
    }
};

/**
 * Opens the system camera. The native camera opens in one mode, so the caller states which —
 * there is no combined photo/video capture screen to hand out.
 */
export const captureMedia = async (kind: PickedMediaKind = 'photo'): Promise<PickedMedia | undefined> => {
    const isPermissionGranted = await checkPermission(PERMISSIONS_ITEM.CAMERA);
    if (!isPermissionGranted) {
        return;
    }
    try {
        const asset = await ImagePicker.openCamera({
            multiple: false,
            cropping: false,
            mediaType: kind === 'video' ? 'video' : 'photo',
        });
        return toPickedMedia(asset);
    } catch (error) {
        if (isCancellation(error)) {
            return;
        }
        throw error;
    }
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
