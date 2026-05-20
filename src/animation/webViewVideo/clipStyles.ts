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
    if (clipName && BIRD_TALL_CLIP_NAMES.has(clipName)) {
        return BIRD_TALL_CLIP_STYLE;
    }
    return BIRD_NORMAL_CLIP_STYLE;
}

export function buildBirdCheckClipStyleJs (clipName: string | null): string {
    return buildClipStyleJsForInactive(getBirdCheckClipStyle(clipName));
}

export function buildBirdNormalClipStyleJs (): string {
    return buildClipStyleJsForInactive(BIRD_NORMAL_CLIP_STYLE);
}

/** BranchBird: sitting clip shown at ~80×80 inside a 370×370 WebView (avoids WebView resize flicker). */
export const BRANCH_SITTING_CLIP_STYLE: ClipVideoStyle = {
    width: '80px',
    height: '80px',
    top: '290px',
    right: '4px',
    left: 'auto',
};

export function buildBranchSittingClipStyleJs (): string {
    return buildClipStyleJsForInactive(BRANCH_SITTING_CLIP_STYLE);
}

/** Full-viewport contain for tall clips at 370×370 (e.g. BranchBird APPEARING / check5). */
export const BRANCH_APPEARING_CLIP_STYLE: ClipVideoStyle = {
    width: '100%',
    height: '100%',
    top: '0',
    right: 'auto',
    left: '0',
};

export function buildBranchAppearingClipStyleJs (): string {
    return buildClipStyleJsForInactive(BRANCH_APPEARING_CLIP_STYLE);
}
