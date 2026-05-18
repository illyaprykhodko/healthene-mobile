// outsource dependencies
import { WebView } from 'react-native-webview';
import RNBlobUtil from 'react-native-blob-util';
import { Platform, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WebViewMessageEvent } from 'react-native-webview/src/WebViewTypes.ts';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

// local dependencies

// ============================================================================
// PLATFORM ASSET RESOLUTION
// ============================================================================
// iOS ships .mov in the app bundle (Xcode Resources phase); Android ships .webm
// inside android/app/src/main/assets/videos/ which Gradle auto-bundles into the APK.
const VIDEO_EXT = Platform.OS === 'ios' ? 'mov' : 'webm';
const VIDEO_MIME = Platform.OS === 'ios' ? 'video/quicktime' : 'video/webm';

function getVideoAssetPath (name: string): string {
    return Platform.OS === 'ios'
        ? `${RNBlobUtil.fs.dirs.MainBundleDir}/${name}.${VIDEO_EXT}`
        : `bundle-assets://videos/${name}.${VIDEO_EXT}`;
}

// ============================================================================
// CONFIGURABLE CONSTANTS
// ============================================================================

export const VIDEO_SIZE = 80;

export const BIRD_ANIMATION_CONFIG = {
    INITIAL_POSITION: {
        top: 46,
        right: -3,
    },
    ACTION_POSITION: {
        top: 13,
        right: 0,
    },
};

/**
 * One entry per check clip: logical name (no extension) + on-screen layout box and container position.
 * Real file is resolved per-platform via {@link getVideoAssetPath}.
 * width/height are the visible footprint; the WebView always draws at VIDEO_SIZE and scales up (iOS-friendly).
 */
export type BirdCheckClipConfig = {
    name: string;
    width: number;
    height: number;
    containerTop: number;
    right: number;
};

export const BIRD_CHECK_VIDEO_CLIPS: BirdCheckClipConfig[] = [
    {
        name: 'check1',
        width: VIDEO_SIZE,
        height: VIDEO_SIZE,
        containerTop: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.top,
        right: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.right,
    },
    {
        name: 'check2',
        width: VIDEO_SIZE,
        height: VIDEO_SIZE,
        containerTop: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.top,
        right: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.right,
    },
    {
        name: 'check3',
        width: VIDEO_SIZE,
        height: VIDEO_SIZE,
        containerTop: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.top,
        right: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.right,
    },
    {
        name: 'check4',
        width: VIDEO_SIZE + 10,
        height: VIDEO_SIZE + 10,
        containerTop: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.top - 6,
        right: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.right,
    },
    {
        name: 'check5',
        width: VIDEO_SIZE,
        height: VIDEO_SIZE,
        containerTop: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.top,
        right: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.right,
    },
];

function getCheckClipLayout (name: string | null): BirdCheckClipConfig | null {
    if (!name) {
        return null;
    }
    return BIRD_CHECK_VIDEO_CLIPS.find(c => c.name === name) ?? null;
}

// ============================================================================
// ANIMATION PHASES: appearing → sitting (loop) → action (single clip) → finished
// ============================================================================
export const BirdAnimationPhase = {
    APPEARING: 'APPEARING',
    SITTING: 'SITTING',
    CHECK: 'CHECK',
    ACTION: 'ACTION',
    FINISHED: 'FINISHED',
} as const;

export type BirdAnimationPhase = (typeof BirdAnimationPhase)[keyof typeof BirdAnimationPhase];

export const VIDEO_SIZE_CONFIG: Record<BirdAnimationPhase, { width: number; height: number }> = {
    [BirdAnimationPhase.APPEARING]: { width: VIDEO_SIZE, height: VIDEO_SIZE },
    [BirdAnimationPhase.SITTING]: { width: VIDEO_SIZE, height: VIDEO_SIZE },
    [BirdAnimationPhase.CHECK]: { width: VIDEO_SIZE, height: VIDEO_SIZE },
    [BirdAnimationPhase.ACTION]: { width: 200, height: 400, },
    [BirdAnimationPhase.FINISHED]: { width: 0, height: 0 },
};

export const CONTAINER_TOP_CONFIG: Record<BirdAnimationPhase, number> = {
    [BirdAnimationPhase.APPEARING]: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.top,
    [BirdAnimationPhase.SITTING]: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.top,
    [BirdAnimationPhase.CHECK]: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.top,
    [BirdAnimationPhase.ACTION]: BIRD_ANIMATION_CONFIG.ACTION_POSITION.top,
    [BirdAnimationPhase.FINISHED]: 0,
};

export const ANIMATED_VIEW_RIGHT_CONFIG: Record<BirdAnimationPhase, number> = {
    [BirdAnimationPhase.APPEARING]: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.right,
    [BirdAnimationPhase.SITTING]: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.right,
    [BirdAnimationPhase.CHECK]: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.right,
    [BirdAnimationPhase.ACTION]: BIRD_ANIMATION_CONFIG.ACTION_POSITION.right,
    [BirdAnimationPhase.FINISHED]: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.right,
};

const PHASE_VIDEO_MAP: Record<BirdAnimationPhase, string | null> = {
    [BirdAnimationPhase.APPEARING]: 'appearing',
    [BirdAnimationPhase.SITTING]: 'sitting',
    [BirdAnimationPhase.CHECK]: null,
    [BirdAnimationPhase.ACTION]: 'single',
    [BirdAnimationPhase.FINISHED]: null,
};

/** Phases whose WebView `VIDEO_ENDED` is handled in the "looped" branch (seek+replay) instead of the phase switch. */
const LOOPED_PHASES: BirdAnimationPhase[] = [BirdAnimationPhase.SITTING];

export const WEBVIEW_MESSAGES = {
    VIDEO_LOADED: 'VIDEO_LOADED',
    VIDEO_FAILED: 'VIDEO_FAILED',
    VIDEO_ENDED: 'VIDEO_ENDED',
    DOM_READY_MAIN: 'BIRD_DOM_READY_MAIN',
    DOM_READY_ACTION: 'BIRD_DOM_READY_ACTION',
};

function createBirdWebViewHtml (domReadyMessage: string): string {
    return `
        <html>
            <head>
                <meta name="viewport" content="width=device-width, maximum-scale=1.0, user-scalable=no">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    html, body { width: 100%; height: 100%; background: transparent; overflow: visible; }
                    #videoContainer { position: relative; width: 100%; height: 100%; overflow: visible; }
                    video {
                        position: absolute;
                        top: 0; left: 0;
                        width: 100%; height: 100%;
                        object-fit: contain;
                    }
                </style>
                <script>
                    document.addEventListener("DOMContentLoaded", function() {
                        var va = document.getElementById("video-a");
                        var vb = document.getElementById("video-b");
                        va.style.opacity = "1";
                        va.style.zIndex = "2";
                        vb.style.opacity = "0";
                        vb.style.zIndex = "1";
                        window.__ACTIVE = va;
                        window.__INACTIVE = vb;
                        window.__VIDEO__ = va;
                        window.ReactNativeWebView.postMessage("${domReadyMessage}");
                    });
                </script>
            </head>
            <body>
                <div id="videoContainer">
                    <video
                        id="video-a"
                        playsinline
                        onerror="window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${WEBVIEW_MESSAGES.VIDEO_FAILED}' }))"
                        onloadeddata="window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${WEBVIEW_MESSAGES.VIDEO_LOADED}' }))"
                    ></video>
                    <video id="video-b" playsinline></video>
                </div>
            </body>
        </html>
    `;
}

interface BirdAnimationProps {
    muted?: boolean;
    allChecked: boolean;
    /** Increment when the user marks an item done while some items remain incomplete (Edit meal list). */
    checkTrigger?: number;
    checkboxAreaX?: number;
}

function pickRandomCheckClipName (): string {
    const clips = BIRD_CHECK_VIDEO_CLIPS;
    if (clips.length === 0) {
        return 'check1';
    }
    return clips[Math.floor(Math.random() * clips.length)].name;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const BirdAnimation = ({
    muted = false,
    allChecked = false,
    checkTrigger = 0,
    checkboxAreaX = 0,
}: BirdAnimationProps) => {
    const mainWebViewRef = useRef<WebView>(null);
    const actionWebViewRef = useRef<WebView>(null);
    const [phase, setPhase] = useState<BirdAnimationPhase>(BirdAnimationPhase.APPEARING);
    const [activeCheckClipName, setActiveCheckClipName] = useState<string | null>(null);
    const [mainDOMReady, setMainDOMReady] = useState<boolean>(false);
    const [actionDOMReady, setActionDOMReady] = useState<boolean>(false);
    const [videosLoaded, setVideosLoaded] = useState<boolean>(false);
    const [videoCache, setVideoCache] = useState<Map<BirdAnimationPhase, string>>(new Map());
    const [checkVideoCache, setCheckVideoCache] = useState<Map<string, string>>(new Map());
    const isAnimationComplete = useRef<boolean>(false);
    const allCheckedRef = useRef(allChecked);
    const phaseRef = useRef(phase);
    /** `checkTrigger` values already applied to CHECK (stops the check effect from firing twice for the same bump). */
    const lastCheckTriggerConsumed = useRef(0);
    /** Max `checkTrigger` observed during APPEARING; CHECK is deferred until the first SITTING clip has played once. */
    const deferredCheckTriggerWhileAppearingRef = useRef(0);
    /** True while we wait for that first SITTING `onended` → RN `VIDEO_ENDED` before playing deferred CHECK. */
    const playDeferredCheckAfterFirstSittingLoopRef = useRef(false);
    /** Mirrors inject: normal SITTING loops in the WebView; deferred first SITTING posts `VIDEO_ENDED` to RN for deferred CHECK. */
    const sittingLoopRestartInWebViewRef = useRef(true);

    useEffect(() => {
        allCheckedRef.current = allChecked;
    }, [allChecked]);

    // Keep `phaseRef` aligned before paint so native `onMessage` handlers never read a stale phase (guardDrop / transitions).
    useLayoutEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    /** Read inside `onMessage` when merging deferred and latest `checkTrigger` — hooks cannot run there. */
    const checkTriggerPropRef = useRef(checkTrigger);
    useEffect(() => {
        checkTriggerPropRef.current = checkTrigger;
    }, [checkTrigger]);

    const mutedRef = useRef(muted);
    useEffect(() => { mutedRef.current = muted; }, [muted]);

    const screenFocusedRef = useRef(true);
    const videosLoadedRef = useRef(false);
    const activeCheckClipNameRef = useRef<string | null>(null);
    useEffect(() => { videosLoadedRef.current = videosLoaded; }, [videosLoaded]);
    useEffect(() => { activeCheckClipNameRef.current = activeCheckClipName; }, [activeCheckClipName]);

    useEffect(() => {
        if (!screenFocusedRef.current) { return; }
        const js = `(function(){
            if(window.__ACTIVE) { window.__ACTIVE.muted = ${muted ? 'true' : 'false'}; }
            if(window.__INACTIVE) { window.__INACTIVE.muted = ${muted ? 'true' : 'false'}; }
            true;
        })();`;
        mainWebViewRef.current?.injectJavaScript(js);
        actionWebViewRef.current?.injectJavaScript(js);
    }, [muted]);

    useEffect(() => {
        const preloadAllVideos = async () => {
            const cache = new Map<BirdAnimationPhase, string>();
            const checkCache = new Map<string, string>();
            const phases = Object.values(BirdAnimationPhase).filter(
                p => p !== BirdAnimationPhase.FINISHED && p !== BirdAnimationPhase.CHECK
            ) as BirdAnimationPhase[];

            for (const p of phases) {
                const clipName = PHASE_VIDEO_MAP[p];
                if (clipName) {
                    try {
                        const base64 = await RNBlobUtil.fs.readFile(
                            getVideoAssetPath(clipName),
                            'base64'
                        );
                        cache.set(p, base64);
                    } catch (error) {
                        console.error(`Error loading video for phase ${p}:`, error);
                    }
                }
            }

            for (const clip of BIRD_CHECK_VIDEO_CLIPS) {
                try {
                    const base64 = await RNBlobUtil.fs.readFile(
                        getVideoAssetPath(clip.name),
                        'base64'
                    );
                    checkCache.set(clip.name, base64);
                } catch (error) {
                    console.error(`Error loading check clip ${clip.name}:`, error);
                }
            }

            setVideoCache(cache);
            setCheckVideoCache(checkCache);
            setVideosLoaded(true);
        };

        preloadAllVideos();
    }, []);

    /**
     * Loads a phase clip into the WebView. For SITTING, `resumeSittingInsideWebview` false = single play + `postBirdEnded`
     * (deferred-check path); true = in-page loop (seek 0 on `ended`, no RN message per lap).
     * Uses double-buffer: loads into __INACTIVE, swaps on `canplay` so no blank frame is visible.
     */
    const injectVideo = useCallback(
        (
            targetPhase: BirdAnimationPhase,
            ref: RefObject<WebView | null>,
            resumeSittingInsideWebview: boolean = true
        ) => {
            const base64 = videoCache.get(targetPhase);
            if (!base64 || !ref.current) {
                return;
            }

            const resumeLoopInPage
                = targetPhase === BirdAnimationPhase.SITTING && resumeSittingInsideWebview;

            ref.current.injectJavaScript(`
            (function() {
                try {
                    if (!window.__ACTIVE || !window.__INACTIVE) { true; return; }
                    var active = window.__ACTIVE;
                    var inactive = window.__INACTIVE;

                    window.__injectGen = (window.__injectGen || 0) + 1;
                    var myGen = window.__injectGen;

                    if (window.__birdSitNearEnd) {
                        active.removeEventListener("timeupdate", window.__birdSitNearEnd);
                        inactive.removeEventListener("timeupdate", window.__birdSitNearEnd);
                        active.removeEventListener("seeked", window.__birdSitSeeked);
                        inactive.removeEventListener("seeked", window.__birdSitSeeked);
                        window.__birdSitNearEnd = null;
                        window.__birdSitSeeked = null;
                    }

                    var phaseTag = "${targetPhase}";
                    var resumeLoopInPage = ${resumeLoopInPage ? 'true' : 'false'};
                    var isSitting = phaseTag === "${BirdAnimationPhase.SITTING}";

                    function postBirdEnded() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: "${WEBVIEW_MESSAGES.VIDEO_ENDED}",
                            phase: phaseTag
                        }));
                    }

                    inactive.loop = false;
                    inactive.removeAttribute("loop");
                    inactive.onended = null;
                    inactive.muted = ${mutedRef.current ? 'true' : 'false'};
                    inactive.style.transform = "none";
                    inactive.style.transformOrigin = "center";
                    inactive.style.objectFit = "contain";

                    // WKWebView often ignores HTML5 loop; loop sitting via onended seek+play instead.
                    if (isSitting && resumeLoopInPage) {
                        inactive.onended = function() {
                            try { inactive.currentTime = 0; inactive.play(); } catch(e) {}
                        };
                    } else {
                        inactive.onended = function() { postBirdEnded(); };
                    }

                    inactive.src = "data:${VIDEO_MIME};base64,${base64}";
                    inactive.load();

                    function onCanPlay() {
                        inactive.removeEventListener("canplay", onCanPlay);
                        if (window.__injectGen !== myGen) { return; }
                        var nextActive = inactive;
                        var nextInactive = active;
                        requestAnimationFrame(function() {
                            nextInactive.style.opacity = "0";
                            nextInactive.style.zIndex = "1";
                            nextInactive.pause();
                            nextInactive.onended = null;

                            nextActive.style.opacity = "1";
                            nextActive.style.zIndex = "2";

                            window.__ACTIVE = nextActive;
                            window.__INACTIVE = nextInactive;
                            window.__VIDEO__ = nextActive;
                        });
                    }
                    inactive.addEventListener("canplay", onCanPlay);
                    inactive.play();
                } catch (e) {
                    console.log("Inject error", e);
                }
                true;
            })();
        `);
        },
        [videoCache]
    );

    const injectCheckClip = useCallback(
        (clipName: string, ref: RefObject<WebView | null>) => {
            const base64 = checkVideoCache.get(clipName);
            if (!base64 || !ref.current) {
                return;
            }

            const phaseTag = BirdAnimationPhase.CHECK;
            ref.current.injectJavaScript(`
            (function() {
                try {
                    if (!window.__ACTIVE || !window.__INACTIVE) { true; return; }
                    var active = window.__ACTIVE;
                    var inactive = window.__INACTIVE;

                    window.__injectGen = (window.__injectGen || 0) + 1;
                    var myGen = window.__injectGen;

                    inactive.loop = false;
                    inactive.removeAttribute("loop");
                    inactive.onended = null;
                    inactive.muted = ${mutedRef.current ? 'true' : 'false'};
                    inactive.style.transform = "none";
                    inactive.style.transformOrigin = "center";
                    inactive.style.objectFit = "contain";

                    var phaseTag = "${phaseTag}";
                    inactive.onended = function() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: "${WEBVIEW_MESSAGES.VIDEO_ENDED}",
                            phase: phaseTag
                        }));
                    };

                    inactive.src = "data:${VIDEO_MIME};base64,${base64}";
                    inactive.load();

                    function onCanPlay() {
                        inactive.removeEventListener("canplay", onCanPlay);
                        if (window.__injectGen !== myGen) { return; }
                        var nextActive = inactive;
                        var nextInactive = active;
                        requestAnimationFrame(function() {
                            nextInactive.style.opacity = "0";
                            nextInactive.style.zIndex = "1";
                            nextInactive.pause();
                            nextInactive.onended = null;

                            nextActive.style.opacity = "1";
                            nextActive.style.zIndex = "2";

                            window.__ACTIVE = nextActive;
                            window.__INACTIVE = nextInactive;
                            window.__VIDEO__ = nextActive;
                        });
                    }
                    inactive.addEventListener("canplay", onCanPlay);
                    inactive.play();
                } catch (e) {
                    console.log("Inject check error", e);
                }
                true;
            })();
        `);
        },
        [checkVideoCache]
    );

    useFocusEffect(
        useCallback(() => {
            screenFocusedRef.current = true;
            if (videosLoadedRef.current) {
                const currentPhase = phaseRef.current;
                if (currentPhase !== BirdAnimationPhase.FINISHED) {
                    if (currentPhase === BirdAnimationPhase.CHECK && activeCheckClipNameRef.current) {
                        injectCheckClip(activeCheckClipNameRef.current, mainWebViewRef);
                    } else if (currentPhase === BirdAnimationPhase.ACTION) {
                        injectVideo(BirdAnimationPhase.ACTION, actionWebViewRef);
                    } else {
                        injectVideo(currentPhase, mainWebViewRef, sittingLoopRestartInWebViewRef.current);
                    }
                }
            }
            return () => { screenFocusedRef.current = false; };
        }, [injectVideo, injectCheckClip])
    );

    useEffect(() => {
        if (!videosLoaded || phase === BirdAnimationPhase.FINISHED) {
            return;
        }
        if (phase === BirdAnimationPhase.ACTION) {
            if (actionDOMReady) {
                injectVideo(BirdAnimationPhase.ACTION, actionWebViewRef);
            }
        } else if (phase === BirdAnimationPhase.CHECK) {
            if (mainDOMReady && activeCheckClipName) {
                injectCheckClip(activeCheckClipName, mainWebViewRef);
            }
        } else if (mainDOMReady) {
            // If deferred state was partially cleared, do not leave `playDeferred` stuck true (would block the check-trigger effect forever).
            if (
                playDeferredCheckAfterFirstSittingLoopRef.current
                && deferredCheckTriggerWhileAppearingRef.current <= 0
            ) {
                playDeferredCheckAfterFirstSittingLoopRef.current = false;
            }
            // First SITTING after a deferred APPEARING tick: one full play without in-page loop (`false`); later SITTING: loop (`true`).
            const sittingReloopInWebView
                = phase !== BirdAnimationPhase.SITTING
                || !(
                    playDeferredCheckAfterFirstSittingLoopRef.current
                    && deferredCheckTriggerWhileAppearingRef.current > 0
                );
            sittingLoopRestartInWebViewRef.current = sittingReloopInWebView;
            injectVideo(phase, mainWebViewRef, sittingReloopInWebView);
        }
    }, [
        phase,
        mainDOMReady,
        actionDOMReady,
        videosLoaded,
        injectVideo,
        injectCheckClip,
        activeCheckClipName,
    ]);

    // Parent bumps `checkTrigger` when a meal item is marked done while the list is still incomplete → CHECK clip.
    useEffect(() => {
        if (checkTrigger <= 0 || !videosLoaded || allChecked) {
            return;
        }
        const current = phaseRef.current;
        const alreadyConsumed = checkTrigger === lastCheckTriggerConsumed.current;
        if (alreadyConsumed) {
            return;
        }
        if (
            playDeferredCheckAfterFirstSittingLoopRef.current
            && deferredCheckTriggerWhileAppearingRef.current > 0
            && current === BirdAnimationPhase.SITTING
        ) {
            // Still waiting the first SITTING `ended` for the deferred APPEARING tick — block only while trigger ≤ deferred.
            // Newer list checkboxes bump `checkTrigger` higher; allow CHECK immediately instead of starving until that first end.
            if (checkTrigger <= deferredCheckTriggerWhileAppearingRef.current) {
                return;
            }
            playDeferredCheckAfterFirstSittingLoopRef.current = false;
            deferredCheckTriggerWhileAppearingRef.current = 0;
        }
        if (current === BirdAnimationPhase.APPEARING) {
            // Remember the request; CHECK runs after APPEARING → SITTING and the deferred first `ended` (or via branch above).
            deferredCheckTriggerWhileAppearingRef.current = Math.max(
                deferredCheckTriggerWhileAppearingRef.current,
                checkTrigger
            );
            return;
        }
        if (current !== BirdAnimationPhase.SITTING && current !== BirdAnimationPhase.CHECK) {
            // e.g. ACTION — consume so the same trigger does not fire later from a stale queue.
            lastCheckTriggerConsumed.current = checkTrigger;
            return;
        }
        playDeferredCheckAfterFirstSittingLoopRef.current = false;
        deferredCheckTriggerWhileAppearingRef.current = 0;
        lastCheckTriggerConsumed.current = checkTrigger;
        setActiveCheckClipName(pickRandomCheckClipName());
        phaseRef.current = BirdAnimationPhase.CHECK;
        setPhase(BirdAnimationPhase.CHECK);
    }, [checkTrigger, videosLoaded, allChecked]);

    // When every item is done, jump to ACTION as soon as we are in a "main bird" phase (including mid-CHECK).
    useEffect(() => {
        if (
            !allChecked
            || isAnimationComplete.current
            || (
                phase !== BirdAnimationPhase.SITTING
                && phase !== BirdAnimationPhase.APPEARING
                && phase !== BirdAnimationPhase.CHECK
            )
        ) {
            return;
        }
        setPhase(BirdAnimationPhase.ACTION);
    }, [allChecked, phase]);

    const handleMessage = useCallback((event: WebViewMessageEvent) => {
        const message = event.nativeEvent.data;

        if (message.startsWith('[WEBVIEW LOG]')) {
            return;
        }

        try {
            const data = JSON.parse(message);

            if (data.type === WEBVIEW_MESSAGES.VIDEO_ENDED) {
                const currentPhase = phaseRef.current;
                const endedPhase = data.phase as BirdAnimationPhase | undefined;
                // Drop stale messages (e.g. CHECK ended after we already moved to SITTING — same webview, queued events).
                const guardDrop = endedPhase !== undefined && endedPhase !== currentPhase;
                if (guardDrop) {
                    return;
                }
                const isLoopedPhase = LOOPED_PHASES.includes(currentPhase);

                if (isLoopedPhase) {
                    // Deferred first SITTING: one `ended` → play CHECK and consume triggers up to max(deferred, latest).
                    if (
                        currentPhase === BirdAnimationPhase.SITTING
                        && playDeferredCheckAfterFirstSittingLoopRef.current
                    ) {
                        playDeferredCheckAfterFirstSittingLoopRef.current = false;
                        const dTrigger = deferredCheckTriggerWhileAppearingRef.current;
                        deferredCheckTriggerWhileAppearingRef.current = 0;
                        if (dTrigger > 0) {
                            const latestTrigger = checkTriggerPropRef.current;
                            const consumeThrough = Math.max(dTrigger, latestTrigger);
                            lastCheckTriggerConsumed.current = consumeThrough;
                            setActiveCheckClipName(pickRandomCheckClipName());
                            phaseRef.current = BirdAnimationPhase.CHECK;
                            setPhase(BirdAnimationPhase.CHECK);
                            return;
                        }
                        // `dTrigger === 0`: fall through — RN seek+play restarts SITTING so the WebView never freezes.
                    }
                    // Non-deferred SITTING should not reach here (in-page loop). Path kept for any stray `VIDEO_ENDED`.
                    mainWebViewRef.current?.injectJavaScript(`
                        (function() {
                            if (window.__VIDEO__) {
                                window.__VIDEO__.currentTime = 0;
                                window.__VIDEO__.play();
                            }
                            true;
                        })();
                    `);
                } else {
                    // Non-looped phases: use `endedPhase` from the webview when present so CHECK/APPEARING transitions stay correct.
                    const phaseForTransition = endedPhase ?? currentPhase;
                    switch (phaseForTransition) {
                        case BirdAnimationPhase.APPEARING: {
                            const next = allCheckedRef.current
                                ? BirdAnimationPhase.ACTION
                                : BirdAnimationPhase.SITTING;
                            phaseRef.current = next;
                            setPhase(next);
                            if (next === BirdAnimationPhase.ACTION) {
                                deferredCheckTriggerWhileAppearingRef.current = 0;
                                playDeferredCheckAfterFirstSittingLoopRef.current = false;
                            } else if (deferredCheckTriggerWhileAppearingRef.current > 0) {
                                // Next inject will use single-play SITTING so we get one `ended` for deferred CHECK.
                                playDeferredCheckAfterFirstSittingLoopRef.current = true;
                            } else {
                                playDeferredCheckAfterFirstSittingLoopRef.current = false;
                            }
                            break;
                        }
                        case BirdAnimationPhase.CHECK:
                            if (!allCheckedRef.current) {
                                setActiveCheckClipName(null);
                                phaseRef.current = BirdAnimationPhase.SITTING;
                                playDeferredCheckAfterFirstSittingLoopRef.current = false;
                                deferredCheckTriggerWhileAppearingRef.current = 0;
                            } else {
                                phaseRef.current = BirdAnimationPhase.ACTION;
                                playDeferredCheckAfterFirstSittingLoopRef.current = false;
                                deferredCheckTriggerWhileAppearingRef.current = 0;
                            }
                            setPhase(
                                allCheckedRef.current
                                    ? BirdAnimationPhase.ACTION
                                    : BirdAnimationPhase.SITTING
                            );
                            break;
                        case BirdAnimationPhase.ACTION:
                            setPhase(BirdAnimationPhase.FINISHED);
                            isAnimationComplete.current = true;
                            break;
                        default:
                            break;
                    }
                }
            }
        } catch {
            // DOM ready pings are plain strings, not JSON — ignore other parse failures silently.
            if (message === WEBVIEW_MESSAGES.DOM_READY_MAIN) {
                setMainDOMReady(true);
            } else if (message === WEBVIEW_MESSAGES.DOM_READY_ACTION) {
                setActionDOMReady(true);
            }
        }
    }, []);

    if (phase === BirdAnimationPhase.FINISHED) {
        return null;
    }

    const showMain
        = phase === BirdAnimationPhase.APPEARING
        || phase === BirdAnimationPhase.SITTING
        || phase === BirdAnimationPhase.CHECK;
    const showActionLayer = videosLoaded;
    const actionVisible = phase === BirdAnimationPhase.ACTION;

    const webViewCommonProps = {
        incognito: true,
        cacheEnabled: false,
        onMessage: handleMessage,
        cacheMode: 'LOAD_NO_CACHE' as const,
        onError: (_e: unknown) => {},
        allowsInlineMediaPlayback: true,
        mediaPlaybackRequiresUserAction: false,
        javaScriptEnabled: true,
        originWhitelist: ['*'],
    };

    const checkLayout = phase === BirdAnimationPhase.CHECK
        ? getCheckClipLayout(activeCheckClipName)
        : null;
    /** Layout box on screen (can be larger than the WebView render size below). */
    const mainLayoutWidth = checkLayout?.width ?? VIDEO_SIZE_CONFIG[phase].width;
    const mainLayoutHeight = checkLayout?.height ?? VIDEO_SIZE_CONFIG[phase].height;
    const mainContainerTop = checkLayout?.containerTop ?? CONTAINER_TOP_CONFIG[phase];
    const mainViewRight = checkLayout?.right ?? ANIMATED_VIEW_RIGHT_CONFIG[phase];
    /**
     * WKWebView is unreliable at very large explicit sizes; CHECK clips always render at VIDEO_SIZE
     * and scale up so width/height in BIRD_CHECK_VIDEO_CLIPS remain the on-screen footprint.
     */
    const checkPhaseUsesScaledWebView = phase === BirdAnimationPhase.CHECK && Boolean(checkLayout);
    const webViewRenderW = checkPhaseUsesScaledWebView ? VIDEO_SIZE : mainLayoutWidth;
    const webViewRenderH = checkPhaseUsesScaledWebView ? VIDEO_SIZE : mainLayoutHeight;
    const checkScaleX = checkLayout ? checkLayout.width / VIDEO_SIZE : 1;
    const checkScaleY = checkLayout ? checkLayout.height / VIDEO_SIZE : 1;

    const mainBirdOuterWrapStyle = checkPhaseUsesScaledWebView && checkLayout
        ? {
            width: mainLayoutWidth,
            height: mainLayoutHeight,
            overflow: 'visible' as const,
        }
        : {};
    /**
     * Only CHECK uses bottom-right anchoring + scale (transform origin). APPEARING/SITTING must
     * stay top-aligned inside the top+bottom-stretched parent — a blanket `bottom: 0` lifted them.
     */
    const mainBirdInnerWrapStyle = checkPhaseUsesScaledWebView && checkLayout
        ? {
            position: 'absolute' as const,
            right: 0,
            bottom: 0,
            width: VIDEO_SIZE,
            height: VIDEO_SIZE,
            transformOrigin: '100% 100%' as const,
            transform: [
                { scaleX: checkScaleX },
                { scaleY: checkScaleY },
            ],
        }
        : {
            width: webViewRenderW,
            height: webViewRenderH,
        };

    const mainWebView = (
        <WebView
            ref={mainWebViewRef}
            {...webViewCommonProps}
            source={{ html: createBirdWebViewHtml(WEBVIEW_MESSAGES.DOM_READY_MAIN) }}
            style={{
                backgroundColor: 'transparent',
                width: webViewRenderW,
                height: webViewRenderH,
            }}
        />
    );

    return (
        <View style={styles.birdRoot} key="bird-animation">
            {showMain && (
                <View
                    style={[
                        styles.container,
                        styles.layerMain,
                        styles.containerGrounded,
                        { top: mainContainerTop, right: -1 },
                    ]}
                >
                    <View style={{ position: 'absolute', right: mainViewRight }}>
                        {/*
                         * Stable parent chain so CHECK↔SITTING does not remount the native WebView.
                         */}
                        <View style={mainBirdOuterWrapStyle}>
                            <View style={mainBirdInnerWrapStyle}>
                                {mainWebView}
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {showActionLayer && (
                <View
                    style={[
                        styles.container,
                        styles.containerGrounded,
                        styles.layerAction,
                        {
                            top: CONTAINER_TOP_CONFIG[BirdAnimationPhase.ACTION],
                            right: -1,
                        },
                    ]}
                >
                    <View
                        style={{
                            position: 'absolute',
                            right: ANIMATED_VIEW_RIGHT_CONFIG[BirdAnimationPhase.ACTION],
                        }}
                    >
                        <WebView
                            ref={actionWebViewRef}
                            {...webViewCommonProps}
                            source={{ html: createBirdWebViewHtml(WEBVIEW_MESSAGES.DOM_READY_ACTION) }}
                            style={{
                                backgroundColor: 'transparent',
                                width: VIDEO_SIZE_CONFIG[BirdAnimationPhase.ACTION].width,
                                height: VIDEO_SIZE_CONFIG[BirdAnimationPhase.ACTION].height,
                                opacity: actionVisible ? 1 : 0,
                            }}
                        />
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    birdRoot: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 19999997,
        pointerEvents: 'none',
    },
    container: {
        position: 'absolute',
        pointerEvents: 'none',
    },
    // Together with `top` on the layer, this stretches the overlay vertically; do not bottom-anchor the WebView itself (see mainBirdInnerWrapStyle).
    containerGrounded: {
        bottom: 0,
        left: 0,
    },
    layerMain: {
        zIndex: 2,
    },
    layerAction: {
        zIndex: 1,
    },
});
