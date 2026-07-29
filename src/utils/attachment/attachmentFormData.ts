// outsource dependencies
import { Platform } from 'react-native';

/** Local file to upload through `/s3-service/attachment/upload`. */
export interface AttachmentUploadFile {
    uri: string;
    name: string;
    mimeType: string;
}

/**
 * Both fields are required by the endpoint. A missing `description` fails the whole request with a
 * 500 ("Required request parameter 'description' for method parameter type String is not present"),
 * which is easy to miss because it looks like a server fault rather than a bad payload — so they
 * are mandatory here instead of optional, to make omitting one impossible at a call site.
 */
export interface AttachmentUploadMeta {
    title: string;
    description: string;
}

/**
 * Android hands back `content://` URIs from SAF and bare filesystem paths from the camera; RN's
 * multipart encoder needs a scheme on the latter. iOS paths are accepted as-is.
 */
export const normalizeAttachmentUri = (path?: string): string => {
    if (!path) { return ''; }
    if (path.startsWith('content://') || path.startsWith('file://')) { return path; }
    if (Platform.OS === 'android') { return `file://${path}`; }
    return path;
};

/**
 * Single place that builds the multipart body for the attachment upload endpoint. Use this rather
 * than assembling FormData inline, so every caller satisfies the endpoint's required fields.
 */
export const buildAttachmentFormData = (
    file: AttachmentUploadFile,
    { title, description }: AttachmentUploadMeta,
): FormData => {
    const formData = new FormData();

    formData.append('file', {
        name: file.name,
        type: file.mimeType,
        uri: normalizeAttachmentUri(file.uri),
    });
    formData.append('title', title);
    formData.append('description', description);

    return formData;
};
