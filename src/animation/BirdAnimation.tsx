// outsource dependencies
import { WebView } from 'react-native-webview';
import { Dimensions, StyleSheet, View } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import { useCallback, useEffect, useRef, useState } from 'react';

// local dependencies
import { WebViewMessageEvent } from 'react-native-webview/src/WebViewTypes.ts';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
export const WEBVIEW_MESSAGES = {
    VIDEO_LOADED: 'VIDEO_LOADED',
    VIDEO_FAILED: 'VIDEO_FAILED',
};

export enum BirdAnimationStep {
  WALKS_OUT = 0,
  SITTING = 1,
  FLY = 2,
  LANDING = 4
}

interface BirdAnimationProps {
  startAnimation: boolean;
}

export const BirdAnimation = ({ startAnimation = false }: BirdAnimationProps) => {
    const webViewRef = useRef<WebView>(null);
    const [base64, setBase64] = useState<string | null>(null);
    const [phase, setPhase] = useState<BirdAnimationStep>(BirdAnimationStep.WALKS_OUT);

    const readFile = async (path: string | null) => {
        if (path) {
            try {
                const base64 = await RNBlobUtil.fs.readFile(path, 'base64');
                setBase64(base64);
            } catch (error) {
                console.error('Error read file: ', error);
                return null;
            }
        }
    };
    const [animations, setAnimations] = useState<string[]>([]);

    const handleAnimations = (path: string) => setAnimations(prev => [...prev, path]);
    useEffect(() => {
        const loadVideo = async () => {
            const path = `${RNBlobUtil.fs.dirs.MainBundleDir}/walks_out.mov`;
            const base64 = await RNBlobUtil.fs.readFile(path, 'base64');
            setBase64(base64);
            handleAnimations(path);
            const sittingBird = `${RNBlobUtil.fs.dirs.MainBundleDir}/sitting.mov`;
            handleAnimations(sittingBird);
            const flyingBird = `${RNBlobUtil.fs.dirs.MainBundleDir}/flying.mov`;
            handleAnimations(flyingBird);
        };
        (async () => {
            await loadVideo();
        })();
    }, []);

    useEffect(() => {
        if (startAnimation) {
            setPhase(BirdAnimationStep.FLY);
            readFile(animations[BirdAnimationStep.FLY])
                .catch(err => {
                    console.error('Failed to load flying bird video', err);
                });
        }
    }, [startAnimation, animations]);


    const handleMessage = useCallback((event: WebViewMessageEvent) => {
        const message = event.nativeEvent.data;
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
                        readFile(animations[data.reachedPhase]);
                        break;
                }

            } catch (e) {
                console.log('Invalid message from WebView:', message);
            }
        }
    }, [readFile]);

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                onMessage={handleMessage}
                source={{
                    html: `
              <html>
                <head>
                  <style>
                    html, body {
                      margin: 0;
                      padding: 0;
                      width: 100%;
                      height: 100%;
                      overflow: hidden;
                      background: transparent;
                      border: red 1px solid;
                    }
                    #viewportWrapper {
                      position: relative;
                      width: 100%;
                      height: 100vh;
                      overflow: hidden;
                      background: transparent;
                    }
                    #videoContainer {
                      position: absolute;
                      top: 0;
                      left: calc(100vw - 120px);
                      width: 120px;
                      height: 120px;
                      overflow: hidden;
                      border: #449fdb 1px solid;
                    }
                    video {
                      width: 100%;
                      height: 100%;
                      object-fit: contain;
                    }
                  </style>
                  <script>
                    window.SCREEN_HEIGHT = ${SCREEN_HEIGHT};
                    window.phase = { value: ${phase} };
                    
                    function startScript() {
                        const log = (...args) => {
                        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                            window.ReactNativeWebView.postMessage('[WEBVIEW LOG] ' + args.join(' '));
                        }
                    };
                    
                    
                    const video = document.getElementById('video');
                    
                    if (video) {
                        if (window.phase.value === ${BirdAnimationStep.WALKS_OUT}) {
                            video.loop = false;
                        } else {
                            video.loop = true;
                        }
                    }
                    
                    const container = document.getElementById('videoContainer');
                    const screenWidth = window.innerWidth;
                    const screenHeight = window.innerHeight;
                    const screenHeightScreeen = window.SCREEN_HEIGHT;
                    log("WebViewScreenHeight", screenHeight)
                    log("RNScreeen", screenHeightScreeen)
                    const leftPadding = 16;
                    let x = screenWidth - 120;
                    let y = 0;
                    
                    function changePhase(phase) {
                        window.phase.value = phase;
                        const payload = JSON.stringify({ reachedPhase: phase });
                        window.ReactNativeWebView.postMessage(payload);
                    }
                    function animate() {
                        requestAnimationFrame(animate);
                    
                        if (window.phase.value === ${BirdAnimationStep.WALKS_OUT}) {
                            if (video && video.duration - video.currentTime <= 0.5) {
                                changePhase(${BirdAnimationStep.SITTING});
                            }
                        } else if (window.phase.value === ${BirdAnimationStep.FLY}) {
                            x -= 2;
                            y += 4;
                            // log("Y_AXIS", y)
                            if (x <= 76 && y >= 110) {
                                x = 76;
                                y = screenHeight - 110;
                            }
                        }
                    
                        container.style.left = x + 'px';
                        container.style.top = y + 'px';
                    }
                    
                        animate();
                    }
                    
                    function waitForBridge() {
                        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                            startScript();
                        } else {
                            setTimeout(waitForBridge, 20);
                        }
                    }
                    
                    document.addEventListener("DOMContentLoaded", waitForBridge);
                </script>
                </head>
                <body>
                  <div id="viewportWrapper">
                    <div id="videoContainer">
                      <div id="videoWrapper" style="opacity: 1; transition: opacity 0.3s ease;">
                        <video
                          loop
                          muted
                          autoplay
                          id="video"
                          playsinline
                          onerror="window.ReactNativeWebView.postMessage('${WEBVIEW_MESSAGES.VIDEO_FAILED}')"
                          onloadeddata="window.ReactNativeWebView.postMessage('${WEBVIEW_MESSAGES.VIDEO_LOADED}')"
                        >
                          <source src="data:video/mov;base64,${base64}" type="video/quicktime"/>
                        </video>
                      </div>
                    </div>
                  </div>
              </body>
              </html>
            `,
                }}
                style={{ backgroundColor: 'transparent' }}
                onError={e => console.log('Video error', e)}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                useWebKit={true}
                originWhitelist={['*']}

            />
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
