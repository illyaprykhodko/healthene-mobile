// outsource dependencies
import { useSyncExternalStore } from 'react';
import { AppState, Dimensions, PixelRatio } from 'react-native';

// Reactive OS font scale.
//
// `useWindowDimensions().fontScale` relies on `UIContentSizeCategoryDidChange`, which iOS
// delivers unreliably while the app is backgrounded — exactly the case when the user goes to
// Settings to change the text size and comes back (especially for the accessibility-size tier,
// where the change is often missed until a restart). We instead keep one module-level store
// and re-read `PixelRatio.getFontScale()` whenever the app returns to the foreground
// (`AppState` -> 'active') or dimensions change. The resulting re-render forces native <Text>
// shadow views to re-read the current Dynamic Type category, so size + lineHeight update live.
let current = PixelRatio.getFontScale();
let appStateSub: { remove: () => void } | null = null;
let dimensionsSub: { remove: () => void } | null = null;
const listeners = new Set<() => void>();

const refresh = () => {
    const next = PixelRatio.getFontScale();
    if (next === current) { return; }
    current = next;
    listeners.forEach(listener => listener());
};

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    if (!appStateSub) {
        appStateSub = AppState.addEventListener('change', state => {
            if (state === 'active') { refresh(); }
        });
    }
    if (!dimensionsSub) {
        dimensionsSub = Dimensions.addEventListener('change', refresh);
    }
    // Catch any change that happened before this component subscribed.
    refresh();
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
            appStateSub?.remove();
            appStateSub = null;
            dimensionsSub?.remove();
            dimensionsSub = null;
        }
    };
};

const getSnapshot = () => current;

// Returns the current OS font scale, refreshed on foreground / dimension change.
export const useFontScale = (): number => useSyncExternalStore(subscribe, getSnapshot);

export default useFontScale;
