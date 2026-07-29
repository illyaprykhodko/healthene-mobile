// local dependencies
import { FeedbackType } from 'types/feedback';

// Hard cap on the free-text feedback message. A limit message appears only once this cap is hit
// (see HelpSupportScreen); maxLength prevents typing past it. Lower temporarily to test.
// Client-side choice: the API declares `text` as required but sets no maxLength.
export const FEEDBACK_MESSAGE_MAX = 2000;

// Max number of file attachments a user can add to one feedback submission.
export const FEEDBACK_MAX_ATTACHMENTS = 3;

// Default feedback type pre-selected on open ("Report an Issue" is highlighted in the Figma design).
export const DEFAULT_FEEDBACK_TYPE: FeedbackType = 'REPORT_AN_ISSUE';

// `maxLength` per field on ClientInfoDto. Values are clamped before sending (see
// utils/feedbackContext) so an unusually long locale or device model cannot fail the whole
// submission with a validation error.
export const FEEDBACK_CLIENT_INFO_LIMITS = {
    locale: 20,
    timeZone: 60,
    osVersion: 50,
    appVersion: 50,
    buildNumber: 50,
    deviceModel: 100,
} as const;

// Labels are UI copy; values are the backend `type` enum — keep them in sync with the API.
export const FEEDBACK_TYPES: ReadonlyArray<{ value: FeedbackType; label: string }> = [
    { value: 'REPORT_AN_ISSUE', label: 'Report an Issue' },
    { value: 'FEATURE_REQUEST', label: 'Feature Request' },
    { value: 'GENERAL_FEEDBACK', label: 'General Feedback' },
];
