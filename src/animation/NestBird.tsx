// outsource dependencies
import { WebView } from 'react-native-webview';
import RNBlobUtil from 'react-native-blob-util';
import { Platform, StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { WebViewMessageEvent } from 'react-native-webview/src/WebViewTypes.ts';

// local dependencies

/** Size, spacing, and offsets for {@link NestBird} — edit here only. */
export const NEST_BIRD_ANIMATION_CONFIG = {
    width: 100,
    height: 100,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: -14,
    marginRight: 0,
} as const;

const VIDEO_EXT = Platform.OS === 'ios' ? 'mov' : 'webm';
const VIDEO_MIME = Platform.OS === 'ios' ? 'video/quicktime' : 'video/webm';

function getVideoAssetPath (name: string): string {
    return Platform.OS === 'ios'
        ? `${RNBlobUtil.fs.dirs.MainBundleDir}/${name}.${VIDEO_EXT}`
        : `bundle-assets://videos/${name}.${VIDEO_EXT}`;
}

const DOM_READY = 'NEST_BIRD_DOM_READY';
const MESSAGES = {
    VIDEO_LOADED: 'NEST_BIRD_VIDEO_LOADED',
    VIDEO_FAILED: 'NEST_BIRD_VIDEO_FAILED',
} as const;

function createNestBirdHtml (): string {
    return `
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width, maximum-scale=1.0, user-scalable=no">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        width: 100%; height: 100%;
        background: transparent;
        overflow: visible;
      }
      #videoContainer {
        width: 100%; height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: visible;
      }
      video {
        width: 100%; height: 100%;
        object-fit: contain;
      }
    </style>
    <script>
      document.addEventListener("DOMContentLoaded", function() {
        window.ReactNativeWebView.postMessage("${DOM_READY}");
      });
    </script>
  </head>
  <body>
    <div id="videoContainer">
      <video
        autoplay
        id="video"
        playsinline
        onerror="window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${MESSAGES.VIDEO_FAILED}' }))"
        onloadeddata="window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${MESSAGES.VIDEO_LOADED}' }))"
      >
        <source id="source" type="${VIDEO_MIME}" />
      </video>
    </div>
  </body>
</html>
`;
}

const CLIP_NAME = 'nest_bird';

const styles = StyleSheet.create({
    wrap: {
        width: NEST_BIRD_ANIMATION_CONFIG.width,
        height: NEST_BIRD_ANIMATION_CONFIG.height,
        marginTop: NEST_BIRD_ANIMATION_CONFIG.marginTop,
        marginBottom: NEST_BIRD_ANIMATION_CONFIG.marginBottom,
        marginLeft: NEST_BIRD_ANIMATION_CONFIG.marginLeft,
        marginRight: NEST_BIRD_ANIMATION_CONFIG.marginRight,
        overflow: 'hidden',
    },
    webView: {
        backgroundColor: 'transparent',
        width: NEST_BIRD_ANIMATION_CONFIG.width,
        height: NEST_BIRD_ANIMATION_CONFIG.height,
    },
});

export const NestBird = () => {
    const webViewRef = useRef<WebView>(null);
    const [base64, setBase64] = useState<string | null>(null);
    const [domReady, setDomReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const b64 = await RNBlobUtil.fs.readFile(
                    getVideoAssetPath(CLIP_NAME),
                    'base64'
                );
                if (!cancelled) {
                    setBase64(b64);
                }
            } catch (e) {
                console.error('NestBird: failed to load video', e);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const injectVideo = useCallback(() => {
        if (!base64 || !webViewRef.current) {
            return;
        }
        webViewRef.current.injectJavaScript(`
(function() {
  try {
    if (!window.__NEST_VIDEO__) window.__NEST_VIDEO__ = document.getElementById("video");
    if (!window.__NEST_SOURCE__) window.__NEST_SOURCE__ = document.getElementById("source");
    var v = window.__NEST_VIDEO__;
    v.pause();
    v.loop = false;
    v.removeAttribute("loop");
    window.__NEST_SOURCE__.src = "data:${VIDEO_MIME};base64,${base64}";
    v.onended = null;
    v.load();
    v.play();
    v.style.transform = "none";
    v.style.transformOrigin = "center";
    v.style.objectFit = "contain";
  } catch (e) {
    console.log("NestBird inject error", e);
  }
  true;
})();
`);
    }, [base64]);

    useEffect(() => {
        if (base64 && domReady) {
            injectVideo();
        }
    }, [base64, domReady, injectVideo]);

    const onMessage = useCallback((event: WebViewMessageEvent) => {
        const message = event.nativeEvent.data;
        if (message === DOM_READY) {
            setDomReady(true);
            return;
        }
        try {
            JSON.parse(message);
        } catch {
            // ignore
        }
    }, []);

    if (!base64) {
        return null;
    }

    return (
        <View style={styles.wrap} pointerEvents="none">
            <WebView
                ref={webViewRef}
                incognito
                cacheEnabled={false}
                cacheMode="LOAD_NO_CACHE"
                onMessage={onMessage}
                onError={() => {}}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                originWhitelist={['*']}
                source={{ html: createNestBirdHtml() }}
                style={styles.webView}
            />
        </View>
    );
};
