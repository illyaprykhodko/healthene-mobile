// outsource dependencies
import {WebView} from 'react-native-webview';
import {StyleSheet, View} from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import {useCallback, useEffect, useRef, useState} from 'react';

// local dependencies
import {WebViewMessageEvent} from "react-native-webview/src/WebViewTypes.ts";

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

export const BirdAnimation = ({startAnimation = false}: BirdAnimationProps) => {
  const webViewRef = useRef<WebView>(null);
  const [base64, setBase64] = useState<string[]>([]);
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
  const handleBase64 = (path: string) => setBase64(prev => [...prev, path]);
  useEffect(() => {
    const loadVideo = async () => {
      const walksOut = `${RNBlobUtil.fs.dirs.MainBundleDir}/walks_out.mov`;
      const walksOutBase64 = await RNBlobUtil.fs.readFile(walksOut, 'base64');
      handleBase64(walksOutBase64);
      const sitting = `${RNBlobUtil.fs.dirs.MainBundleDir}/sitting.mov`;
      const sittingBase64 = await RNBlobUtil.fs.readFile(sitting, 'base64');
      handleBase64(sittingBase64);
      //
      // const flyingBird = `${RNBlobUtil.fs.dirs.MainBundleDir}/flying.mov`;
      // handleAnimations(flyingBird)
    };
    (async () => {
      await loadVideo();
    })();
  }, []);

  useEffect(() => {
    if (startAnimation) {
      setPhase(BirdAnimationStep.FLY)
      // readFile(animations[BirdAnimationStep.FLY])
      //   .catch((err) => {
      //     console.error('Failed to load flying bird video', err);
      //   });
    }
  }, [startAnimation]);


  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    const message = event.nativeEvent.data;
    if (message.startsWith('[WEBVIEW LOG]')) {
      console.log(message);
      return;
    }
    if (!message.startsWith('{')) {
      return;
    }
    const data = JSON.parse(message)
    if (data?.reachedPhase !== phase) {
      console.log('reachedPhase', data?.reachedPhase)

      try {
        switch (data?.reachedPhase) {
          case BirdAnimationStep.SITTING:
            // setPhase(data?.reachedPhase);
            // readFile(animations[data.reachedPhase]).then(() => {
            //   setPhase(data?.reachedPhase);
            // });
            break;
        }

      } catch (e) {
        console.log('Invalid message from WebView:', message);
      }
    }
  }, [readFile])

  if (!base64[phase]) return null;

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
                    body {
                      margin: 0;
                      background: transparent;
                      overflow: hidden;
                      border: red 1px solid;
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
                    window.phase = { value: ${phase} };
                    window.animations = {
                      0: '${base64[0]}',
                      1: '${base64[1]}',
                      2: '${base64[2]}',
                      4: '${base64[3]}'
                    };
                    window.onload = () => {
                      // Dynamically switch between even/odd video sources depending on phase
                      function changePhase(phase){
                        window.phase.value = phase;
                      
                        const videoEven = document.getElementById('videoEven');
                        const videoOdd = document.getElementById('videoOdd');
                        if (phase % 2 === 0) {
                          videoEven.style.display = 'block';
                          videoOdd.style.display = 'none';
                        } else {
                          videoEven.style.display = 'none';
                          videoOdd.style.display = 'block';
                        }
                        
                        const payload = JSON.stringify({ reachedPhase: phase });
                        window.ReactNativeWebView?.postMessage(payload);
                      }
                      changePhase(${phase})
                      const log = (...args) => {
                        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                          window.ReactNativeWebView.postMessage('[WEBVIEW LOG] ' + args.join(' '));
                        }
                        console.__log && console.__log(...args); 
                      };
                      const videoEven = document.getElementById('videoEven');
                      const videoOdd = document.getElementById('videoOdd');

                      if (videoEven && window.phase.value === ${BirdAnimationStep.WALKS_OUT}) {
                        // Ensure video starts from the very beginning for WALKS_OUT phase
                        videoEven.currentTime = 0;
                        videoEven.play();
                      }
                      
                      if (videoEven) {
                        if (window.phase.value === ${BirdAnimationStep.WALKS_OUT}) {
                          videoEven.loop = false;
                        } else {
                          videoEven.loop = true;
                        }
                      }
                      const container = document.getElementById('videoContainer');
                      const screenWidth = window.innerWidth;
                      const screenHeight = window.innerHeight;
                      let x = screenWidth - 120;
                      let y = 0;
                      let takeoffFrame = 0;
                      
                      // Animation loop: updates position and handles phase-based transitions
                      function animate() {
                        requestAnimationFrame(animate);
                        if (window.phase.value === ${BirdAnimationStep.WALKS_OUT}) {
                          // When video is near its end, switch to the SITTING phase
                          if(videoEven.duration - videoEven.currentTime <= .5) {
                            changePhase(${BirdAnimationStep.SITTING});
                          }
                        } 
                        else if(window.phase.value === ${BirdAnimationStep.FLY}) {
                            // Move the video container diagonally up-left to simulate flying
                            x -= 2;
                            y += 4;
                          if (x <= 0 && y >= screenHeight / 2) {
                            x = 0;
                            y = screenHeight - 120;
                            if (
                              window.ReactNativeWebView && window.ReactNativeWebView.postMessage
                            ) {
                            }
                          }
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
                    <div id="videoWrapper" style="opacity: 1; transition: opacity 0.3s ease;">
                      <video
                        id="videoEven"
                        loop
                        muted
                        playsinline
                        style="display: none;"
                        onerror="window.ReactNativeWebView.postMessage('${WEBVIEW_MESSAGES.VIDEO_FAILED}')"
                        onloadeddata="window.ReactNativeWebView.postMessage('${WEBVIEW_MESSAGES.VIDEO_LOADED}')"
                      >
                        <source type="video/quicktime" src="data:video/mov;base64,${base64[0]}" />
                      </video>
                      <video
                        id="videoOdd"
                        loop
                        muted
                        autoplay
                        playsinline
                        style="display: none;"
                        onerror="window.ReactNativeWebView.postMessage('${WEBVIEW_MESSAGES.VIDEO_FAILED}')"
                        onloadeddata="window.ReactNativeWebView.postMessage('${WEBVIEW_MESSAGES.VIDEO_LOADED}')"
                      >
                        <source type="video/quicktime" src="data:video/mov;base64,${base64[1]}" />
                      </video>
                    </div>
                  </div>
              </body>
              </html>
            `,
        }}
        style={{backgroundColor: 'transparent'}}
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
