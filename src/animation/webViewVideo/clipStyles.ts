import { Platform } from 'react-native';

export type ClipVideoStyle = {
    width: string;
    height: string;
    top: string;
    left: string;
    right: string;
};

/** Applies absolute positioning/sizing to the inactive video element before swap. */
export function buildClipStyleJs (targetVar: string, style: ClipVideoStyle): string {
    return [
        `${targetVar}.style.width = "${style.width}";`,
        `${targetVar}.style.height = "${style.height}";`,
        `${targetVar}.style.top = "${style.top}";`,
        `${targetVar}.style.left = "${style.left}";`,
        `${targetVar}.style.right = "${style.right}";`,
    ].join('\n                    ');
}

export function buildClipStyleJsForInactive (style: ClipVideoStyle): string {
    return buildClipStyleJs('inactive', style);
}

// BirdAnimation: 80×80 viewport — tall check clips (1080×1920) cropped to the bird region.
export const BIRD_TALL_CLIP_NAMES: ReadonlySet<string> = new Set([
    'check2', 'check3', 'check4', 'check5',
]);

export const BIRD_NORMAL_CLIP_STYLE: ClipVideoStyle = {
    width: '100%',
    height: '100%',
    top: '0',
    right: 'auto',
    left: '0',
};

export const BIRD_TALL_CLIP_STYLE: ClipVideoStyle = {
    width: '205px',
    height: '365px',
    top: '-13px',
    right: '2px',
    left: 'auto',
};

export function getBirdCheckClipStyle (clipName: string | null): ClipVideoStyle {
    const isTall = !!(clipName && BIRD_TALL_CLIP_NAMES.has(clipName));
    // Android .webm clips are ~360×400 — iOS tall crop (205×365) overflows the 80×80 viewport.
    if (Platform.OS === 'android' || !isTall) {
        return BIRD_NORMAL_CLIP_STYLE;
    }
    return BIRD_TALL_CLIP_STYLE;
}

export function buildBirdCheckClipStyleJs (clipName: string | null): string {
    return buildClipStyleJsForInactive(getBirdCheckClipStyle(clipName));
}

export function buildBirdNormalClipStyleJs (): string {
    return buildClipStyleJsForInactive(BIRD_NORMAL_CLIP_STYLE);
}

/** BranchBird iOS: sitting ~80×80 in 370×370 WebView — top-aligned like legacy 80×80 WebView at SITTING container. */
export const BRANCH_SITTING_CLIP_STYLE: ClipVideoStyle = {
    width: '80px',
    height: '80px',
    top: '0',
    right: '4px',
    left: 'auto',
};

/** BranchBird iOS: full-viewport contain for tall .mov clips (1080×1920) at 370×370. */
export const BRANCH_APPEARING_CLIP_STYLE: ClipVideoStyle = {
    width: '100%',
    height: '100%',
    top: '0',
    right: 'auto',
    left: '0',
};

/** BranchBird Android: .webm assets are already ~360×400 — scale to the 80×80 viewport. */
export const BRANCH_ANDROID_CLIP_STYLE: ClipVideoStyle = {
    width: '100%',
    height: '100%',
    top: '0',
    right: 'auto',
    left: '0',
};

export function getBranchAppearingClipStyle (): ClipVideoStyle {
    return Platform.OS === 'ios' ? BRANCH_APPEARING_CLIP_STYLE : BRANCH_ANDROID_CLIP_STYLE;
}

export function getBranchSittingClipStyle (): ClipVideoStyle {
    return Platform.OS === 'ios' ? BRANCH_SITTING_CLIP_STYLE : BRANCH_ANDROID_CLIP_STYLE;
}

export function buildBranchSittingClipStyleJs (): string {
    return buildClipStyleJsForInactive(getBranchSittingClipStyle());
}

export function buildBranchAppearingClipStyleJs (): string {
    return buildClipStyleJsForInactive(getBranchAppearingClipStyle());
}
