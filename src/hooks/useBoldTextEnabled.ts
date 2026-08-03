// outsource dependencies
import { useSyncExternalStore } from 'react';
import { AccessibilityInfo, AppState, Platform } from 'react-native';

// iOS-only accessibility setting: Android exposes neither `isBoldTextEnabled` nor the
// `boldTextChanged` event, so on Android this hook is a stable `false`.
const isIOS = Platform.OS === 'ios';

// Module-level store: a SINGLE OS listener is shared by every component that subscribes,
// instead of one listener per <Text> (the shared Text renders in ~150 places).
let boldTextEnabled = false;
let initialized = false;
let subscription: { remove: () => void } | null = null;
let appStateSub: { remove: () => void } | null = null;
const listeners = new Set<() => void>();

const setEnabled = (value: boolean) => {
    if (value === boldTextEnabled) { return; }
    boldTextEnabled = value;
    listeners.forEach(listener => listener());
};

// Re-read the current value. `boldTextChanged` (like Dynamic Type events) is delivered
// unreliably while the app is backgrounded, so we also re-check on AppState 'active'.
const refresh = () => {
    if (!isIOS) { return; }
    AccessibilityInfo.isBoldTextEnabled()
        .then(setEnabled)
        .catch(() => {});
};

const subscribe = (listener: () => void) => {
    if (!isIOS) { return () => {}; }
    if (!initialized) {
        initialized = true;
        refresh();
    }
    listeners.add(listener);
    if (!subscription) {
        subscription = AccessibilityInfo.addEventListener('boldTextChanged', setEnabled);
    }
    if (!appStateSub) {
        appStateSub = AppState.addEventListener('change', state => {
            if (state === 'active') { refresh(); }
        });
    }
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
            subscription?.remove();
            subscription = null;
            appStateSub?.remove();
            appStateSub = null;
        }
    };
};

const getSnapshot = () => boldTextEnabled;

// Returns whether the OS "Bold Text" accessibility setting is on (iOS), reactively.
export const useBoldTextEnabled = (): boolean => useSyncExternalStore(subscribe, getSnapshot);

export default useBoldTextEnabled;
