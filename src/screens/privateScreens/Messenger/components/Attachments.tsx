// outsource dependencies
import React from 'react';
import Toast from 'react-native-toast-message';
import RNBlobUtil from 'react-native-blob-util';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/fontawesome5';
import { MaterialIndicator } from 'react-native-indicators';
import { viewDocument } from '@react-native-documents/viewer';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// local dependencies
import { config } from 'constants';
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { ROUTES } from 'constants/routes.ts';
import { OFFSET } from 'constants/offset.ts';
import { Attachment } from 'types/messenger.ts';
import { sessionManager } from 'store/api/baseApi.ts';
import { RootStackParamList } from 'services/navigation';

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
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [isDownload, setIsDownload] = React.useState(false);

    const iconNameForMime = (mime: string): FileIconName => {
        const [primary] = mime.split('/');
        if (primary === 'image') { return 'file-image'; }
        if (primary === 'video') { return 'file-video'; }
        if (primary === 'audio') { return 'file-audio'; }
        if (primary === 'text') { return 'file-alt'; }
        if (mime === 'application/pdf') { return 'file-pdf'; }
        if (mime.includes('word') || mime.includes('opendocument.text')) { return 'file-word'; }
        if (mime.includes('excel') || mime.includes('spreadsheet')) { return 'file-excel'; }
        if (mime.includes('powerpoint') || mime.includes('presentation')) { return 'file-powerpoint'; }
        if (mime.includes('zip') || mime.includes('rar') || mime.includes('compressed') || mime.includes('tar')) { return 'file-archive'; }
        if (mime.includes('json') || mime.includes('javascript') || mime.includes('xml')) { return 'file-code'; }
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

    // Types the in-app WebView viewer can render reliably via HTML5 native handling.
    // PDFs are excluded — Android WebView doesn't ship a PDF renderer (and iOS
    // WKWebView only does on newer iOS), so we let the OS PDF viewer handle them.
    const isInAppPreviewable = (mime: string): boolean => {
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
            // In-app WebView viewer for media (video/audio/image) — keeps the user in
            // context, shows native HTML5 controls without a fullscreen takeover, and avoids
            // the OEM-specific ExoPlayer crashes on Android because WebView uses Chrome's
            // media stack instead.
            if (isInAppPreviewable(mimeType)) {
                // Header title slot can't accommodate long filenames between the back button
                // and the hamburger — truncate so it doesn't overlap the right icon.
                const headerTitle = title.length > 20 ? `${title.slice(0, 20)}…` : title;
                navigation.navigate(ROUTES.MESSENGER_ATTACHMENT_VIEWER, {
                    uri: localUri,
                    mimeType,
                    title: headerTitle,
                });
                return;
            }
            if (Platform.OS === 'android') {
                // Android 7+ refuses raw file:// URIs across app boundaries; hand the file to
                // the OS via blob-util's FileProvider-backed intent so the stock viewer opens.
                await RNBlobUtil.android.actionViewIntent(result.path(), mimeType);
            } else {
                await viewDocument({
                    mimeType,
                    headerTitle: title,
                    uri: localUri,
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

    return <View
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
    </View>;
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
