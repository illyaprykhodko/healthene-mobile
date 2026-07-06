// local dependencies
import { FeedbackType } from 'types/feedback';

// Hard cap on the free-text feedback message. A limit message appears only once this cap is hit
// (see HelpSupportScreen); maxLength prevents typing past it. Lower temporarily to test.
export const FEEDBACK_MESSAGE_MAX = 2000;

// Max number of file attachments a user can add to one feedback submission.
export const FEEDBACK_MAX_ATTACHMENTS = 3;

// Logical entry point reported in the client context for support triage.
export const FEEDBACK_SOURCE = 'HelpSupport';

// Default feedback type pre-selected on open ("Report an Issue" is highlighted in the Figma design).
export const DEFAULT_FEEDBACK_TYPE: FeedbackType = 'ISSUE';

// The backend feedback endpoint is not live yet. While this is `false`, useSubmitFeedback simulates
// success (no network call) so the UX can be demoed. Flip to `true` once the API is ready — see
// store/api/feedbackApi.ts (confirm the path/contract with the backend team first).
export const FEEDBACK_ENDPOINT_ENABLED = false;

export const FEEDBACK_TYPES: ReadonlyArray<{ value: FeedbackType; label: string }> = [
    { value: 'ISSUE', label: 'Report an Issue' },
    { value: 'FEATURE_REQUEST', label: 'Feature Request' },
    { value: 'GENERAL', label: 'General Feedback' },
];
