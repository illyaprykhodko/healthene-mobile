// outsource dependencies
import { useCallback, useMemo } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import ReactNativeHapticFeedback, { HapticFeedbackTypes } from 'react-native-haptic-feedback';

// Reduce Motion is the closest standard accessibility signal for "don't add extra physical noise".
// Apple's HIG explicitly recommends respecting it for haptics.
// We sample it lazily on each haptic call so a mid-session toggle takes effect immediately.
const isReduceMotionEnabled = (): Promise<boolean> => AccessibilityInfo.isReduceMotionEnabled();

const HAPTIC_OPTIONS = {
    enableVibrateFallback: false, // No long phone-buzz if Taptic Engine is unavailable — silence is preferred.
    ignoreAndroidSystemSettings: false, // Respect user's "Vibrate on touch" system toggle.
};

// Semantic names → underlying RNHF trigger type per platform.
// iOS uses UIImpactFeedbackGenerator / UINotificationFeedbackGenerator.
// Android uses HapticFeedbackConstants (different vibration patterns).
const HAPTIC_MAP: Record<string, HapticFeedbackTypes> = {
    light: Platform.select({ ios: 'impactLight', android: 'effectTick' }) as HapticFeedbackTypes,
    medium: Platform.select({ ios: 'impactMedium', android: 'effectClick' }) as HapticFeedbackTypes,
    heavy: Platform.select({ ios: 'impactHeavy', android: 'effectHeavyClick' }) as HapticFeedbackTypes,

    selection: Platform.select({ ios: 'selection', android: 'clockTick' }) as HapticFeedbackTypes,
    error: Platform.select({ ios: 'notificationError', android: 'effectHeavyClick' }) as HapticFeedbackTypes,
    warning: Platform.select({ ios: 'notificationWarning', android: 'effectHeavyClick' }) as HapticFeedbackTypes,
    success: Platform.select({ ios: 'notificationSuccess', android: 'effectDoubleClick' }) as HapticFeedbackTypes,
};

const trigger = async (type: keyof typeof HAPTIC_MAP) => {
    try {
        if (await isReduceMotionEnabled()) {
            return;
        }
        ReactNativeHapticFeedback.trigger(HAPTIC_MAP[type], HAPTIC_OPTIONS);
    } catch {
        // Haptics are non-essential — never throw into UI code.
    }
};

export type HapticType = keyof typeof HAPTIC_MAP;

export const useHaptic = (): Record<HapticType, () => void> => {
    const light = useCallback(() => { void trigger('light'); }, []);
    const heavy = useCallback(() => { void trigger('heavy'); }, []);
    const error = useCallback(() => { void trigger('error'); }, []);
    const medium = useCallback(() => { void trigger('medium'); }, []);
    const success = useCallback(() => { void trigger('success'); }, []);
    const warning = useCallback(() => { void trigger('warning'); }, []);
    const selection = useCallback(() => { void trigger('selection'); }, []);

    return useMemo(
        () => ({ light, medium, heavy, success, warning, error, selection }),
        [light, medium, heavy, success, warning, error, selection]
    );
};
