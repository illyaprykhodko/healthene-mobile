// Feedback domain types — shared by the Give Feedback screen, the submit hook and feedbackApi.
// Mirrors `CreatePatientFeedbackDto` from the Patient Feedback API
// (POST /patient-service/patients/me/feedback).

/** `type` enum of CreatePatientFeedbackDto. Required by the backend. */
export type FeedbackType = 'FEATURE_REQUEST' | 'GENERAL_FEEDBACK' | 'REPORT_AN_ISSUE';

/**
 * `clientInfo.platform` enum. The backend declares four values; these are the two this app can
 * report — derived from `Platform.OS`, which is only ever `ios` or `android` here.
 */
export type FeedbackPlatform = 'IOS' | 'ANDROID';

/** Local-only discriminator used to pick an attachment row icon. Not part of the API contract. */
export type FeedbackMediaType = 'photo' | 'video';

/**
 * `ClientInfoDto`. PHI-free, non-identifying technical context attached to a submission to help
 * support triage. The patient is identified server-side via the auth token, so no PII/PHI
 * (name, email, patientId, persistent device id) is collected here. See CLAUDE.md §Security.
 *
 * Every field is length-capped by the backend; see FEEDBACK_CLIENT_INFO_LIMITS.
 */
export interface FeedbackClientInfo {
    locale: string;
    timeZone: string;
    osVersion: string;
    appVersion: string;
    buildNumber: string;
    deviceModel: string;
    platform: FeedbackPlatform;
}

/**
 * `IdDto` — a reference to a file already uploaded through s3ServiceApi.uploadAttachment.
 * The API takes the numeric attachment id, not a URL.
 */
export interface FeedbackAttachmentId {
    id: number;
}

export interface SubmitFeedbackRequest {
    /** Required. Free-text body of the feedback. */
    text: string;
    /** Required. */
    type: FeedbackType;
    attachments: FeedbackAttachmentId[];
    clientInfo: FeedbackClientInfo;
}

/**
 * Response of createFeedback. Only `id` is consumed today — the rest is typed loosely on purpose:
 * `status` is a backend-owned enum this client does not act on, and the echoed `attachments` are a
 * deep graph (category / medicalTerm / foodCategory) the app has no use for. Narrow these if a
 * feedback history screen ever needs them.
 */
export interface SubmitFeedbackResponse {
    id: number;
    text: string;
    status: string;
    type: FeedbackType;
    createdDate: string;
    attachments?: unknown[];
}
