// outsource dependencies
import { WebView } from 'react-native-webview';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WebViewMessageEvent } from 'react-native-webview/src/WebViewTypes.ts';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';

// local dependencies
import {
    injectSwapClip,
    preloadVideoAssets,
    buildSetMutedScript,
    buildResumeActiveScript,
    buildBirdCheckClipStyleJs,
    buildBirdNormalClipStyleJs,
    createDualVideoWebViewHtml,
    buildSeekActiveToStartScript,
    createWebViewVideoCommonProps,
} from './webViewVideo';

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
        right: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.right,
        containerTop: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.top,
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
// ANIMATION PHASES
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
    [BirdAnimationPhase.ACTION]: { width: 200, height: 400 },
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

const LOOPED_PHASES: BirdAnimationPhase[] = [BirdAnimationPhase.SITTING];

export const WEBVIEW_MESSAGES = {
    VIDEO_ENDED: 'VIDEO_ENDED',
    DOM_READY_MAIN: 'BIRD_DOM_READY_MAIN',
    DOM_READY_ACTION: 'BIRD_DOM_READY_ACTION',
    ACTION_FIRST_FRAME: 'BIRD_ACTION_FIRST_FRAME',
};

interface BirdAnimationProps {
    muted?: boolean;
    allChecked: boolean;
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
}: BirdAnimationProps) => {
    const mainWebViewRef = useRef<WebView>(null);
    const actionWebViewRef = useRef<WebView>(null);
    const [phase, setPhase] = useState<BirdAnimationPhase>(BirdAnimationPhase.APPEARING);
    const [activeCheckClipName, setActiveCheckClipName] = useState<string | null>(null);
    const [mainDOMReady, setMainDOMReady] = useState(false);
    const [actionDOMReady, setActionDOMReady] = useState(false);
    const [mainWebViewGeneration, setMainWebViewGeneration] = useState(0);
    const [actionWebViewGeneration, setActionWebViewGeneration] = useState(0);
    const [videosLoaded, setVideosLoaded] = useState(false);
    const [actionFirstFrameRendered, setActionFirstFrameRendered] = useState(false);
    const [videoCache, setVideoCache] = useState<Map<BirdAnimationPhase, string>>(new Map());
    const [checkVideoCache, setCheckVideoCache] = useState<Map<string, string>>(new Map());

    const isAnimationComplete = useRef(false);
    const allCheckedRef = useRef(allChecked);
    const phaseRef = useRef(phase);
    const lastCheckTriggerConsumed = useRef(0);
    const deferredCheckTriggerWhileAppearingRef = useRef(0);
    const playDeferredCheckAfterFirstSittingLoopRef = useRef(false);
    const sittingLoopRestartInWebViewRef = useRef(true);
    const screenFocusedRef = useRef(true);
    const videosLoadedRef = useRef(false);
    const activeCheckClipNameRef = useRef<string | null>(null);
    const lastMainSwapKeyRef = useRef('');
    const lastActionSwapKeyRef = useRef('');
    const lastCheckSwapKeyRef = useRef('');

    const mainHtml = useMemo(
        () => createDualVideoWebViewHtml({
            domReadyMessage: WEBVIEW_MESSAGES.DOM_READY_MAIN,
            width: VIDEO_SIZE,
            height: VIDEO_SIZE,
        }),
        [],
    );

    const actionHtml = useMemo(
        () => createDualVideoWebViewHtml({
            domReadyMessage: WEBVIEW_MESSAGES.DOM_READY_ACTION,
            width: VIDEO_SIZE_CONFIG[BirdAnimationPhase.ACTION].width,
            height: VIDEO_SIZE_CONFIG[BirdAnimationPhase.ACTION].height,
        }),
        [],
    );

    useEffect(() => {
        allCheckedRef.current = allChecked;
    }, [allChecked]);

    useLayoutEffect(() => {
        phaseRef.current = phase;
        lastMainSwapKeyRef.current = '';
        lastActionSwapKeyRef.current = '';
    }, [phase]);

    useLayoutEffect(() => {
        lastCheckSwapKeyRef.current = '';
    }, [activeCheckClipName]);

    useEffect(() => {
        checkTriggerPropRef.current = checkTrigger;
    }, [checkTrigger]);

    const checkTriggerPropRef = useRef(checkTrigger);

    const mutedRef = useRef(muted);
    useEffect(() => { mutedRef.current = muted; }, [muted]);

    useEffect(() => { videosLoadedRef.current = videosLoaded; }, [videosLoaded]);
    useEffect(() => { activeCheckClipNameRef.current = activeCheckClipName; }, [activeCheckClipName]);

    useEffect(() => {
        if (!screenFocusedRef.current) {
            return;
        }
        mainWebViewRef.current?.injectJavaScript(buildSetMutedScript(muted));
        actionWebViewRef.current?.injectJavaScript(buildSetMutedScript(muted));
    }, [muted]);

    useEffect(() => {
        const phaseClipNames = Object.values(BirdAnimationPhase)
            .filter(p => p !== BirdAnimationPhase.FINISHED && p !== BirdAnimationPhase.CHECK)
            .map(p => PHASE_VIDEO_MAP[p as BirdAnimationPhase])
            .filter((name): name is string => name !== null);
        const checkClipNames = BIRD_CHECK_VIDEO_CLIPS.map(c => c.name);
        const allNames = [...new Set([...phaseClipNames, ...checkClipNames])];

        (async () => {
            const loaded = await preloadVideoAssets(allNames);
            const cache = new Map<BirdAnimationPhase, string>();
            for (const [p, clipName] of Object.entries(PHASE_VIDEO_MAP) as [BirdAnimationPhase, string | null][]) {
                if (clipName && loaded.has(clipName)) {
                    cache.set(p, loaded.get(clipName)!);
                }
            }
            const checkCache = new Map<string, string>();
            for (const clip of BIRD_CHECK_VIDEO_CLIPS) {
                const b64 = loaded.get(clip.name);
                if (b64) {
                    checkCache.set(clip.name, b64);
                }
            }
            setVideoCache(cache);
            setCheckVideoCache(checkCache);
            setVideosLoaded(true);
        })();
    }, []);

    const swapPhaseClip = useCallback(
        (
            targetPhase: BirdAnimationPhase,
            ref: RefObject<WebView | null>,
            resumeSittingInsideWebview: boolean = true,
        ) => {
            const base64 = videoCache.get(targetPhase);
            if (!base64 || !ref.current) {
                return;
            }

            const resumeLoopInPage
                = targetPhase === BirdAnimationPhase.SITTING && resumeSittingInsideWebview;
            const isMainWebView = targetPhase !== BirdAnimationPhase.ACTION;
            const clipStyleJs = isMainWebView ? buildBirdNormalClipStyleJs() : '';
            const afterSwapPlainMessage = targetPhase === BirdAnimationPhase.ACTION
                ? WEBVIEW_MESSAGES.ACTION_FIRST_FRAME
                : undefined;

            const swapKey = `${targetPhase}-${resumeSittingInsideWebview}`;
            const lastKeyRef = ref === actionWebViewRef ? lastActionSwapKeyRef : lastMainSwapKeyRef;
            if (lastKeyRef.current === swapKey) {
                return;
            }
            lastKeyRef.current = swapKey;

            injectSwapClip(ref, {
                base64,
                clipStyleJs,
                afterSwapPlainMessage,
                phaseTag: targetPhase,
                muted: mutedRef.current,
                loopInPage: resumeLoopInPage,
                postEnded: !resumeLoopInPage,
                endedMessageType: WEBVIEW_MESSAGES.VIDEO_ENDED,
            });
        },
        [videoCache],
    );

    const swapCheckClip = useCallback(
        (clipName: string, ref: RefObject<WebView | null>) => {
            const base64 = checkVideoCache.get(clipName);
            if (!base64 || !ref.current) {
                return;
            }

            const swapKey = clipName;
            if (lastCheckSwapKeyRef.current === swapKey) {
                return;
            }
            lastCheckSwapKeyRef.current = swapKey;

            injectSwapClip(ref, {
                base64,
                postEnded: true,
                muted: mutedRef.current,
                phaseTag: BirdAnimationPhase.CHECK,
                endedMessageType: WEBVIEW_MESSAGES.VIDEO_ENDED,
                clipStyleJs: buildBirdCheckClipStyleJs(clipName),
            });
        },
        [checkVideoCache],
    );

    useFocusEffect(
        useCallback(() => {
            screenFocusedRef.current = true;
            mainWebViewRef.current?.injectJavaScript(buildSetMutedScript(mutedRef.current));
            actionWebViewRef.current?.injectJavaScript(buildSetMutedScript(mutedRef.current));
            mainWebViewRef.current?.injectJavaScript(buildResumeActiveScript());
            actionWebViewRef.current?.injectJavaScript(buildResumeActiveScript());
            return () => { screenFocusedRef.current = false; };
        }, []),
    );

    useEffect(() => {
        if (!videosLoaded || phase === BirdAnimationPhase.FINISHED) {
            return;
        }
        if (phase === BirdAnimationPhase.ACTION) {
            setActionFirstFrameRendered(false);
            if (actionDOMReady) {
                swapPhaseClip(BirdAnimationPhase.ACTION, actionWebViewRef);
            }
        } else if (phase === BirdAnimationPhase.CHECK) {
            if (mainDOMReady && activeCheckClipName) {
                swapCheckClip(activeCheckClipName, mainWebViewRef);
            }
        } else if (mainDOMReady) {
            if (
                playDeferredCheckAfterFirstSittingLoopRef.current
                && deferredCheckTriggerWhileAppearingRef.current <= 0
            ) {
                playDeferredCheckAfterFirstSittingLoopRef.current = false;
            }
            const sittingReloopInWebView
                = phase !== BirdAnimationPhase.SITTING
                || !(
                    playDeferredCheckAfterFirstSittingLoopRef.current
                    && deferredCheckTriggerWhileAppearingRef.current > 0
                );
            sittingLoopRestartInWebViewRef.current = sittingReloopInWebView;
            swapPhaseClip(phase, mainWebViewRef, sittingReloopInWebView);
        }
    }, [
        phase,
        mainDOMReady,
        videosLoaded,
        swapPhaseClip,
        swapCheckClip,
        actionDOMReady,
        activeCheckClipName,
        mainWebViewGeneration,
        actionWebViewGeneration,
    ]);

    useEffect(() => {
        if (checkTrigger <= 0 || !videosLoaded || allChecked) {
            return;
        }
        const current = phaseRef.current;
        if (checkTrigger === lastCheckTriggerConsumed.current) {
            return;
        }
        if (
            playDeferredCheckAfterFirstSittingLoopRef.current
            && deferredCheckTriggerWhileAppearingRef.current > 0
            && current === BirdAnimationPhase.SITTING
        ) {
            if (checkTrigger <= deferredCheckTriggerWhileAppearingRef.current) {
                return;
            }
            playDeferredCheckAfterFirstSittingLoopRef.current = false;
            deferredCheckTriggerWhileAppearingRef.current = 0;
        }
        if (current === BirdAnimationPhase.APPEARING) {
            deferredCheckTriggerWhileAppearingRef.current = Math.max(
                deferredCheckTriggerWhileAppearingRef.current,
                checkTrigger,
            );
            return;
        }
        if (current !== BirdAnimationPhase.SITTING && current !== BirdAnimationPhase.CHECK) {
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
                if (endedPhase !== undefined && endedPhase !== currentPhase) {
                    return;
                }
                const isLoopedPhase = LOOPED_PHASES.includes(currentPhase);

                if (isLoopedPhase) {
                    if (
                        currentPhase === BirdAnimationPhase.SITTING
                        && playDeferredCheckAfterFirstSittingLoopRef.current
                    ) {
                        playDeferredCheckAfterFirstSittingLoopRef.current = false;
                        const dTrigger = deferredCheckTriggerWhileAppearingRef.current;
                        deferredCheckTriggerWhileAppearingRef.current = 0;
                        if (dTrigger > 0) {
                            const latestTrigger = checkTriggerPropRef.current;
                            lastCheckTriggerConsumed.current = Math.max(dTrigger, latestTrigger);
                            setActiveCheckClipName(pickRandomCheckClipName());
                            phaseRef.current = BirdAnimationPhase.CHECK;
                            setPhase(BirdAnimationPhase.CHECK);
                            return;
                        }
                    }
                    mainWebViewRef.current?.injectJavaScript(buildSeekActiveToStartScript());
                } else {
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
                                    : BirdAnimationPhase.SITTING,
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
            if (message === WEBVIEW_MESSAGES.DOM_READY_MAIN) {
                lastMainSwapKeyRef.current = '';
                setMainWebViewGeneration(g => g + 1);
                setMainDOMReady(true);
            } else if (message === WEBVIEW_MESSAGES.DOM_READY_ACTION) {
                lastActionSwapKeyRef.current = '';
                setActionWebViewGeneration(g => g + 1);
                setActionDOMReady(true);
            } else if (message === WEBVIEW_MESSAGES.ACTION_FIRST_FRAME) {
                setActionFirstFrameRendered(true);
            }
        }
    }, []);

    if (phase === BirdAnimationPhase.FINISHED) {
        return null;
    }

    const showMain
        = phase === BirdAnimationPhase.APPEARING
        || phase === BirdAnimationPhase.SITTING
        || phase === BirdAnimationPhase.CHECK
        || (phase === BirdAnimationPhase.ACTION && !actionFirstFrameRendered);
    const showActionLayer = videosLoaded;
    const actionVisible = phase === BirdAnimationPhase.ACTION && actionFirstFrameRendered;

    const webViewCommonProps = createWebViewVideoCommonProps(handleMessage);

    // Keep RN container at SITTING position during CHECK/ACTION handoff — tall-clip crop is WebView-only.
    const holdMainAtSittingLayout
        = (phase === BirdAnimationPhase.ACTION && !actionFirstFrameRendered)
        || phase === BirdAnimationPhase.CHECK;
    const mainContainerTop = holdMainAtSittingLayout
        ? CONTAINER_TOP_CONFIG[BirdAnimationPhase.SITTING]
        : CONTAINER_TOP_CONFIG[phase];
    const mainViewRight = holdMainAtSittingLayout
        ? ANIMATED_VIEW_RIGHT_CONFIG[BirdAnimationPhase.SITTING]
        : ANIMATED_VIEW_RIGHT_CONFIG[phase];

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
                        <View style={{ width: VIDEO_SIZE, height: VIDEO_SIZE }}>
                            <WebView
                                ref={mainWebViewRef}
                                {...webViewCommonProps}
                                source={{ html: mainHtml }}
                                style={{
                                    backgroundColor: 'transparent',
                                    width: VIDEO_SIZE,
                                    height: VIDEO_SIZE,
                                }}
                            />
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
                        { top: CONTAINER_TOP_CONFIG[BirdAnimationPhase.ACTION], right: -1 },
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
                            source={{ html: actionHtml }}
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
