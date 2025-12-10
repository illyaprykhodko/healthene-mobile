// outsource dependencies
import React from 'react';
import Toast from 'react-native-toast-message';
import RNBlobUtil from 'react-native-blob-util';
import Icon from 'react-native-vector-icons/FontAwesome5';
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

// configure
interface AttachmentsProps extends Attachment{
    isUploadFile?: boolean;
    onPreloader: (preloader: boolean) => void;
}

const Attachments = ({ title, mimeType, id, fileName, onPreloader, isUploadFile = false }: AttachmentsProps) => {
    const theme = useTheme();
    const attachmentType = mimeType.split('/')[0];
    const [isDownload, setIsDownload] = React.useState(false);

    const fetchFile = async (path: string, mimeType: string) => {
        const options = {
            path,
            fileCache: true,
            addAndroidDownloads: {
                path,
                notification: true,
                mime: mimeType,
                mediaScannable: true,
                useDownloadManager: true,
                title: 'Downloading file',
            }
        };
        const session = await sessionManager.get();
        return RNBlobUtil.config(options).fetch('GET', `${config.serviceUrl}/${config.apiPath}/s3-service/attachment/${id}`, {
            Authorization: `Bearer${ session.accessToken}`,
        });
    };

    const downloadFile = async () => {
        setIsDownload(true);
        try {
            const dir = Platform.OS === 'ios' ? RNBlobUtil.fs.dirs.DocumentDir : 'android';
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

    const openRemoteFile = async () => {
        try {
            onPreloader(true);
            const dir = Platform.OS === 'ios' ? RNBlobUtil.fs.dirs.DocumentDir : RNBlobUtil.fs.dirs.DCIMDir;
            await fetchFile(`${dir }/${ fileName}`, mimeType).then(async result => {
                await viewDocument({
                    mimeType,
                    headerTitle: title,
                    uri: `file://${result.path()}`,
                    presentationStyle: 'pageSheet'
                });
            });
        } catch (error) {
            const errObj = error as { error: string };
            Toast.show({
                type: 'error',
                text1: 'Update failed',
                text2: errObj?.error || 'Unknown error. Please try again later.',
            });
        } finally {
            onPreloader(false);
        }
    };

    const openFile = () => {
        switch (attachmentType) {
            default: return openRemoteFile();
        }
    };

    const getIcon = () => {
        switch (attachmentType) {
            default: return <Icon style={styles.icon} name="file" size={14} color={theme.colors.darkGrey} />;
        }
    };

    return <View
        style={[
            styles.container,
            { borderColor: theme.colors.border, borderRadius: theme.borderRadius.md },
        ]}
    >
        <Pressable
            style={styles.row}
            onPress={openFile}
        >
            {getIcon()}
            <Text style={styles.flexShrink} numberOfLines={1}>{title}</Text>
        </Pressable>
        {isUploadFile ? null : <Pressable onPress={downloadFile}>
            {isDownload
                ? <MaterialIndicator style={styles.icon} color={theme.colors.darkGrey} size={14}/>
                : <Icon style={styles.icon} name="download" size={14} color={theme.colors.darkGrey}/>
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
