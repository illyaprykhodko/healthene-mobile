// outsource dependencies
import { WebView } from 'react-native-webview';
import { StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// local dependencies
import {
    isDomReadyMessage,
    preloadVideoAssets,
    buildSetMutedScript,
    buildSwapClipScript,
    createDualVideoWebViewHtml,
    createWebViewVideoCommonProps,
    buildBranchSittingClipStyleJs,
    buildBranchAppearingClipStyleJs,
} from './webViewVideo';

// ============================================================================
// ANIMATION PHASES: appearing → sitting (loop)
// ============================================================================
export const BranchBirdPhase = {
    APPEARING: 'APPEARING',
    SITTING: 'SITTING',
} as const;

export type BranchBirdPhase = (typeof BranchBirdPhase)[keyof typeof BranchBirdPhase];

export type BranchBirdVideoConfig = {
    width: number;
    height: number;
    top: number;
    right: number;
};

/** Fixed WebView size — layout position varies per phase; clip CSS handles APPEARING vs SITTING framing. */
const BRANCH_VIEWPORT = 370;

export const BRANCH_BIRD_CONFIG: Record<BranchBirdPhase, BranchBirdVideoConfig> = {
    [BranchBirdPhase.APPEARING]: {
        width: BRANCH_VIEWPORT,
        height: BRANCH_VIEWPORT,
        top: 11,
        right: -75,
    },
    [BranchBirdPhase.SITTING]: {
        width: BRANCH_VIEWPORT,
        height: BRANCH_VIEWPORT,
        top: 24,
        right: 4,
    },
};

const PHASE_VIDEO_MAP: Record<BranchBirdPhase, string> = {
    [BranchBirdPhase.APPEARING]: 'check5',
    [BranchBirdPhase.SITTING]: 'sitting',
};

const DOM_READY = 'BRANCH_BIRD_DOM_READY';
const ENDED_MESSAGE = 'BRANCH_BIRD_VIDEO_ENDED';

const html = createDualVideoWebViewHtml({
    domReadyMessage: DOM_READY,
    width: BRANCH_VIEWPORT,
    height: BRANCH_VIEWPORT,
});

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
        width: BRANCH_VIEWPORT,
        height: BRANCH_VIEWPORT,
    },
});

interface BranchBirdProps {
    muted?: boolean;
}

export const BranchBird = ({ muted = false }: BranchBirdProps) => {
    const webViewRef = useRef<WebView>(null);
    const [phase, setPhase] = useState<BranchBirdPhase>(BranchBirdPhase.APPEARING);
    const phaseRef = useRef<BranchBirdPhase>(BranchBirdPhase.APPEARING);
    const [domReady, setDomReady] = useState(false);
    const [webViewGeneration, setWebViewGeneration] = useState(0);
    const [videosLoaded, setVideosLoaded] = useState(false);
    const [videoCache, setVideoCache] = useState<Map<string, string>>(new Map());

    const mutedRef = useRef(muted);
    useEffect(() => { mutedRef.current = muted; }, [muted]);

    const config = BRANCH_BIRD_CONFIG[phase];

    useLayoutEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const names = Object.values(PHASE_VIDEO_MAP);
            const cache = await preloadVideoAssets(names);
            if (!cancelled) {
                setVideoCache(cache);
                setVideosLoaded(true);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        webViewRef.current?.injectJavaScript(buildSetMutedScript(muted));
    }, [muted]);

    const injectPhase = useCallback((targetPhase: BranchBirdPhase) => {
        const clipName = PHASE_VIDEO_MAP[targetPhase];
        const base64 = videoCache.get(clipName);
        if (!base64 || !webViewRef.current) {
            return;
        }
        const isSitting = targetPhase === BranchBirdPhase.SITTING;
        const clipStyleJs = isSitting
            ? buildBranchSittingClipStyleJs()
            : buildBranchAppearingClipStyleJs();

        webViewRef.current.injectJavaScript(buildSwapClipScript({
            base64,
            phaseTag: targetPhase,
            muted: mutedRef.current,
            loopInPage: isSitting,
            postEnded: !isSitting,
            endedMessageType: ENDED_MESSAGE,
            clipStyleJs,
        }));
    }, [videoCache]);

    useEffect(() => {
        if (!videosLoaded || !domReady) {
            return;
        }
        injectPhase(phase);
    }, [phase, domReady, webViewGeneration, videosLoaded, injectPhase]);

    const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
        const message = event.nativeEvent.data;
        if (isDomReadyMessage(message, DOM_READY)) {
            setWebViewGeneration(g => g + 1);
            setDomReady(true);
            return;
        }
        try {
            const data = JSON.parse(message) as { type?: string; phase?: string };
            if (data.type === ENDED_MESSAGE && data.phase) {
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

    return (
        <View style={styles.root} pointerEvents="none">
            <View style={[styles.container, { top: config.top, right: config.right }]}>
                <WebView
                    {...createWebViewVideoCommonProps(onMessage)}
                    ref={webViewRef}
                    source={{ html }}
                    style={styles.webView}
                />
            </View>
        </View>
    );
};
