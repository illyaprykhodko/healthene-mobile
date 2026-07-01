// outsource dependencies
import React, { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/fontawesome5';
import { pick, types } from '@react-native-documents/picker';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

// local dependencies
import { config } from 'constants';
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
import TextInput from 'components/TextInput';
import StackHeader from 'components/StackHeader';
import { MessageService } from 'services/messages';
import { IconLogo, TextLogo } from 'components/TextLogo';
import { useSubmitFeedback } from 'hooks/useSubmitFeedback';
import { FeedbackAttachmentRef, FeedbackMediaType, FeedbackType } from 'types/feedback';
import { useDeleteFileMutation, useUploadAttachmentMutation } from 'store/api/s3ServiceApi';
import {
    FEEDBACK_TYPES,
    FEEDBACK_MESSAGE_MAX,
    DEFAULT_FEEDBACK_TYPE,
    FEEDBACK_MAX_ATTACHMENTS,
} from 'constants/feedback';

interface FeedbackAttachmentItem extends FeedbackAttachmentRef {
    id: number;
}

const isCancellation = (error: any): boolean =>
    error?.code === 'OPERATION_CANCELED' || /cancel/i.test(error?.message ?? '');

export const HelpSupportScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();

    const [type, setType] = useState<FeedbackType>(DEFAULT_FEEDBACK_TYPE);
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState<FeedbackAttachmentItem[]>([]);
    const [isBusy, setIsBusy] = useState(false);

    const [uploadAttachment] = useUploadAttachmentMutation();
    const [deleteFile] = useDeleteFileMutation();
    const { submit, isSubmitting } = useSubmitFeedback();

    const remaining = FEEDBACK_MESSAGE_MAX - message.length;
    const canSubmit = !!message.trim() && !isSubmitting && !isBusy;

    const handleAttach = useCallback(async () => {
        if (attachments.length >= FEEDBACK_MAX_ATTACHMENTS) {
            MessageService.toastWarning(`You can attach up to ${FEEDBACK_MAX_ATTACHMENTS} files.`);
            return;
        }
        try {
            const [file] = await pick({ type: [types.images, types.video] });
            setIsBusy(true);
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.type ?? 'application/octet-stream',
            });
            formData.append('title', file.name ?? 'feedback-attachment');
            const uploaded = await uploadAttachment({ body: formData }).unwrap();
            const url = uploaded.url || `${config.serviceUrl}/${config.apiPath}/s3-service/attachment/${uploaded.id}`;
            const mediaType: FeedbackMediaType = (uploaded.mimeType || file.type || '').startsWith('video')
                ? 'video'
                : 'photo';
            setAttachments(current => [
                ...current,
                { id: uploaded.id, url, mediaType, fileName: uploaded.fileName || file.name || undefined },
            ]);
        } catch (error) {
            if (!isCancellation(error)) {
                MessageService.toastWarning('Could not attach the file. Please try again.');
            }
        } finally {
            setIsBusy(false);
        }
    }, [attachments.length, uploadAttachment]);

    const handleRemove = useCallback(
        async (item: FeedbackAttachmentItem) => {
            try {
                setIsBusy(true);
                await deleteFile([{ url: item.url }]).unwrap();
                setAttachments(current => current.filter(entry => entry.id !== item.id));
            } catch (error) {
                MessageService.toastWarning('Could not remove the file. Please try again.');
            } finally {
                setIsBusy(false);
            }
        },
        [deleteFile],
    );

    const handleSubmit = useCallback(() => {
        const refs: FeedbackAttachmentRef[] = attachments.map(({ url, mediaType, fileName }) => ({
            url,
            fileName,
            mediaType,
        }));
        submit({ type, message, attachments: refs }, { onSuccess: () => navigation.goBack() });
    }, [attachments, message, type, submit, navigation]);

    return (
        <Screen initialized style={styles.screen}>
            <StackHeader
                title="Give Feedback"
                onBack={() => navigation.goBack()}
                onOpenDrawer={() => navigation.openDrawer?.()}
            />
            <ScrollView
                style={styles.scroll}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.content}
            >
                <View style={styles.brand}>
                    <IconLogo disabled />
                    <TextLogo color={theme.colors.primary} />
                </View>

                <Text variant="h5" color={theme.colors.text} style={styles.question}>
                    What type of feedback would you like to provide?
                </Text>

                <View style={styles.options}>
                    {FEEDBACK_TYPES.map(option => {
                        const active = option.value === type;
                        return (
                            <Pressable
                                key={option.value}
                                accessibilityRole="radio"
                                onPress={() => setType(option.value)}
                                accessibilityState={{ selected: active }}
                                style={[
                                    styles.option,
                                    {
                                        backgroundColor: active ? theme.colors.primary : theme.colors.surfaceSecond,
                                    },
                                ]}
                            >
                                <Text variant="h5" color={active ? theme.colors.white : theme.colors.text}>
                                    {option.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <Text variant="h5" color={theme.colors.text} style={styles.label}>
                    Please share your feedback
                </Text>
                <TextInput
                    multiline
                    value={message}
                    disabled={false}
                    name="feedbackMessage"
                    onChangeText={setMessage}
                    maxLength={FEEDBACK_MESSAGE_MAX}
                    placeholder="Share your feedback..."
                />
                <Text variant="caption" color={theme.colors.textSecondary}>
                    Characters remaining: {remaining}
                </Text>

                <View style={styles.attachments}>
                    {attachments.map(item => (
                        <View key={item.id} style={[styles.attachmentRow, { borderColor: theme.colors.border }]}>
                            <Icon
                                size={16}
                                iconStyle="solid"
                                color={theme.colors.primary}
                                name={item.mediaType === 'video' ? 'file-video' : 'file-image'}
                            />
                            <Text
                                numberOfLines={1}
                                variant="caption"
                                color={theme.colors.text}
                                style={styles.attachmentName}
                            >
                                {item.fileName || `${item.mediaType}-attachment`}
                            </Text>
                            <Pressable
                                hitSlop={8}
                                accessibilityRole="button"
                                onPress={() => handleRemove(item)}
                                accessibilityLabel="Remove attachment"
                            >
                                <Icon name="times" size={16} iconStyle="solid" color={theme.colors.error} />
                            </Pressable>
                        </View>
                    ))}

                    {attachments.length < FEEDBACK_MAX_ATTACHMENTS && (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onPress={handleAttach}
                            style={styles.attachButton}
                            title="Attach photo or video"
                        />
                    )}
                    {isBusy && <ActivityIndicator color={theme.colors.primary} style={styles.busy} />}
                </View>

                <Button
                    title="Done"
                    style={styles.submit}
                    disabled={!canSubmit}
                    onPress={handleSubmit}
                    loading={isSubmitting}
                />
            </ScrollView>
        </Screen>
    );
};

export default HelpSupportScreen;

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    brand: {
        alignItems: 'center',
        marginBottom: OFFSET.VERTICAL,
    },
    question: {
        marginBottom: OFFSET.POINT * 3,
    },
    options: {
        gap: OFFSET.POINT * 2,
        marginBottom: OFFSET.VERTICAL,
    },
    option: {
        minHeight: 48,
        justifyContent: 'center',
        borderRadius: OFFSET.POINT,
        paddingVertical: OFFSET.POINT * 2,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    label: {
        marginBottom: OFFSET.POINT,
    },
    attachments: {
        gap: OFFSET.POINT * 2,
        marginTop: OFFSET.VERTICAL,
    },
    attachmentRow: {
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: OFFSET.POINT * 2.5,
        borderRadius: OFFSET.POINT * 2,
    },
    attachmentName: {
        flex: 1,
        marginHorizontal: OFFSET.POINT * 2,
    },
    attachButton: {
        alignSelf: 'flex-start',
    },
    busy: {
        alignSelf: 'flex-start',
    },
    submit: {
        width: '30%',
        alignSelf: 'flex-end',
        marginTop: OFFSET.VERTICAL * 1.5,
    },
});
