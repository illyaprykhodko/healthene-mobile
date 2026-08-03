// outsource dependencies
import * as yup from 'yup';
import { Formik } from 'formik';
import dayjs from 'services/date';
import * as Sentry from '@sentry/react-native';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/fontawesome5';
import { pick, types } from '@react-native-documents/picker';
import React, { useCallback, useMemo, useState } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

// local dependencies
import { config } from 'constants';
import Text from 'components/Text.tsx';
import { filters } from 'services/filter';
import Screen from 'components/Screen.tsx';
import { ROUTES } from 'constants/routes.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { Button } from 'components/Button.tsx';
import TextInput from 'components/TextInput.tsx';
import { RootState, useAppSelector } from 'store';
import ProfileImage from 'components/ProfileImage.tsx';
import { getClinicRoleLabel } from 'constants/spec.ts';
import { RootStackParamList } from 'services/navigation';
import LoadingOverlay from 'components/LoadingOverlay.tsx';
import { MessageForm, Recipient } from 'types/messenger.ts';
import { buildAttachmentFormData } from 'utils/attachment/attachmentFormData';
import Attachments from 'screens/privateScreens/Messenger/components/Attachments.tsx';
import { useCreateChainMutation, useReplyToChainMutation } from 'store/api/messengerApi.ts';
import { useDeleteFileMutation, useUploadAttachmentMutation } from 'store/api/s3ServiceApi.ts';
import {
    setAttachment,
    saveMessageForm,
    clearCollocutor,
    removeAttachment,
} from 'store/slices/messengerSlice.ts';

// configure
const ATTACHMENTS = {
    FILE: 'FILE',
    VIDEO: 'VIDEO',
    AUDIO: 'AUDIO',
};
type AttachmentType = typeof ATTACHMENTS[keyof typeof ATTACHMENTS];
const validationSchema = yup.object().shape({
    subject: yup.string()
        .trim()
        .required('Subject is required.')
        .min(3, 'Subject should contain at least 3 symbol character.'),
    text: yup.string()
        .trim()
        .required('Subject is required.')
        .min(3, 'Subject should contain at least 3 symbol character.'),
});

const WriteMessageScreen = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const user = useAppSelector((state: RootState) => state.app.user);
    const { reply: chain, initialValues, collocutor: pickedCollocutor } = useSelector((state: RootState) => state.messenger);

    const [preloader, setPreloader] = useState<boolean>(false);

    const [replyChain] = useReplyToChainMutation();
    const [createChain] = useCreateChainMutation();
    const [uploadFile] = useUploadAttachmentMutation();
    const [deleteFile] = useDeleteFileMutation();
    const formInitialValues: MessageForm = chain
        ? { ...initialValues, subject: chain.subject }
        : initialValues;

    const recipient = useMemo<Recipient | null>(() => {
        if (pickedCollocutor) { return pickedCollocutor; }
        if (chain?.collocutor || chain?.owner) {
            const source = chain.collocutor ?? chain.owner;
            return {
                id: source.id,
                name: source.name,
                coverImage: source.coverImage,
            } as Recipient;
        }
        if (user?.physician) {
            return {
                id: user.physician.id,
                name: user.physician.name,
                clinicRole: user.physician.clinicRole,
                coverImage: user.physician.coverImage as Recipient['coverImage'],
            };
        }
        return null;
    }, [
        pickedCollocutor,
        chain,
        user,
    ]);

    const recipientName = recipient?.name
        || [recipient?.firstName, recipient?.lastName].filter(Boolean).join(' ')
        || null;
    const roleLabel = recipient?.clinicRole ? getClinicRoleLabel(recipient.clinicRole) : 'Physician';
    // NOTE not allowed to change recipient when replying inside an existing chain
    const canPickRecipient = !chain;
    const handleOpenRecipientPicker = useCallback(() => {
        if (!canPickRecipient) { return; }
        navigation.navigate(ROUTES.SELECT_RECIPIENT, { selectedId: recipient?.id });
    }, [
        canPickRecipient,
        navigation,
        recipient,
    ]);
    const saveForm = useCallback(
        (values: MessageForm) => {
            dispatch(saveMessageForm(values));
        },
        [dispatch]
    );
    const handleSubmit = useCallback(async (data: MessageForm, formikHelpers?: any) => {
        try {
            if (chain) {
                await replyChain({ chain, ...data, attachments: initialValues.attachments }).unwrap();
            } else if (recipient?.id) {
                await createChain({
                    ...data,
                    attachments: initialValues.attachments,
                    collocutor: { id: recipient.id },
                }).unwrap();
            } else {
                return;
            }
        } catch (error) {
            Sentry.captureException(error);
            Toast.show({
                type: 'error',
                text1: 'Send failed',
                text2: 'We couldn’t send your message. Please try again.',
            });
            return;
        }

        // reset form fields
        formikHelpers?.resetForm({
            values: {
                text: '',
                subject: '',
                attachments: []
            }
        });

        // clear attachments in redux
        dispatch(saveMessageForm({
            text: '',
            subject: '',
            attachments: []
        } as any));
        dispatch(clearCollocutor());

        navigation.navigate(ROUTES.MESSAGE_LIST);
    }, [
        chain,
        dispatch,
        recipient,
        replyChain,
        navigation,
        createChain,
        initialValues,
    ]);

    const handleAttachFile = useCallback(async () => {
        try {
            setPreloader(true);
            const [file] = await pick({ type: [types.allFiles] });
            // The picker leaves `name` null for some providers; it feeds both the upload filename
            // and the title, so fall back rather than sending null through.
            const fileName = file.name ?? 'attachment';
            const body = buildAttachmentFormData(
                {
                    uri: file.uri,
                    name: fileName,
                    mimeType: file.type ?? 'application/octet-stream',
                },
                {
                    title: fileName,
                    description: dayjs().format(),
                },
            );
            const attachment = await uploadFile({ body }).unwrap();
            dispatch(setAttachment(attachment));
            Toast.show({
                type: 'success',
                text1: 'Upload successful',
                text2: 'File selected successfully',
            });
        } catch (error) {
            Sentry.captureException(error);
            Toast.show({
                type: 'error',
                text1: 'Upload failed',
                text2: 'File selection cancelled or failed',
            });
        } finally {
            setPreloader(false);
        }
    }, []);

    const resolveAttachmentDeleteUrl = useCallback((attachment: MessageForm['attachments'][number]) => {
        if (attachment.url) { return attachment.url; }
        return `${config.serviceUrl}/${config.apiPath}/s3-service/attachment/${attachment.id}`;
    }, []);

    const handleRemoveAttachment = useCallback(async (attachment: MessageForm['attachments'][number]) => {
        try {
            setPreloader(true);
            const deleteUrl = resolveAttachmentDeleteUrl(attachment);
            await deleteFile([{ url: deleteUrl }]).unwrap();

            dispatch(removeAttachment(attachment.id));
            Toast.show({
                type: 'success',
                text1: 'Attachment removed',
                text2: 'File removed successfully',
            });
        } catch (error) {
            Sentry.captureException(error);
            Toast.show({
                type: 'error',
                text1: 'Remove failed',
                text2: 'Unable to remove the file. Please try again.',
            });
        } finally {
            setPreloader(false);
        }
    }, [
        deleteFile,
        dispatch,
        resolveAttachmentDeleteUrl
    ]);

    const showCaptureModeSelector = useCallback((onSave: () => void) => {
        Alert.alert(
            'Attach from camera',
            'Choose what you want to capture',
            [
                {
                    text: 'Photo',
                    onPress: () => {
                        onSave();
                        navigation.navigate(ROUTES.MESSENGER_CAMERA, { captureMode: 'photo' });
                    },
                },
                {
                    text: 'Video',
                    onPress: () => {
                        onSave();
                        navigation.navigate(ROUTES.MESSENGER_CAMERA, { captureMode: 'video' });
                    },
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
    }, [navigation]);

    const getAttachment = useCallback((item: AttachmentType, onSave: () => void) => {
        switch (item) {
            default: return <Pressable
                key={item}
                onPress={() => showCaptureModeSelector(onSave)}
                style={[styles.mediaButton, { backgroundColor: theme.colors.surfaceAlt }]}
            >
                <View style={[styles.mediaButtonIcon, { backgroundColor: theme.colors.border }]}>
                    <Icon iconStyle="solid" name="video" color={theme.colors.textSecondary} size={20} />
                </View>
                <Text color={theme.colors.textSecondary}>{filters.humanize(item)}</Text>
            </Pressable>;
            case ATTACHMENTS.AUDIO: return <Pressable
                key={item}
                onPress={() => navigation.navigate(ROUTES.MESSENGER_AUDIO)}
                style={[styles.mediaButton, { backgroundColor: theme.colors.surfaceAlt }]}
            >
                <View style={[styles.mediaButtonIcon, { backgroundColor: theme.colors.border }]}>
                    <Icon iconStyle="solid" name="microphone" color={theme.colors.textSecondary} size={20} />
                </View>
                <Text color={theme.colors.textSecondary}>{filters.humanize(item)}</Text>
            </Pressable>;
            case ATTACHMENTS.FILE: return <Pressable
                key={item}
                onPress={() => {
                    onSave();
                    handleAttachFile().catch(error => console.error(error));
                }}
                style={[styles.mediaButton, { backgroundColor: theme.colors.surfaceAlt }]}
            >
                <View style={[styles.mediaButtonIcon, { backgroundColor: theme.colors.border }]}>
                    <Icon iconStyle="solid" name="paperclip" color={theme.colors.textSecondary} size={20} />
                </View>
                <Text color={theme.colors.textSecondary}>{filters.humanize(item)}</Text>
            </Pressable>;
        }
    }, [handleAttachFile, showCaptureModeSelector]);

    return <>
        <LoadingOverlay init={preloader} />
        <Screen initialized={true} style={styles.container}>
            <ScrollView>
                <KeyboardAwareScrollView
                    bottomOffset={80}
                    style={styles.flex}
                    contentContainerStyle={styles.flexGrow}
                >
                    <Pressable
                        style={styles.row}
                        disabled={!canPickRecipient}
                        onPress={handleOpenRecipientPicker}
                    >
                        <ProfileImage
                            uri={recipient?.coverImage?.url}
                            style={{ ...styles.profileImg, borderColor: theme.colors.grey }}
                        />
                        <View style={styles.recipientBody}>
                            <Text numberOfLines={1}>
                                To:
                                &nbsp;
                                {recipientName ?? 'Select recipient'}
                            </Text>
                            <Text variant="caption" color={theme.colors.grey}>{roleLabel}</Text>
                        </View>
                        {canPickRecipient && (
                            <Icon
                                size={14}
                                iconStyle="solid"
                                name="chevron-right"
                                color={theme.colors.textSecondary}
                            />
                        )}
                    </Pressable>
                    <Formik<MessageForm>
                        enableReinitialize
                        initialValues={formInitialValues}
                        validationSchema={validationSchema}
                        onSubmit={(values, helpers) => handleSubmit(values, helpers)}
                    >
                        {({ values, errors, touched, handleChange, handleSubmit }) => {
                            return <View style={styles.formContainer}>
                                <TextInput
                                    name="subject"
                                    label="Subject"
                                    disabled={false}
                                    textAlign="left"
                                    value={values.subject}
                                    color={theme.colors.black}
                                    onChangeText={handleChange('subject')}
                                    error={touched.subject && errors.subject ? { subject: errors.subject } : undefined}
                                />
                                <TextInput
                                    multiline
                                    name="text"
                                    label="Text"
                                    disabled={false}
                                    textAlign="left"
                                    value={values.text}
                                    color={theme.colors.black}
                                    onChangeText={handleChange('text')}
                                    error={touched.text && errors.text ? { text: errors.text } : undefined}
                                />
                                {initialValues.attachments.map(item => (
                                    <Attachments
                                        isUploadFile
                                        key={item?.id}
                                        onPreloader={setPreloader}
                                        onRemove={() => { void handleRemoveAttachment(item); }}
                                        {...item}
                                    />
                                ))}
                                <View style={styles.attachmentsContainer}>
                                    {Object.values(ATTACHMENTS).map(item => getAttachment(item, () => saveForm(values)))}
                                </View>
                                <Button
                                    variant="outline"
                                    title="SEND MESSAGE"
                                    onPress={handleSubmit}
                                    disabled={!chain && !recipient?.id}
                                />
                            </View>;
                        }}
                    </Formik>
                </KeyboardAwareScrollView>
            </ScrollView>
        </Screen>
    </>;
};

export default WriteMessageScreen;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    profileImg: {
        borderWidth: 1,
        marginRight: OFFSET.HORIZONTAL,
    },
    formContainer: {
        marginVertical: OFFSET.VERTICAL,
    },
    attachmentsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: OFFSET.VERTICAL
    },
    mediaButtonIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: OFFSET.POINT
    },
    mediaButton: {
        width: '30%',
        alignItems: 'center',
        padding: 20,
        justifyContent: 'space-around',
        borderRadius: 5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recipientBody: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    flexGrow: {
        flexGrow: 1
    }
});
