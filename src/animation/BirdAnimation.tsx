// outsource dependencies
import { WebView } from 'react-native-webview';
import RNBlobUtil from 'react-native-blob-util';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { WebViewMessageEvent } from 'react-native-webview/src/WebViewTypes.ts';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SCREEN_WIDTH } from '@gorhom/bottom-sheet';

// local dependencies


const { height: SCREEN_HEIGHT } = Dimensions.get('window');
export const WEBVIEW_MESSAGES = {
    VIDEO_LOADED: 'VIDEO_LOADED',
    VIDEO_FAILED: 'VIDEO_FAILED',
};

export enum BirdAnimationStep {
  WALKS_OUT = 0,
  SITTING = 1,
  FLY = 2,
  WALKING = 4
}

interface BirdAnimationProps {
  startAnimation: boolean;
}

export const BirdAnimation = ({ startAnimation = false }: BirdAnimationProps) => {
    const webViewRef = useRef<WebView>(null);
    const [base64, setBase64] = useState<string | null>(null);
    const [phase, setPhase] = useState<BirdAnimationStep>(BirdAnimationStep.WALKS_OUT);

    const [DOMReady, setDOMReady] = useState<boolean>(false);
    const readFile = useCallback(async (path: string | null, birdStep: BirdAnimationStep) => {
        console.log('Path', path);
        console.log('birdStep', birdStep);

        if (path) {
            try {
                const base64 = await RNBlobUtil.fs.readFile(path, 'base64');
                setPhase(birdStep);
                setBase64(base64);
                webViewRef.current?.injectJavaScript(`
                  const source = document.getElementById('source');
                  const video = document.getElementById('video');
                  if(${phase === BirdAnimationStep.WALKS_OUT}){
                    video.loop = false
                  }else {
                    video.loop = true
                  }
                `);
            } catch (error) {
                console.error('Error read file: ', error);
                return null;
            }
        }
    }, [phase, webViewRef.current]);

    const [animations, setAnimations] = useState<string[]>([]);

    const handleAnimations = (path: string) => setAnimations(prev => [...prev, path]);
    useEffect(() => {
        const loadVideo = async () => {
            const path = `${RNBlobUtil.fs.dirs.MainBundleDir}/walks_out.mov`;
            // readFile(path, BirdAnimationStep.WALKS_OUT);
            handleAnimations(path);
            const sittingBird = `${RNBlobUtil.fs.dirs.MainBundleDir}/sitting.mov`;
            readFile(sittingBird, BirdAnimationStep.WALKS_OUT);
            handleAnimations(sittingBird);
            const flyingBird = `${RNBlobUtil.fs.dirs.MainBundleDir}/flying.mov`;
            handleAnimations(flyingBird);
            const walkingBird = `${RNBlobUtil.fs.dirs.MainBundleDir}/flying.mov`;
            handleAnimations(flyingBird);
        };
        (async () => {
            if (DOMReady) {
                await loadVideo();
            }
        })();
    }, [readFile, DOMReady]);

    useEffect(() => {
        if (startAnimation) {
            setPhase(BirdAnimationStep.FLY);
            readFile(animations[BirdAnimationStep.FLY], BirdAnimationStep.FLY)
                .catch(() => {
                    console.error('Failed to load flying bird video');
                });
        } else {
            setPhase(BirdAnimationStep.SITTING);
            readFile(animations[BirdAnimationStep.SITTING], BirdAnimationStep.SITTING)
                .catch(() => {
                    console.error('Failed to load sitting bird video');
                });
        }
    }, [startAnimation, animations, readFile]);

    const handleMessage = useCallback((event: WebViewMessageEvent) => {
        const message = event.nativeEvent.data;
        console.log('MEssage', message);
        if (message.startsWith('[WEBVIEW LOG]')) {
            console.log(message);
            return;
        }
        if (!message.startsWith('{')) {
            return;
        }
        const data = JSON.parse(message);
        if (data?.reachedPhase !== phase) {
            console.log('reachedPhase', data?.reachedPhase);

            try {
                switch (data?.reachedPhase) {
                    case BirdAnimationStep.SITTING:
                        readFile(animations[data.reachedPhase], BirdAnimationStep.SITTING);
                        break;
                }

            } catch (e) {
                console.log('Invalid message from WebView:', message);
            }
        }
    }, [readFile, animations]);

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
    useEffect(() => {
        if (phase === BirdAnimationStep.SITTING) {
            birdX.value = 0;
            birdY.value = 0;
        } else if (phase === BirdAnimationStep.FLY) {
            const targetX = -SCREEN_WIDTH + getAnimationSize().webview.width;
            const targetY = SCREEN_HEIGHT - (getAnimationSize().html.height);

            birdX.value = withTiming(targetX, { duration: 3200 });
            birdY.value = withTiming(targetY, { duration: 3200 });
        }
    }, [phase, getAnimationSize]);

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
                                      <source src="data:video/quicktime;base64,${base64}" id="source" type="video/quicktime" />
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
                    useWebKit={true}
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
