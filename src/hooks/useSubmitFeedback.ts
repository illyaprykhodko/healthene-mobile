// outsource dependencies
import { useCallback, useState } from 'react';

// local dependencies
import { MessageService } from 'services/messages';
import { FEEDBACK_ENDPOINT_ENABLED } from 'constants/feedback';
import { useSubmitFeedbackMutation } from 'store/api/feedbackApi';
import { buildFeedbackClientContext } from 'utils/feedbackContext';
import { FeedbackType, FeedbackAttachmentRef, SubmitFeedbackRequest } from 'types/feedback';

interface SubmitFeedbackInput {
    type: FeedbackType;
    message: string;
    attachments: FeedbackAttachmentRef[];
}

interface SubmitFeedbackOptions {
    onSuccess?: () => void;
}

/**
 * Submits feedback through RTK Query, attaching PHI-free device context. While the backend
 * endpoint is disabled (FEEDBACK_ENDPOINT_ENABLED=false) it simulates success so the flow can
 * be demoed without a live API. Keeps business logic out of the screen.
 */
export const useSubmitFeedback = () => {
    const [submitFeedback, { isLoading }] = useSubmitFeedbackMutation();
    const [isSimulating, setIsSimulating] = useState(false);

    const submit = useCallback(
        async (input: SubmitFeedbackInput, options?: SubmitFeedbackOptions) => {
            const payload: SubmitFeedbackRequest = {
                type: input.type,
                message: input.message.trim(),
                attachments: input.attachments,
                clientContext: buildFeedbackClientContext(),
            };

            try {
                if (FEEDBACK_ENDPOINT_ENABLED) {
                    await submitFeedback(payload).unwrap();
                } else {
                    // Backend not live yet — simulate a short round-trip so the UX can be demoed.
                    setIsSimulating(true);
                    await new Promise<void>(resolve => {
                        setTimeout(resolve, 600);
                    });
                }
                MessageService.toastSuccess('Thanks for your feedback!');
                options?.onSuccess?.();
            } catch (error) {
                MessageService.error({
                    title: 'Feedback Error',
                    uid: 'feedback-submit-error',
                    message: 'Failed to submit feedback. Please try again.',
                });
            } finally {
                setIsSimulating(false);
            }
        },
        [submitFeedback],
    );

    return { submit, isSubmitting: isLoading || isSimulating };
};
