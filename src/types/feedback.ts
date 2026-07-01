// Feedback domain types — shared by the Give Feedback screen, the submit hook and feedbackApi.

export type FeedbackType = 'ISSUE' | 'FEATURE_REQUEST' | 'GENERAL';

export type FeedbackMediaType = 'photo' | 'video';

/**
 * PHI-free, non-identifying technical context attached to a feedback submission to help
 * support triage. The patient is identified server-side via the auth token, so no PII/PHI
 * (name, email, patientId, persistent device id) is collected here. See CLAUDE.md §Security.
 */
export interface FeedbackClientContext {
    source: string;
    locale: string;
    platform: string;
    timezone: string;
    osVersion: string;
    appVersion: string;
    buildNumber: string;
    deviceModel: string;
    environment?: string;
}

/** Reference to a file already uploaded to S3 (see s3ServiceApi.uploadAttachment). */
export interface FeedbackAttachmentRef {
    url: string;
    fileName?: string;
    mediaType: FeedbackMediaType;
}

export interface SubmitFeedbackRequest {
    message: string;
    type: FeedbackType;
    attachments: FeedbackAttachmentRef[];
    clientContext: FeedbackClientContext;
}

export interface SubmitFeedbackResponse {
    id: string;
}
