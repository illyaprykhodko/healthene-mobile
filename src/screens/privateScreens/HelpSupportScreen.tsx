// outsource dependencies
import * as Sentry from '@sentry/react-native';
import React, { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/fontawesome5';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput as RNTextInput, View } from 'react-native';

// local dependencies
import { config } from 'constants';
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
import StackHeader from 'components/StackHeader';
import { MessageService } from 'services/messages';
import { MAX_FONT_SCALE } from 'constants/typography';
import { IconLogo, TextLogo } from 'components/TextLogo';
import { useSubmitFeedback } from 'hooks/useSubmitFeedback';
import { FeedbackMediaType, FeedbackType } from 'types/feedback';
import { buildAttachmentFormData } from 'utils/attachment/attachmentFormData';
import { captureMedia, pickMediaFromLibrary, PickedMedia } from 'services/image-picker';
import { useDeleteFileMutation, useUploadAttachmentMutation } from 'store/api/s3ServiceApi';
import {
    FEEDBACK_TYPES,
    FEEDBACK_MESSAGE_MAX,
    DEFAULT_FEEDBACK_TYPE,
    FEEDBACK_MAX_ATTACHMENTS,
} from 'constants/feedback';

// Height of the free-text box. Also drives the keyboard offset below, so the two cannot drift.
const MESSAGE_BOX_MIN_HEIGHT = 140;

/**
 * `bottomOffset` is the gap between the keyboard and the *caret*, not the bottom of the field.
 * The caret starts on the first line of a tall multiline box, so a small offset leaves most of the
 * box under the keyboard. Offsetting by the box height lifts the whole field into view.
 */
const KEYBOARD_BOTTOM_OFFSET = MESSAGE_BOX_MIN_HEIGHT + OFFSET.HORIZONTAL;

/**
 * A file already uploaded to S3. Only `id` goes to the feedback API; `url` is kept because
 * deleteFile addresses files by url, and `fileName`/`mediaType` drive the attachment row.
 */
interface FeedbackAttachmentItem {
    id: number;
    url: string;
    fileName?: string;
    mediaType: FeedbackMediaType;
}

/**
 * Turn an RTK Query rejection (or a thrown picker error) into something diagnosable. Shown to the
 * user only in DEBUG builds — a raw HTTP status is noise for a patient, but guessing blind at an
 * upload failure is worse. Production keeps the generic copy and reports to Sentry instead.
 */
const describeAttachError = (error: unknown): string => {
    const errObj = error as {
        message?: string;
        status?: number | string;
        data?: { errorMessage?: string; message?: string };
    };
    const detail = errObj?.data?.errorMessage || errObj?.data?.message || errObj?.message;

    return [errObj?.status && `HTTP ${errObj.status}`, detail].filter(Boolean).join(' — ') || 'unknown error';
};

const reportAttachFailure = (error: unknown, stage: 'pick' | 'upload') => {
    Sentry.captureException(error, { tags: { feature: 'feedback-attachment', stage } });
    MessageService.toastWarning(
        config.DEBUG
            ? `Attach failed (${stage}): ${describeAttachError(error)}`
            : 'Could not attach the file. Please try again.',
    );
};

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

    const atLimit = message.length >= FEEDBACK_MESSAGE_MAX;
    const canSubmit = !!message.trim() && !isSubmitting && !isBusy;

    const uploadPicked = useCallback(
        async (picked: PickedMedia) => {
            setIsBusy(true);
            try {
                const body = buildAttachmentFormData(picked, {
                    title: picked.name,
                    description: `Feedback attachment (${picked.kind})`,
                });
                const uploaded = await uploadAttachment({ body }).unwrap();
                const fallbackUrl = `${config.serviceUrl}/${config.apiPath}/s3-service/attachment/${uploaded.id}`;
                const url = uploaded.url || fallbackUrl;
                const mediaType: FeedbackMediaType = (uploaded.mimeType || picked.mimeType).startsWith('video')
                    ? 'video'
                    : 'photo';
                setAttachments(current => [
                    ...current,
                    { id: uploaded.id, url, mediaType, fileName: uploaded.fileName || picked.name },
                ]);
            } catch (error) {
                reportAttachFailure(error, 'upload');
            } finally {
                setIsBusy(false);
            }
        },
        [uploadAttachment],
    );

    const handleAttach = useCallback(() => {
        if (attachments.length >= FEEDBACK_MAX_ATTACHMENTS) {
            MessageService.toastWarning(`You can attach up to ${FEEDBACK_MAX_ATTACHMENTS} files.`);
            return;
        }
        // The pickers resolve to `undefined` when the user backs out or denies permission (they
        // surface that themselves), so only a real failure reaches the catch.
        const runPicker = async (picker: () => Promise<PickedMedia | undefined>) => {
            try {
                const picked = await picker();
                if (picked) {
                    await uploadPicked(picked);
                }
            } catch (error) {
                reportAttachFailure(error, 'pick');
            }
        };

        Alert.alert('Attach photo or video', 'Choose where to take it from', [
            {
                text: 'Photo Library',
                onPress: () => {
                    void runPicker(pickMediaFromLibrary);
                },
            },
            {
                text: 'Take a Photo',
                onPress: () => {
                    void runPicker(() => captureMedia('photo'));
                },
            },
            {
                text: 'Record a Video',
                onPress: () => {
                    void runPicker(() => captureMedia('video'));
                },
            },
            {
                text: 'Cancel',
                style: 'cancel',
            },
        ]);
    }, [attachments.length, uploadPicked]);

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

    // This screen is a Drawer.Screen, so navigating away does not unmount it and the local state
    // survives. Without an explicit reset the next visit still shows the text that was just sent.
    const resetForm = useCallback(() => {
        setMessage('');
        setAttachments([]);
        setType(DEFAULT_FEEDBACK_TYPE);
    }, []);

    const handleSubmit = useCallback(() => {
        // The API references attachments by their uploaded id, not by url.
        const attachmentIds = attachments.map(({ id }) => ({ id }));
        submit(
            { type, text: message, attachments: attachmentIds },
            {
                onSuccess: () => {
                    resetForm();
                    navigation.goBack();
                },
            },
        );
    }, [attachments, message, type, submit, navigation, resetForm]);

    return (
        <Screen initialized style={styles.screen}>
            <StackHeader
                title="Give Feedback"
                onBack={() => navigation.goBack()}
                onOpenDrawer={() => navigation.openDrawer?.()}
            />
            <KeyboardAwareScrollView
                style={styles.scroll}
                keyboardShouldPersistTaps="handled"
                bottomOffset={KEYBOARD_BOTTOM_OFFSET}
                contentContainerStyle={styles.content}
            >
                <View style={styles.brand}>
                    <View style={styles.brandInner}>
                        <View style={styles.brandIcon}>
                            <IconLogo style={styles.iconSize} disabled />
                        </View>
                        <TextLogo size={40} color={theme.colors.primary} />
                    </View>
                </View>

                <Text variant="h4" color={theme.colors.text} style={styles.question}>
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

                <Text variant="h4" color={theme.colors.text} style={styles.label}>
                    Please share your feedback
                </Text>
                <View
                    style={[
                        styles.messageBox,
                        { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
                    ]}
                >
                    <RNTextInput
                        multiline
                        value={message}
                        textAlignVertical="top"
                        onChangeText={setMessage}
                        maxLength={FEEDBACK_MESSAGE_MAX}
                        selectionColor={theme.colors.info}
                        placeholder="Share your feedback..."
                        maxFontSizeMultiplier={MAX_FONT_SCALE}
                        placeholderTextColor={theme.colors.textSecondary}
                        style={[styles.messageInput, { color: theme.colors.text }]}
                    />
                </View>
                {atLimit && (
                    <Text variant="caption" style={styles.counter} color={theme.colors.error}>
                        You've reached the {FEEDBACK_MESSAGE_MAX}-character limit.
                    </Text>
                )}

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
            </KeyboardAwareScrollView>

            <View style={styles.footer}>
                <Button
                    title="Done"
                    disabled={!canSubmit}
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    style={[
                        styles.submit,
                        {
                            borderColor: canSubmit ? theme.colors.successAlt : theme.colors.textMuted,
                            backgroundColor: canSubmit ? theme.colors.successAlt : 'transparent',
                        },
                    ]}
                    textStyle={StyleSheet.flatten([
                        styles.submitText,
                        { color: canSubmit ? theme.colors.successAltText : theme.colors.textMuted },
                    ])}
                />
            </View>
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
        marginBottom: OFFSET.VERTICAL * 2,
    },
    brandInner: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandIcon: {
        top: 0,
        bottom: 0,
        position: 'absolute',
        justifyContent: 'center',
        left: -(50 + OFFSET.POINT * 3),
    },
    question: {
        fontSize: 22,
        marginBottom: OFFSET.VERTICAL * 1.5,
    },
    options: {
        gap: OFFSET.POINT * 3,
        marginBottom: OFFSET.VERTICAL * 2,
    },
    option: {
        minHeight: 48,
        justifyContent: 'center',
        borderRadius: OFFSET.POINT,
        paddingVertical: OFFSET.POINT * 2,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    label: {
        fontSize: 22,
        marginBottom: OFFSET.POINT * 2,
    },
    messageBox: {
        borderWidth: 1,
        padding: OFFSET.POINT * 2,
        borderRadius: OFFSET.POINT * 2,
        minHeight: MESSAGE_BOX_MIN_HEIGHT,
    },
    messageInput: {
        flex: 1,
        padding: 0,
        fontSize: 16,
        minHeight: 132,
    },
    counter: {
        marginTop: OFFSET.POINT,
        alignSelf: 'flex-end',
    },
    attachments: {
        gap: OFFSET.POINT * 2,
        marginTop: OFFSET.VERTICAL * 1.5,
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
    footer: {
        paddingTop: OFFSET.POINT * 2,
        paddingBottom: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    submit: {
        width: '90%',
        borderWidth: 2,
        borderRadius: 30,
        alignSelf: 'center',
    },
    submitText: {
        fontSize: 16,
    },
    iconSize: {
        width: 50,
        height: 50
    }
});
