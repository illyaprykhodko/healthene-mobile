// outsource dependencies
import { WebView } from 'react-native-webview';
import RNBlobUtil from 'react-native-blob-util';
import { Platform, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WebViewMessageEvent } from 'react-native-webview/src/WebViewTypes.ts';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// ============================================================================
// PLATFORM ASSET RESOLUTION
// ============================================================================
const VIDEO_EXT = Platform.OS === 'ios' ? 'mov' : 'webm';
const VIDEO_MIME = Platform.OS === 'ios' ? 'video/quicktime' : 'video/webm';

function getVideoAssetPath (name: string): string {
    return Platform.OS === 'ios'
        ? `${RNBlobUtil.fs.dirs.MainBundleDir}/${name}.${VIDEO_EXT}`
        : `bundle-assets://videos/${name}.${VIDEO_EXT}`;
}

// ============================================================================
// ANIMATION PHASES: appearing → sitting (loop)
// ============================================================================
export const BranchBirdPhase = {
    APPEARING: 'APPEARING',
    SITTING: 'SITTING',
} as const;

export type BranchBirdPhase = (typeof BranchBirdPhase)[keyof typeof BranchBirdPhase];

// ============================================================================
// CONFIGURABLE CONSTANTS — one entry per phase
// ============================================================================
export type BranchBirdVideoConfig = {
    width: number;
    height: number;
    top: number;
    right: number;
};

export const BRANCH_BIRD_CONFIG: Record<BranchBirdPhase, BranchBirdVideoConfig> = {
    [BranchBirdPhase.APPEARING]: {
        width: 370,
        height: 370,
        top: 11,
        right: -75,
    },
    [BranchBirdPhase.SITTING]: {
        width: 80,
        height: 80,
        top: 24,
        right: 4,
    },
};

const PHASE_VIDEO_MAP: Record<BranchBirdPhase, string> = {
    [BranchBirdPhase.APPEARING]: 'check5',
    [BranchBirdPhase.SITTING]: 'sitting',
};

// ============================================================================
// WEBVIEW MESSAGES
// ============================================================================
const WEBVIEW_MESSAGES = {
    DOM_READY: 'BRANCH_BIRD_DOM_READY',
    VIDEO_ENDED: 'BRANCH_BIRD_VIDEO_ENDED',
    VIDEO_LOADED: 'BRANCH_BIRD_VIDEO_LOADED',
    VIDEO_FAILED: 'BRANCH_BIRD_VIDEO_FAILED',
} as const;

function createBranchBirdHtml (): string {
    return `
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width, maximum-scale=1.0, user-scalable=no">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; background: transparent; overflow: visible; }
      #videoContainer { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: visible; }
      video { width: 100%; height: 100%; object-fit: contain; }
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
        autoplay
        id="video"
        playsinline
        onerror="window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${WEBVIEW_MESSAGES.VIDEO_FAILED}' }))"
        onloadeddata="window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${WEBVIEW_MESSAGES.VIDEO_LOADED}' }))"
      >
        <source id="source" type="${VIDEO_MIME}" />
      </video>
    </div>
  </body>
</html>
`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
interface BranchBirdProps {
    muted?: boolean;
}

export const BranchBird = ({ muted = false }: BranchBirdProps) => {
    const webViewRef = useRef<WebView>(null);
    const [phase, setPhase] = useState<BranchBirdPhase>(BranchBirdPhase.APPEARING);
    const phaseRef = useRef<BranchBirdPhase>(BranchBirdPhase.APPEARING);
    const [domReady, setDomReady] = useState(false);
    const [videosLoaded, setVideosLoaded] = useState(false);
    const [videoCache, setVideoCache] = useState<Map<BranchBirdPhase, string>>(new Map());

    const mutedRef = useRef(muted);
    useEffect(() => { mutedRef.current = muted; }, [muted]);

    const applyMuted = useCallback((isMuted: boolean) => {
        const js = `(function(){
            var v = window.__VIDEO__ || document.getElementById("video");
            if (v) {
                window.__VIDEO__ = v;
                v.muted = ${isMuted ? 'true' : 'false'};
            }
            true;
        })();`;
        webViewRef.current?.injectJavaScript(js);
    }, []);

    useEffect(() => {
        applyMuted(muted);
    }, [muted, applyMuted]);

    useFocusEffect(
        useCallback(() => {
            applyMuted(mutedRef.current);
            const js = `(function(){
                var v = window.__VIDEO__ || document.getElementById("video");
                if (v && v.paused) { v.play(); }
                true;
            })();`;
            webViewRef.current?.injectJavaScript(js);
        }, [applyMuted])
    );

    useLayoutEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const cache = new Map<BranchBirdPhase, string>();
            for (const [phaseKey, clipName] of Object.entries(PHASE_VIDEO_MAP) as [BranchBirdPhase, string][]) {
                try {
                    const base64 = await RNBlobUtil.fs.readFile(
                        getVideoAssetPath(clipName),
                        'base64'
                    );
                    cache.set(phaseKey, base64);
                } catch (e) {
                    console.error(`BranchBird: failed to load ${clipName}`, e);
                }
            }
            if (!cancelled) {
                setVideoCache(cache);
                setVideosLoaded(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const injectVideo = useCallback((targetPhase: BranchBirdPhase) => {
        const base64 = videoCache.get(targetPhase);
        if (!base64 || !webViewRef.current) {
            return;
        }
        const isSitting = targetPhase === BranchBirdPhase.SITTING;
        webViewRef.current.injectJavaScript(`
(function() {
  try {
    if (!window.__VIDEO__) window.__VIDEO__ = document.getElementById("video");
    if (!window.__SOURCE__) window.__SOURCE__ = document.getElementById("source");
    var v = window.__VIDEO__;
    v.pause();
    v.loop = false;
    v.removeAttribute("loop");
    window.__SOURCE__.src = "data:${VIDEO_MIME};base64,${base64}";
    if (${isSitting ? 'true' : 'false'}) {
      v.onended = function() {
        try { v.currentTime = 0; v.play(); } catch (e) {}
      };
    } else {
      v.onended = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "${WEBVIEW_MESSAGES.VIDEO_ENDED}",
          phase: "${targetPhase}"
        }));
      };
    }
    v.load();
    v.play();
    v.muted = ${mutedRef.current ? 'true' : 'false'};
    v.style.transform = "none";
    v.style.transformOrigin = "center";
    v.style.objectFit = "contain";
  } catch (e) {
    console.log("BranchBird inject error", e);
  }
  true;
})();
`);
    }, [videoCache]);

    useEffect(() => {
        if (!videosLoaded || !domReady) {
            return;
        }
        injectVideo(phase);
    }, [phase, domReady, videosLoaded, injectVideo]);

    const onMessage = useCallback((event: WebViewMessageEvent) => {
        const message = event.nativeEvent.data;
        if (message === WEBVIEW_MESSAGES.DOM_READY) {
            setDomReady(true);
            return;
        }
        try {
            const data = JSON.parse(message);
            if (data.type === WEBVIEW_MESSAGES.VIDEO_ENDED) {
                const endedPhase = data.phase as BranchBirdPhase;
                if (endedPhase !== phaseRef.current) {
                    return;
                }
                if (endedPhase === BranchBirdPhase.APPEARING) {
                    phaseRef.current = BranchBirdPhase.SITTING;
                    setPhase(BranchBirdPhase.SITTING);
                }
            }
        } catch {
            // ignore non-JSON messages
        }
    }, []);

    const config = BRANCH_BIRD_CONFIG[phase];

    return (
        <View style={styles.root} pointerEvents="none">
            <View style={[styles.container, { top: config.top, right: config.right }]}>
                <WebView
                    incognito
                    ref={webViewRef}
                    javaScriptEnabled
                    onError={() => {}}
                    cacheEnabled={false}
                    onMessage={onMessage}
                    originWhitelist={['*']}
                    cacheMode="LOAD_NO_CACHE"
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    source={{ html: createBranchBirdHtml() }}
                    style={[styles.webView, { width: config.width, height: config.height }]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        position: 'absolute',
        left: 0,
        right: -8,
        top: 0,
        bottom: 0,
        zIndex: 19999997,
    },
    container: {
        position: 'absolute',
    },
    webView: {
        backgroundColor: 'transparent',
    },
});
