// outsource dependencies
import { WebView } from 'react-native-webview';
import RNBlobUtil from 'react-native-blob-util';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { WebViewMessageEvent } from 'react-native-webview/src/WebViewTypes.ts';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { OFFSET } from 'constants/offset.ts';

// local dependencies

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
export const WEBVIEW_MESSAGES = {
    VIDEO_LOADED: 'VIDEO_LOADED',
    VIDEO_FAILED: 'VIDEO_FAILED',
};

export enum BirdAnimationStep {
  // WALKS_OUT = 0,
  SITTING = 0,
  FLY = 1,
  WALKING = 2
}

interface BirdAnimationProps {
  startAnimation: boolean;
}

export const BirdAnimation = ({ startAnimation = false }: BirdAnimationProps) => {
    const webViewRef = useRef<WebView>(null);
    const [phase, setPhase] = useState<BirdAnimationStep>(BirdAnimationStep.SITTING);

    const [DOMReady, setDOMReady] = useState<boolean>(false);
    const [animations, setAnimations] = useState<string[]>([]);
    useEffect(() => {
        const getAnimation = async () => {
            const path = animations[phase];
            if (animations.length && path) {
                try {
                    const base64 = await RNBlobUtil.fs.readFile(path, 'base64');
                    if (webViewRef?.current) {
                        webViewRef.current.injectJavaScript(`
                        (function() {
                            try {
                                if (!window.__VIDEO__) window.__VIDEO__ = document.getElementById("video");
                                if (!window.__SOURCE__) window.__SOURCE__ = document.getElementById("source");
                    
                                window.__VIDEO__.pause();
                                window.__SOURCE__.src = "data:video/quicktime;base64,${base64}";
                                window.__VIDEO__.load();
                                window.__VIDEO__.play();
                            } catch (e) { 
                                console.log("Inject error", e);
                            }
                            true;
                        })();
                    `);
                    }

                } catch (error) {
                    console.error('Error read file: ', error);
                    return null;
                }
            }
        };
        getAnimation().catch(() => console.error('Error read file: '));
    }, [phase, animations]);

    const [block, setBlock] = useState(true);
    const handleAnimations = (path: string) => setAnimations(prev => [...prev, path]);
    useEffect(() => {
        const loadVideo = async () => {
            // const path = `${RNBlobUtil.fs.dirs.MainBundleDir}/walks_out.mov`;
            // handleAnimations(path);
            const sittingBird = `${RNBlobUtil.fs.dirs.MainBundleDir}/sitting.mov`;
            handleAnimations(sittingBird);
            const flyingBird = `${RNBlobUtil.fs.dirs.MainBundleDir}/flying.mov`;
            handleAnimations(flyingBird);
            const walkingBird = `${RNBlobUtil.fs.dirs.MainBundleDir}/walking.mov`;
            handleAnimations(walkingBird);
        };

        (async () => {
            if (DOMReady && block) {
                setBlock(false);
                await loadVideo();
            }
        })();
    }, [DOMReady, block]);


    useEffect(() => {
        if (startAnimation && phase === BirdAnimationStep.SITTING) {
            setPhase(BirdAnimationStep.FLY);
        }
    }, [startAnimation, animations]);

    const handleMessage = useCallback((event: WebViewMessageEvent) => {
        const message = event.nativeEvent.data;
        if (message.startsWith('[WEBVIEW LOG]')) {
            return;
        }
        if (!message.startsWith('{')) {
            return;
        }
        const data = JSON.parse(message);
        if (data?.reachedPhase !== phase) {

            // try {
            //     switch (data?.reachedPhase) {
            //         case BirdAnimationStep.SITTING:
            //             readFile(animations[data.reachedPhase], BirdAnimationStep.SITTING);
            //             break;
            //     }
            //
            // } catch (e) {
            //     console.log('Invalid message from WebView:', message);
            // }
        }
    }, [animations]);

    // Styles
    const getAnimationSize = useCallback(() => {
        switch (phase) {
            default: return { webview: { width: 60, height: 60 }, html: { width: 220, height: 220 } };
            case BirdAnimationStep.FLY: return { webview: { width: 80, height: 80 }, html: { width: 280, height: 280 } };
        }
    }, [phase]);

    // Animation
    const birdX = useSharedValue(0);
    const birdY = useSharedValue(0);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: birdX.value },
            { translateY: birdY.value },
        ],
    }));
    const handleFlyFinished = useCallback(() => {
        setPhase(BirdAnimationStep.WALKING);
    }, [animations]);

    useEffect(() => {
        if (phase === BirdAnimationStep.SITTING) {
            birdX.value = 0;
            birdY.value = 0;
        } else if (phase === BirdAnimationStep.FLY) {
            const targetX = -SCREEN_WIDTH + getAnimationSize().webview.width;
            const targetY = SCREEN_HEIGHT - (getAnimationSize().html.height) - OFFSET.VERTICAL;

            birdX.value = withTiming(targetX, { duration: 3200 });
            birdY.value = withTiming(targetY, { duration: 3200 }, finished => {
                if (finished) {
                    runOnJS(handleFlyFinished)();
                }
            });
        } else if (phase === BirdAnimationStep.WALKING) {
            const targetX = -50;
            birdX.value = withTiming(targetX, { duration: 2000 });
        }
    }, [phase, getAnimationSize, animations]);

    return (
        <View style={styles.container}>
            <Animated.View style={[{ position: 'absolute', right: 0 }, animatedStyle]}>
                <WebView
                    ref={webViewRef}
                    onMessage={handleMessage}
                    cacheEnabled={false}
                    cacheMode="LOAD_NO_CACHE"
                    incognito={true}
                    onLoadEnd={() => setDOMReady(true)}
                    source={{
                        html: `
                          <html>
                            <head>
                              <style>
                                html, body {
                                    width: ${getAnimationSize().html.width}px;
                                    height: ${getAnimationSize().html.height}px;
                                }
                                #videoContainer {
                                  width: 100%;
                                  height: 100%;
                                  overflow: hidden;
                                  border: #449fdb 1px solid;
                                }
                                video {
                                  width: 100%;
                                  height: 100%;
                                  object-fit: fill;
                                }
                              </style>
                              <script>
                                  document.addEventListener("DOMContentLoaded", function() {
                                    window.ReactNativeWebView.postMessage("DOM_READY");
                                  });
                              </script>
                            </head>
                            <body>
                                <div id="videoContainer">
                                    <video
                                      loop
                                      muted
                                      autoplay
                                      id="video"
                                      playsinline
                                      onerror="window.ReactNativeWebView.postMessage('${WEBVIEW_MESSAGES.VIDEO_FAILED}')"
                                      onloadeddata="window.ReactNativeWebView.postMessage({'${WEBVIEW_MESSAGES.VIDEO_LOADED}'})"
                                    >
                                      <source id="source" type="video/quicktime" />
                                    </video>
                                </div>
                          </body>
                          </html>
                        `,
                    }}
                    style={{ backgroundColor: 'transparent', ...getAnimationSize().webview }}
                    onError={e => console.log('Video error', e)}
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
        top: 60,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1,
        pointerEvents: 'none',
    },
});
