// outsource dependencies
import { WebView } from 'react-native-webview';
import RNBlobUtil from 'react-native-blob-util';
import { StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { WebViewMessageEvent } from 'react-native-webview/src/WebViewTypes.ts';

// local dependencies

// ============================================================================
// CONFIGURABLE CONSTANTS
// ============================================================================

export const VIDEO_SIZE = 80;

export const BIRD_ANIMATION_CONFIG = {
    INITIAL_POSITION: {
        top: 46,
        right: -3,
    },
    APPEARING_POSITION: {
        top: 33.5,
        right: -4,
    },
    ACTION_POSITION: {
        top: 0,
        right: 0,
    },
};

// ============================================================================
// ANIMATION PHASES: appearing → sitting (loop) → action (single.mov) → finished
// ============================================================================
export const BirdAnimationPhase = {
    APPEARING: 'APPEARING',
    SITTING: 'SITTING',
    ACTION: 'ACTION',
    FINISHED: 'FINISHED',
} as const;

export type BirdAnimationPhase = (typeof BirdAnimationPhase)[keyof typeof BirdAnimationPhase];

export const VIDEO_SIZE_CONFIG: Record<BirdAnimationPhase, { width: number; height: number }> = {
    [BirdAnimationPhase.APPEARING]: { width: VIDEO_SIZE + 92, height: VIDEO_SIZE + 92 },
    [BirdAnimationPhase.SITTING]: { width: VIDEO_SIZE - 4, height: VIDEO_SIZE - 4 },
    [BirdAnimationPhase.ACTION]: { width: 250, height: 500, },
    [BirdAnimationPhase.FINISHED]: { width: 0, height: 0 },
};

export const CONTAINER_TOP_CONFIG: Record<BirdAnimationPhase, number> = {
    [BirdAnimationPhase.APPEARING]: BIRD_ANIMATION_CONFIG.APPEARING_POSITION.top,
    [BirdAnimationPhase.SITTING]: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.top,
    [BirdAnimationPhase.ACTION]: BIRD_ANIMATION_CONFIG.ACTION_POSITION.top,
    [BirdAnimationPhase.FINISHED]: 0,
};

export const ANIMATED_VIEW_RIGHT_CONFIG: Record<BirdAnimationPhase, number> = {
    [BirdAnimationPhase.APPEARING]: BIRD_ANIMATION_CONFIG.APPEARING_POSITION.right,
    [BirdAnimationPhase.SITTING]: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.right,
    [BirdAnimationPhase.ACTION]: BIRD_ANIMATION_CONFIG.ACTION_POSITION.right,
    [BirdAnimationPhase.FINISHED]: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.right,
};

const PHASE_VIDEO_MAP: Record<BirdAnimationPhase, string | null> = {
    [BirdAnimationPhase.APPEARING]: 'appearing.mov',
    [BirdAnimationPhase.SITTING]: 'sitting.mov',
    [BirdAnimationPhase.ACTION]: 'single.mov',
    [BirdAnimationPhase.FINISHED]: null,
};

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
                                        * {
                                            margin: 0;
                                            padding: 0;
                                            box-sizing: border-box;
                                        }
                                        html, body {
                                            width: 100%;
                                            height: 100%;
                                            background: transparent;
                                            overflow: visible;
                                        }
                                        #videoContainer {
                                            width: 100%;
                                            height: 100%;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            overflow: visible;
                                        }
                                        video {
                                            width: 100%;
                                            height: 100%;
                                            object-fit: contain;
                                        }
                                    </style>
                                    <script>
                                        document.addEventListener("DOMContentLoaded", function() {
                                            window.ReactNativeWebView.postMessage("${domReadyMessage}");
                                        });
                                    </script>
                                </head>
                                <body>
                                    <div id="videoContainer">
                                        <video
                                            muted
                                            autoplay
                                            id="video"
                                            playsinline
                                            onerror="window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${WEBVIEW_MESSAGES.VIDEO_FAILED}' }))"
                                            onloadeddata="window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${WEBVIEW_MESSAGES.VIDEO_LOADED}' }))"
                                        >
                                            <source id="source" type="video/quicktime" />
                                        </video>
                                    </div>
                                </body>
                            </html>
                        `;
}

interface BirdAnimationProps {
    allChecked: boolean;
    checkboxAreaX?: number;
}

export const BirdAnimation = (props: BirdAnimationProps) => {
    const { allChecked = false } = props;
    const mainWebViewRef = useRef<WebView>(null);
    const actionWebViewRef = useRef<WebView>(null);
    const [phase, setPhase] = useState<BirdAnimationPhase>(BirdAnimationPhase.APPEARING);
    const [mainDOMReady, setMainDOMReady] = useState<boolean>(false);
    const [actionDOMReady, setActionDOMReady] = useState<boolean>(false);
    const [videosLoaded, setVideosLoaded] = useState<boolean>(false);
    const [videoCache, setVideoCache] = useState<Map<BirdAnimationPhase, string>>(new Map());
    const isAnimationComplete = useRef<boolean>(false);
    const allCheckedRef = useRef(allChecked);
    const phaseRef = useRef(phase);

    useEffect(() => {
        allCheckedRef.current = allChecked;
    }, [allChecked]);

    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    useEffect(() => {
        const preloadAllVideos = async () => {
            const cache = new Map<BirdAnimationPhase, string>();
            const phases = Object.values(BirdAnimationPhase).filter(
                p => p !== BirdAnimationPhase.FINISHED
            ) as BirdAnimationPhase[];

            for (const p of phases) {
                const videoFile = PHASE_VIDEO_MAP[p];
                if (videoFile) {
                    try {
                        const path = `${RNBlobUtil.fs.dirs.MainBundleDir}/${videoFile}`;
                        const base64 = await RNBlobUtil.fs.readFile(path, 'base64');
                        cache.set(p, base64);
                    } catch (error) {
                        console.error(`Error loading video for phase ${p}:`, error);
                    }
                }
            }

            setVideoCache(cache);
            setVideosLoaded(true);
        };

        preloadAllVideos();
    }, []);

    const injectVideo = useCallback(
        (targetPhase: BirdAnimationPhase, ref: RefObject<WebView | null>) => {
            const base64 = videoCache.get(targetPhase);
            if (!base64 || !ref.current) {
                return;
            }

            ref.current.injectJavaScript(`
            (function() {
                try {
                    if (!window.__VIDEO__) window.__VIDEO__ = document.getElementById("video");
                    if (!window.__SOURCE__) window.__SOURCE__ = document.getElementById("source");
                    
                    window.__VIDEO__.pause();
                    window.__SOURCE__.src = "data:video/quicktime;base64,${base64}";
                    var phaseTag = "${targetPhase}";
                    window.__VIDEO__.onended = function() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: "${WEBVIEW_MESSAGES.VIDEO_ENDED}",
                            phase: phaseTag
                        }));
                    };
                    window.__VIDEO__.load();
                    window.__VIDEO__.play();
                    
                    window.__VIDEO__.style.transform = "none";
                    window.__VIDEO__.style.transformOrigin = "center";
                    window.__VIDEO__.style.objectFit = "contain";
                } catch (e) { 
                    console.log("Inject error", e);
                }
                true;
            })();
        `);
        },
        [videoCache]
    );

    useEffect(() => {
        if (!videosLoaded || phase === BirdAnimationPhase.FINISHED) {
            return;
        }
        if (phase === BirdAnimationPhase.ACTION) {
            if (actionDOMReady) {
                injectVideo(BirdAnimationPhase.ACTION, actionWebViewRef);
            }
        } else if (mainDOMReady) {
            injectVideo(phase, mainWebViewRef);
        }
    }, [phase, mainDOMReady, actionDOMReady, videosLoaded, injectVideo]);

    useEffect(() => {
        if (
            !allChecked
            || isAnimationComplete.current
            || (phase !== BirdAnimationPhase.SITTING && phase !== BirdAnimationPhase.APPEARING)
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
                    const phaseForTransition = endedPhase ?? currentPhase;
                    switch (phaseForTransition) {
                        case BirdAnimationPhase.APPEARING:
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
        = phase === BirdAnimationPhase.APPEARING || phase === BirdAnimationPhase.SITTING;
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

    return (
        <View style={styles.birdRoot} key="bird-animation">
            {showMain && (
                <View
                    style={[
                        styles.container,
                        styles.containerGrounded,
                        styles.layerMain,
                        { top: CONTAINER_TOP_CONFIG[phase], right: -1 },
                    ]}
                >
                    <View
                        style={{ position: 'absolute', right: ANIMATED_VIEW_RIGHT_CONFIG[phase] }}
                    >
                        <WebView
                            ref={mainWebViewRef}
                            {...webViewCommonProps}
                            source={{ html: createBirdWebViewHtml(WEBVIEW_MESSAGES.DOM_READY_MAIN) }}
                            style={{
                                backgroundColor: 'transparent',
                                width: VIDEO_SIZE_CONFIG[phase].width,
                                height: VIDEO_SIZE_CONFIG[phase].height,
                            }}
                        />
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
