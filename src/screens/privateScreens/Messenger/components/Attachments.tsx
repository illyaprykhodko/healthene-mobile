// outsource dependencies
import React from 'react';
import Toast from 'react-native-toast-message';
import RNBlobUtil from 'react-native-blob-util';
import Icon from '@react-native-vector-icons/fontawesome5';
import { MaterialIndicator } from 'react-native-indicators';
import { viewDocument } from '@react-native-documents/viewer';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

// local dependencies
import { config } from 'constants';
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { Attachment } from 'types/messenger.ts';
import { sessionManager } from 'store/api/baseApi.ts';
import AttachmentViewerModal from 'screens/privateScreens/Messenger/components/AttachmentViewerModal.tsx';

// configure
type FileIconName =
    | 'file'
    | 'file-alt'
    | 'file-image'
    | 'file-video'
    | 'file-audio'
    | 'file-pdf'
    | 'file-word'
    | 'file-excel'
    | 'file-powerpoint'
    | 'file-archive'
    | 'file-code';

interface AttachmentsProps extends Attachment{
    onRemove?: () => void;
    isUploadFile?: boolean;
    onPreloader: (preloader: boolean) => void;
}

const Attachments = ({
    id,
    title,
    mimeType,
    fileName,
    onRemove,
    onPreloader,
    isUploadFile = false,
}: AttachmentsProps) => {
    const theme = useTheme();
    const [isDownload, setIsDownload] = React.useState(false);
    const [preview, setPreview] = React.useState<{ uri: string; mimeType: string } | null>(null);

    const iconNameForMime = (mime: string): FileIconName => {
        const [primary] = mime.split('/');
        if (primary === 'text') { return 'file-alt'; }
        if (primary === 'image') { return 'file-image'; }
        if (primary === 'video') { return 'file-video'; }
        if (primary === 'audio') { return 'file-audio'; }
        if (mime === 'application/pdf') { return 'file-pdf'; }
        if (mime.includes('excel') || mime.includes('spreadsheet')) { return 'file-excel'; }
        if (mime.includes('word') || mime.includes('opendocument.text')) { return 'file-word'; }
        if (mime.includes('powerpoint') || mime.includes('presentation')) { return 'file-powerpoint'; }
        if (mime.includes('json') || mime.includes('javascript') || mime.includes('xml')) { return 'file-code'; }
        if (mime.includes('zip') || mime.includes('rar') || mime.includes('compressed') || mime.includes('tar')) { return 'file-archive'; }
        return 'file';
    };

    const fetchFile = async (path: string, mimeType: string) => {
        const options = {
            path,
            fileCache: true,
            addAndroidDownloads: {
                path,
                mime: mimeType,
                notification: true,
                mediaScannable: true,
                useDownloadManager: true,
                title: 'Downloading file',
            }
        };
        const session = await sessionManager.get();
        return RNBlobUtil.config(options).fetch('GET', `${config.serviceUrl}/${config.apiPath}/s3-service/attachment/${id}`, {
            Authorization: `Bearer ${session.accessToken}`,
        });
    };

    const downloadFile = async () => {
        setIsDownload(true);
        try {
            const dir = Platform.OS === 'ios' ? RNBlobUtil.fs.dirs.DocumentDir : RNBlobUtil.fs.dirs.LegacyDownloadDir;
            await fetchFile(`${dir }/${ fileName}`, mimeType).then(() => {
                Toast.show({
                    type: 'success',
                    text1: 'Download complete',
                });
            });
        } catch (error) {
            const errObj = error as { error: string };
            Toast.show({
                type: 'error',
                text1: 'Download failed',
                text2: errObj?.error || 'Unknown error. Please try again later.',
            });
        } finally {
            setIsDownload(false);
        }
    };

    // Pull the file into app-private cache for previewing. Different from `fetchFile`,
    // which uses Android's DownloadManager (DM shows a system notification — appropriate
    // for explicit downloads, not for tap-to-preview).
    const fetchForPreview = async () => {
        const baseName = fileName.split('/').pop() || fileName;
        const path = `${RNBlobUtil.fs.dirs.CacheDir}/${baseName}`;
        const session = await sessionManager.get();
        return RNBlobUtil.config({ path, fileCache: true })
            .fetch('GET', `${config.serviceUrl}/${config.apiPath}/s3-service/attachment/${id}`, {
                Authorization: `Bearer ${session.accessToken}`,
            });
    };

    // Types the Android in-app WebView modal can render reliably. PDFs/docs/etc.
    // are handled by the OS via actionViewIntent. iOS doesn't use the modal at all —
    // viewDocument already gives the right Quick Look experience on that platform.
    const isAndroidModalPreviewable = (mime: string): boolean => {
        const [primary] = mime.split('/');
        return primary === 'video'
            || primary === 'audio'
            || primary === 'image';
    };

    const openRemoteFile = async () => {
        try {
            onPreloader(true);
            const result = await fetchForPreview();
            const localUri = `file://${result.path()}`;
            if (Platform.OS === 'android') {
                // In-app modal viewer for media (video/audio/image) — overlays the current
                // screen with the WebView (Chrome media stack, no ExoPlayer codec init,
                // avoids OEM-specific crashes).
                if (isAndroidModalPreviewable(mimeType)) {
                    setPreview({ uri: localUri, mimeType });
                    return;
                }
                // Android 7+ refuses raw file:// URIs across app boundaries; hand the file to
                // the OS via blob-util's FileProvider-backed intent so the stock viewer opens.
                await RNBlobUtil.android.actionViewIntent(result.path(), mimeType);
            } else {
                await viewDocument({
                    mimeType,
                    uri: localUri,
                    headerTitle: title,
                    presentationStyle: 'pageSheet'
                });
            }
        } catch (error) {
            const errObj = error as { error?: string };
            Toast.show({
                type: 'error',
                text1: 'Unable to open',
                text2: errObj?.error || 'No app on this device can open this file.',
            });
        } finally {
            onPreloader(false);
        }
    };

    const getIcon = () => (
        <Icon
            size={18}
            style={styles.icon}
            color={theme.colors.darkGrey}
            name={iconNameForMime(mimeType)}
        />
    );

    return <>
        <View
            style={[styles.container, { borderColor: theme.colors.border, borderRadius: theme.borderRadius.md },]}
        >
            <Pressable
                style={styles.row}
                onPress={openRemoteFile}
            >
                {getIcon()}
                <Text style={styles.flexShrink} numberOfLines={1}>{title}</Text>
            </Pressable>
            {isUploadFile ? (
                <Pressable onPress={onRemove} hitSlop={8}>
                    <Icon
                        size={16}
                        iconStyle="solid"
                        style={styles.icon}
                        name="times-circle"
                        color={theme.colors.error || theme.colors.darkGrey}
                    />
                </Pressable>
            ) : <Pressable onPress={downloadFile}>
                {isDownload
                    ? <MaterialIndicator style={styles.icon} color={theme.colors.darkGrey} size={14}/>
                    : <Icon iconStyle="solid" style={styles.icon} name="download" size={14} color={theme.colors.darkGrey}/>
                }
            </Pressable>}
        </View>
        {preview
            ? <AttachmentViewerModal
                title={title}
                uri={preview.uri}
                mimeType={preview.mimeType}
                onClose={() => setPreview(null)}
            />
            : null}
    </>;
};

export default Attachments;
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        paddingVertical: OFFSET.POINT,
        paddingHorizontal: OFFSET.POINT,
        marginTop: OFFSET.POINT * 2
    },
    row: {
        flexGrow: 1,
        flexShrink: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        paddingHorizontal: OFFSET.POINT * 2,
    },
    flexShrink: {
        flexShrink: 1,
    }
});
