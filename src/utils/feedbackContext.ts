// outsource dependencies
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

// local dependencies
import { config } from 'constants';
import { FEEDBACK_SOURCE } from 'constants/feedback';
import { FeedbackClientContext } from 'types/feedback';

/**
 * Collect PHI-free, non-identifying technical context to help support triage feedback.
 * Deliberately excludes any PII/PHI and persistent device identifiers (e.g. getUniqueId) —
 * the patient is identified server-side via the auth token. See CLAUDE.md §Security & Privacy.
 */
export const buildFeedbackClientContext = (): FeedbackClientContext => {
    const resolved = Intl.DateTimeFormat().resolvedOptions();

    return {
        platform: Platform.OS,
        source: FEEDBACK_SOURCE,
        environment: config.environment,
        deviceModel: DeviceInfo.getModel(),
        appVersion: DeviceInfo.getVersion(),
        locale: resolved.locale || 'unknown',
        osVersion: DeviceInfo.getSystemVersion(),
        buildNumber: DeviceInfo.getBuildNumber(),
        timezone: resolved.timeZone || 'unknown',
    };
};
