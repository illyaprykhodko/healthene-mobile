// outsource dependencies
import Animated, {
    Easing,
    withTiming,
    useSharedValue,
    useAnimatedStyle,
} from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import RNBlobUtil from 'react-native-blob-util';
import { scheduleOnRN } from 'react-native-worklets';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { WebViewMessageEvent } from 'react-native-webview/src/WebViewTypes.ts';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// CONFIGURABLE CONSTANTS - Adjust these values to fine-tune animation positions
// ============================================================================

// Video size constant - all videos use the same dimensions (adjust this value as needed)
export const VIDEO_SIZE = 80;

export const BIRD_ANIMATION_CONFIG = {
    INITIAL_POSITION: {
        top: 40,
        right: -3,
    },
    TAKEOFF_OFFSET_Y: -30,
    FLY_TARGET: {
        x: -SCREEN_WIDTH + VIDEO_SIZE,
        y: SCREEN_HEIGHT - VIDEO_SIZE - 100,
    },
    WALKING_STOP_OFFSET: 20,
    DURATIONS: {
        TAKEOFF_LIFT: 500,
        FLY_TO_BOTTOM: 3200,
        WALKING: 2000,
        FLYING_AWAY: 1500,
    },
};

// ============================================================================
// ANIMATION PHASES
// ============================================================================
export enum BirdAnimationPhase {
    APPEARING = 'APPEARING',
    SITTING = 'SITTING',
    TAKEOFF = 'TAKEOFF',
    FLYING = 'FLYING',
    WALKING = 'WALKING',
    PECKING = 'PECKING',
    FLYING_AWAY = 'FLYING_AWAY',
    FINISHED = 'FINISHED',
}

// Video size configuration for each phase
// export const VIDEO_SIZE_CONFIG: Record<BirdAnimationPhase, { width: number; height: number }> = {
//     [BirdAnimationPhase.APPEARING]: { width: VIDEO_SIZE, height: VIDEO_SIZE },
//     [BirdAnimationPhase.SITTING]: { width: VIDEO_SIZE, height: VIDEO_SIZE },
//     [BirdAnimationPhase.TAKEOFF]: { width: VIDEO_SIZE + 50, height: VIDEO_SIZE + 50 },
//     [BirdAnimationPhase.FLYING]: { width: VIDEO_SIZE + 50, height: VIDEO_SIZE + 50 },
//     [BirdAnimationPhase.WALKING]: { width: VIDEO_SIZE + 50, height: VIDEO_SIZE + 50 },
//     [BirdAnimationPhase.PECKING]: { width: VIDEO_SIZE + 50, height: VIDEO_SIZE + 50 },
//     [BirdAnimationPhase.FLYING_AWAY]: { width: VIDEO_SIZE + 50, height: VIDEO_SIZE + 50 },
//     [BirdAnimationPhase.FINISHED]: { width: 0, height: 0 },
// };

// Video file mapping for each phase
const PHASE_VIDEO_MAP: Record<BirdAnimationPhase, string | null> = {
    [BirdAnimationPhase.APPEARING]: 'appearing.mov',
    [BirdAnimationPhase.SITTING]: 'sitting.mov',
    [BirdAnimationPhase.TAKEOFF]: 'takeoff.mov',
    [BirdAnimationPhase.FLYING]: 'flying.mov',
    [BirdAnimationPhase.WALKING]: 'walking.mov',
    [BirdAnimationPhase.PECKING]: 'pecking.mov',
    [BirdAnimationPhase.FLYING_AWAY]: 'flyingAway.mov',
    [BirdAnimationPhase.FINISHED]: null,
};

// Phases that should loop their video
const LOOPED_PHASES: BirdAnimationPhase[] = [
    BirdAnimationPhase.SITTING,
    BirdAnimationPhase.FLYING,
    BirdAnimationPhase.WALKING,
];

// WebView message types
export const WEBVIEW_MESSAGES = {
    VIDEO_LOADED: 'VIDEO_LOADED',
    VIDEO_FAILED: 'VIDEO_FAILED',
    VIDEO_ENDED: 'VIDEO_ENDED',
    DOM_READY: 'DOM_READY',
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================
interface BirdAnimationProps {
    allChecked: boolean;
    checkboxAreaX: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const BirdAnimation = ({ allChecked = false, checkboxAreaX }: BirdAnimationProps) => {
    const webViewRef = useRef<WebView>(null);
    const [phase, setPhase] = useState<BirdAnimationPhase>(BirdAnimationPhase.APPEARING);
    const [DOMReady, setDOMReady] = useState<boolean>(false);
    const [videosLoaded, setVideosLoaded] = useState<boolean>(false);
    const [videoCache, setVideoCache] = useState<Map<BirdAnimationPhase, string>>(new Map());
    const isAnimationComplete = useRef<boolean>(false);

    // ========================================================================
    // VIDEO PRELOADING
    // ========================================================================
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

    // ========================================================================
    // VIDEO INJECTION
    // ========================================================================
    const getVideoTransform = (_targetPhase: BirdAnimationPhase): string => {
        return 'none';
    };

    const injectVideo = useCallback((targetPhase: BirdAnimationPhase) => {
        const base64 = videoCache.get(targetPhase);
        if (!base64 || !webViewRef.current) {
            return;
        }

        const transformValue = getVideoTransform(targetPhase);

        webViewRef.current.injectJavaScript(`
            (function() {
                try {
                    if (!window.__VIDEO__) window.__VIDEO__ = document.getElementById("video");
                    if (!window.__SOURCE__) window.__SOURCE__ = document.getElementById("source");
                    
                    window.__VIDEO__.pause();
                    window.__SOURCE__.src = "data:video/quicktime;base64,${base64}";
                    window.__VIDEO__.load();
                    window.__VIDEO__.play();
                    
                    window.__VIDEO__.style.transform = "${transformValue}";
                    window.__VIDEO__.style.transformOrigin = "center";
                } catch (e) { 
                    console.log("Inject error", e);
                }
                true;
            })();
        `);
    }, [videoCache]);

    // Inject video when phase changes or videos are loaded
    useEffect(() => {
        if (DOMReady && videosLoaded && phase !== BirdAnimationPhase.FINISHED) {
            injectVideo(phase);
        }
    }, [phase, DOMReady, videosLoaded, injectVideo]);

    // ========================================================================
    // POSITION ANIMATION VALUES
    // ========================================================================
    const birdX = useSharedValue(0);
    const birdY = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: birdX.value },
            { translateY: birdY.value },
        ],
    }));

    // ========================================================================
    // PHASE TRANSITION CALLBACKS
    // ========================================================================
    const handleFlyingComplete = useCallback(() => {
        setPhase(BirdAnimationPhase.WALKING);
    }, []);

    const handleWalkingComplete = useCallback(() => {
        setPhase(BirdAnimationPhase.PECKING);
    }, []);

    const handleFlyingAwayComplete = useCallback(() => {
        setPhase(BirdAnimationPhase.FINISHED);
        isAnimationComplete.current = true;
    }, []);

    // ========================================================================
    // POSITION ANIMATIONS FOR EACH PHASE
    // ========================================================================
    useEffect(() => {
        const config = BIRD_ANIMATION_CONFIG;

        switch (phase) {
            case BirdAnimationPhase.APPEARING:
            case BirdAnimationPhase.SITTING:
            case BirdAnimationPhase.TAKEOFF:
                birdX.value = 0;
                birdY.value = 0;
                break;


            case BirdAnimationPhase.FLYING:
                birdX.value = withTiming(config.FLY_TARGET.x, {
                    duration: config.DURATIONS.FLY_TO_BOTTOM,
                    easing: Easing.inOut(Easing.ease),
                });
                birdY.value = withTiming(config.FLY_TARGET.y, {
                    duration: config.DURATIONS.FLY_TO_BOTTOM,
                    easing: Easing.inOut(Easing.ease),
                }, finished => {
                    if (finished) {
                        scheduleOnRN(handleFlyingComplete);
                    }
                });
                break;

            case BirdAnimationPhase.WALKING: {
                const walkingTargetX = SCREEN_WIDTH - config.WALKING_STOP_OFFSET - checkboxAreaX - VIDEO_SIZE;
                birdX.value = withTiming(walkingTargetX, {
                    duration: config.DURATIONS.WALKING,
                    easing: Easing.linear,
                }, finished => {
                    if (finished) {
                        scheduleOnRN(handleWalkingComplete);
                    }
                });
                break;
            }

            case BirdAnimationPhase.PECKING:
                break;

            case BirdAnimationPhase.FLYING_AWAY:
                birdX.value = withTiming(SCREEN_WIDTH + VIDEO_SIZE, {
                    duration: config.DURATIONS.FLYING_AWAY,
                    easing: Easing.in(Easing.ease),
                }, finished => {
                    if (finished) {
                        scheduleOnRN(handleFlyingAwayComplete);
                    }
                });
                break;

            case BirdAnimationPhase.FINISHED:
            default:
                break;
        }
    }, [phase, checkboxAreaX, birdX, birdY, handleFlyingComplete, handleWalkingComplete, handleFlyingAwayComplete]);

    // ========================================================================
    // TRIGGER TAKEOFF WHEN ALL CHECKBOXES ARE CHECKED
    // ========================================================================
    useEffect(() => {
        if (allChecked && phase === BirdAnimationPhase.SITTING && !isAnimationComplete.current) {
            setPhase(BirdAnimationPhase.TAKEOFF);
        }
    }, [allChecked, phase]);

    // ========================================================================
    // WEBVIEW MESSAGE HANDLER
    // ========================================================================
    const handleMessage = useCallback((event: WebViewMessageEvent) => {
        const message = event.nativeEvent.data;

        if (message.startsWith('[WEBVIEW LOG]')) {
            return;
        }

        try {
            const data = JSON.parse(message);

            if (data.type === WEBVIEW_MESSAGES.VIDEO_ENDED) {
                const isLoopedPhase = LOOPED_PHASES.includes(phase);

                if (isLoopedPhase) {
                    webViewRef.current?.injectJavaScript(`
                        (function() {
                            if (window.__VIDEO__) {
                                window.__VIDEO__.currentTime = 0;
                                window.__VIDEO__.play();
                            }
                            true;
                        })();
                    `);
                } else {
                    switch (phase) {
                        case BirdAnimationPhase.APPEARING:
                            setPhase(BirdAnimationPhase.SITTING);
                            break;
                        case BirdAnimationPhase.TAKEOFF:
                            setPhase(BirdAnimationPhase.FLYING);
                            break;
                        case BirdAnimationPhase.PECKING:
                            setPhase(BirdAnimationPhase.FLYING_AWAY);
                            break;
                        case BirdAnimationPhase.FLYING_AWAY:
                            setPhase(BirdAnimationPhase.FINISHED);
                            isAnimationComplete.current = true;
                            break;
                        default:
                            break;
                    }
                }
            }
        } catch {
            if (message === WEBVIEW_MESSAGES.DOM_READY) {
                setDOMReady(true);
            }
        }
    }, [phase]);

    // ========================================================================
    // RENDER
    // ========================================================================
    if (phase === BirdAnimationPhase.FINISHED) {
        return null;
    }

    return (
        <View style={[styles.container, { top: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.top }]}>
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        right: BIRD_ANIMATION_CONFIG.INITIAL_POSITION.right,
                    },
                    animatedStyle,
                ]}
            >
                <WebView
                    ref={webViewRef}
                    incognito={true}
                    cacheEnabled={false}
                    onMessage={handleMessage}
                    cacheMode="LOAD_NO_CACHE"
                    onLoadEnd={() => setDOMReady(true)}
                    source={{
                        html: `
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
                                            /*border: #1BA8CB 1px solid;*/
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
                                            window.ReactNativeWebView.postMessage("${WEBVIEW_MESSAGES.DOM_READY}");
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
                                            onended="window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${WEBVIEW_MESSAGES.VIDEO_ENDED}' }))"
                                            onerror="window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${WEBVIEW_MESSAGES.VIDEO_FAILED}' }))"
                                            onloadeddata="window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${WEBVIEW_MESSAGES.VIDEO_LOADED}' }))"
                                        >
                                            <source id="source" type="video/quicktime" />
                                        </video>
                                    </div>
                                </body>
                            </html>
                        `,
                    }}
                    style={{
                        backgroundColor: 'transparent',
                        width: VIDEO_SIZE,
                        height: VIDEO_SIZE,
                    }}
                    onError={_e => {}}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    javaScriptEnabled={true}
                    originWhitelist={['*']}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 19999999,
        pointerEvents: 'none',
    },
});
