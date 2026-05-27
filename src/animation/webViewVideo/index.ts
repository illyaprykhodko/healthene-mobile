export {
    getVideoAssetPath,
    preloadVideoAssets,
    VIDEO_EXT,
    VIDEO_MIME,
} from './assets';

export {
    BIRD_NORMAL_CLIP_STYLE,
    BIRD_TALL_CLIP_NAMES,
    BIRD_TALL_CLIP_STYLE,
    BRANCH_ANDROID_CLIP_STYLE,
    BRANCH_APPEARING_CLIP_STYLE,
    BRANCH_SITTING_CLIP_STYLE,
    buildBirdCheckClipStyleJs,
    buildBirdNormalClipStyleJs,
    buildBranchAppearingClipStyleJs,
    buildBranchSittingClipStyleJs,
    getBranchAppearingClipStyle,
    getBranchSittingClipStyle,
    buildClipStyleJs,
    buildClipStyleJsForInactive,
    getBirdCheckClipStyle,
    type ClipVideoStyle,
} from './clipStyles';

export { createDualVideoWebViewHtml, type DualVideoWebViewHtmlOptions } from './html';

export {
    buildResumeActiveScript,
    buildSeekActiveToStartScript,
    buildSetMutedScript,
    buildSwapClipScript,
    injectSwapClip,
    type SwapClipScriptOptions,
} from './inject';

export {
    isDomReadyMessage,
    parseWebViewVideoMessage,
    WEBVIEW_VIDEO_MESSAGE,
    type WebViewVideoEndedMessage,
} from './messages';

export { useWebViewVideoPlayer, type SwapClipParams, type UseWebViewVideoPlayerOptions } from './useWebViewVideoPlayer';

export { createWebViewVideoCommonProps } from './webViewProps';
