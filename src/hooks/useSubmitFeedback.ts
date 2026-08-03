// outsource dependencies
import { useCallback } from 'react';

// local dependencies
import { MessageService } from 'services/messages';
import { buildFeedbackClientInfo } from 'utils/feedbackContext';
import { useSubmitFeedbackMutation } from 'store/api/feedbackApi';
import { FeedbackType, FeedbackAttachmentId, SubmitFeedbackRequest } from 'types/feedback';

interface SubmitFeedbackInput {
    text: string;
    type: FeedbackType;
    attachments: FeedbackAttachmentId[];
}

interface SubmitFeedbackOptions {
    onSuccess?: () => void;
}

/**
 * Submits feedback through RTK Query, attaching PHI-free device context.
 * Keeps business logic out of the screen.
 */
export const useSubmitFeedback = () => {
    const [submitFeedback, { isLoading }] = useSubmitFeedbackMutation();

    const submit = useCallback(
        async (input: SubmitFeedbackInput, options?: SubmitFeedbackOptions) => {
            const payload: SubmitFeedbackRequest = {
                type: input.type,
                text: input.text.trim(),
                attachments: input.attachments,
                clientInfo: buildFeedbackClientInfo(),
            };

            try {
                await submitFeedback(payload).unwrap();
                MessageService.toastSuccess('Thanks for your feedback!');
                options?.onSuccess?.();
            } catch (error) {
                MessageService.error({
                    title: 'Feedback Error',
                    uid: 'feedback-submit-error',
                    message: 'Failed to submit feedback. Please try again.',
                });
            }
        },
        [submitFeedback],
    );

    return { submit, isSubmitting: isLoading };
};
