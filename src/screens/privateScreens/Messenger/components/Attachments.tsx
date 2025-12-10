// outsource dependencies
import React from 'react';
import Toast from 'react-native-toast-message';
import RNBlobUtil from 'react-native-blob-util';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { viewDocument } from '@react-native-documents/viewer';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// local dependencies
import { config } from 'constants';
import Text from 'components/Text.tsx';
import { OFFSET } from 'constants/offset.ts';
import { Attachment } from 'types/messenger.ts';
import { sessionManager } from 'store/api/baseApi.ts';
import { RootStackParamList } from 'services/navigation';

// configure

interface AttachmentsProps extends Attachment{
  // props here
}

const Attachments = ({ title, mimeType, id, fileName }: AttachmentsProps) => {
    const attachmentType = mimeType.split('/')[0];
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const openRemotePDF = async () => {
        try {
            const dir = Platform.OS === 'ios' ? RNBlobUtil.fs.dirs.DocumentDir : RNBlobUtil.fs.dirs.DCIMDir;
            const options = {
                fileCache: true,
                path: dir + fileName, // This is the path where your downloaded file will live in
                addAndroidDownloads: {
                    notification: true,
                    mime: mimeType,
                    mediaScannable: true,
                    useDownloadManager: true, // Setting it to true will use the device's native download manager and will be shown in the notification bar.
                    path: dir + fileName, // this is the path where your downloaded file will live in
                    title: 'Downloading file',
                }
            };
            const session = await sessionManager.get();
            RNBlobUtil.config(options).fetch('GET', `${config.serviceUrl}/${config.apiPath}/s3-service/attachment/${id}`, {
                Authorization: `Bearer${ session.accessToken}`,
            }).then(async result => {
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
        }
    };

    const openFile = () => {
        switch (attachmentType) {
            // default:
            //     Toast.show({
            //         type: 'info',
            //         text1: 'Unsupported file type',
            //         text2: mimeType || 'Cannot open this attachment.',
            //     });
            default:
                openRemotePDF().then(result => { console.log('RESULT!!', result); });
                break;
        }
    };
    // navigation.navigate(ROUTES.DOCUMENTS_VIEWER, { attachmentType })
    return <Pressable style={styles.container} onPress={openFile}>
        <Text>{title}</Text>
    </Pressable>;
};

export default Attachments;
const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        paddingVertical: OFFSET.POINT,
        paddingHorizontal: OFFSET.POINT,
        marginVertical: OFFSET.POINT * 2
    },
});
