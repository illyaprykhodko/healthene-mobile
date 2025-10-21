// outsource dependencies
import { WebView } from 'react-native-webview';
import RNBlobUtil from 'react-native-blob-util';
import { StyleSheet, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';

// local dependencies

export const WEBVIEW_MESSAGES = {
  VIDEO_LOADED: 'VIDEO_LOADED',
  VIDEO_FAILED: 'VIDEO_FAILED',
};

export enum BirdAnimationStep {
  DEFAULT = 0,
  TAKEOFF = 1,
  FLY = 2,
  LANDING = 3
}

interface BirdAnimationProps {
  startAnimation: boolean;
}

export const BirdAnimation = ({ startAnimation }: BirdAnimationProps) => {
  const webViewRef = useRef<WebView>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  const [phase, setPhase] = useState<BirdAnimationStep>(BirdAnimationStep.DEFAULT);
  useEffect(() => {
    console.log('Trying to send phase to WebView:', phase);
    if (isWebViewReady && startAnimation && webViewRef.current && phase !== null) {
      webViewRef.current.postMessage(JSON.stringify({ phase }));
    } else {
      console.log('WebView not ready or phase is null');
    }
  }, [phase, isWebViewReady, startAnimation]);

  useEffect(() => {
    const loadVideo = async () => {
      const path = `${RNBlobUtil.fs.dirs.MainBundleDir}/default_behaviour.mov`;
      await readFile(path);
    };
    (async () => {
      await loadVideo();

      if (startAnimation) {
        setPhase(BirdAnimationStep.TAKEOFF);
      }
    })();
  }, [startAnimation]);

  const readFile = async (path: string) => {
    try {
      const base64 = await RNBlobUtil.fs.readFile(path, 'base64');
      setBase64(base64);
    } catch (error) {
      console.error('Error read file: ', error);
      return null;
    }
  };

  return (
    <View style={ styles.container }>
      <WebView
        ref={ webViewRef }
        style={ { backgroundColor: 'transparent' } }
        source={ {
          html: `
              <html>
                <head>
                  <style>
                    body {
                      margin: 0;
                      background: transparent;
                      overflow: hidden;
                    }
                    #videoContainer {
                      position: absolute;
                      top: 0;
                      right: 0;
                      width: 120px;
                      height: 120px;
                      border: #449fdb 1px solid;
                      overflow: hidden;
                    }
                    video {
                      width: 100%;
                      height: 100%;
                      object-fit: contain;
                    }
                  </style>
                  <script>
                    window.onload = () => {
                      const log = (...args) => {
                        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                          window.ReactNativeWebView.postMessage('[WEBVIEW LOG] ' + args.join(' '));
                        }
                        console.__log && console.__log(...args); 
                      };
                      const container = document.getElementById('videoContainer');
                      const screenWidth = window.innerWidth;
                      const screenHeight = window.innerHeight;
                      let x = screenWidth - 150;
                      let y = 0;
                      let phase = { value: 0 };
                     
                      window.addEventListener('message', event => {
                        try {
                          const data = JSON.parse(event.data);
                          log('HELLO', data.phase)
                          if (data.phase !== undefined) {
                            phase.value = data.phase;
                            log('Updated phase to', phase.value);
                          }
                        } catch (e) {}
                      });
                      let takeoffFrame = 0;
                      function animate() {
                        requestAnimationFrame(animate);
                        log('PHASE!!!', phase.value)
                        
                        if(phase.value === ${BirdAnimationStep.TAKEOFF}) {
                            takeoffFrame++;
                            log('takeoffFrame', takeoffFrame)
                            x -= 1.5;
                            y -= 2;
                            if (takeoffFrame >= (60*1)) {
                              const payload = JSON.stringify({ 
                                reachedPhase: ${BirdAnimationStep.FLY} 
                              });
                              window.ReactNativeWebView.postMessage(payload);
                            }
                        } else if (phase.value === ${BirdAnimationStep.FLY}) {
                          x -= 2;
                          y += 2;
                          if (x <= 0 && y >= screenHeight / 2) {
                            x = 0;
                            y = screenHeight / 2;
                            if (
                              window.ReactNativeWebView && window.ReactNativeWebView.postMessage
                            ) {
                              const payload = JSON.stringify({ 
                                reachedPhase: ${BirdAnimationStep.LANDING} 
                              });
                              console.log("Sending JSON:", payload);
                              window.ReactNativeWebView.postMessage(payload);
                            }
                          }
                        } else if (phase.value === ${BirdAnimationStep.LANDING}) {
                          x += 2;
                          y += 2;
                        }
  
                        container.style.left = \`\${x}px\`;
                        container.style.top = \`\${y}px\`;
                      }
  
                      animate();
                    }
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
                      onerror="window
                        .ReactNativeWebView
                        .postMessage('${WEBVIEW_MESSAGES.VIDEO_FAILED}')"
                      onloadeddata="window
                        .ReactNativeWebView
                        .postMessage('${WEBVIEW_MESSAGES.VIDEO_LOADED}')"
                    >
                      <source src="data:video/mov;base64,${base64}" type="video/quicktime"/>
                    </video>
                  </div>
              </body>
              </html>

            `,
        } }
        onMessage={ event => {
          const message = event.nativeEvent.data;
          console.log('RAW JS message:', message);

          if (message === WEBVIEW_MESSAGES.VIDEO_LOADED) {
            setIsWebViewReady(true);
            return;
          }
          try {
            const data = JSON.parse(message);
            setPhase(data.reachedPhase);
          } catch (e) {
            console.log('Invalid message from WebView:', message);
          }
        } }
        onError={ e => console.log('Video error', e) }
        allowsInlineMediaPlayback={ true }
        mediaPlaybackRequiresUserAction={ false }
        useWebKit={ true }
        originWhitelist={ ['*'] }
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
