// outsource dependencies
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

// local dependencies
import { FEEDBACK_CLIENT_INFO_LIMITS } from 'constants/feedback';
import { FeedbackClientInfo, FeedbackPlatform } from 'types/feedback';

// The API length-caps every ClientInfoDto field; clamp rather than risk failing the whole
// submission on a validation error for a value nobody reads closely anyway.
const clamp = (value: string, max: number): string => value.slice(0, max);

const resolvePlatform = (): FeedbackPlatform => (Platform.OS === 'ios' ? 'IOS' : 'ANDROID');

/**
 * Collect PHI-free, non-identifying technical context to help support triage feedback.
 * Deliberately excludes any PII/PHI and persistent device identifiers (e.g. getUniqueId) —
 * the patient is identified server-side via the auth token. See CLAUDE.md §Security & Privacy.
 */
export const buildFeedbackClientInfo = (): FeedbackClientInfo => {
    const resolved = Intl.DateTimeFormat().resolvedOptions();

    return {
        platform: resolvePlatform(),
        locale: clamp(resolved.locale || 'unknown', FEEDBACK_CLIENT_INFO_LIMITS.locale),
        timeZone: clamp(resolved.timeZone || 'unknown', FEEDBACK_CLIENT_INFO_LIMITS.timeZone),
        osVersion: clamp(DeviceInfo.getSystemVersion(), FEEDBACK_CLIENT_INFO_LIMITS.osVersion),
        appVersion: clamp(DeviceInfo.getVersion(), FEEDBACK_CLIENT_INFO_LIMITS.appVersion),
        buildNumber: clamp(DeviceInfo.getBuildNumber(), FEEDBACK_CLIENT_INFO_LIMITS.buildNumber),
        deviceModel: clamp(DeviceInfo.getModel(), FEEDBACK_CLIENT_INFO_LIMITS.deviceModel),
    };
};
