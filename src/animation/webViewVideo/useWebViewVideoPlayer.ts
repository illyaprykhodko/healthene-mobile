import type WebView from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import type { WebViewMessageEvent } from 'react-native-webview/src/WebViewTypes.ts';
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';

import {
    buildSetMutedScript,
    buildSwapClipScript,
    buildResumeActiveScript,
    type SwapClipScriptOptions,
} from './inject';
import { preloadVideoAssets } from './assets';
import { createDualVideoWebViewHtml } from './html';
import { createWebViewVideoCommonProps } from './webViewProps';
import { isDomReadyMessage, parseWebViewVideoMessage, WEBVIEW_VIDEO_MESSAGE } from './messages';

export type UseWebViewVideoPlayerOptions = {
  muted?: boolean;
  clipNames: string[];
  viewportWidth: number;
  viewportHeight: number;
  domReadyMessage: string;
  endedMessageType?: string;
};

export type SwapClipParams = Omit<SwapClipScriptOptions, 'base64' | 'muted' | 'endedMessageType'> & {
    clipName: string;
};

export function useWebViewVideoPlayer ({
    domReadyMessage,
    viewportWidth,
    viewportHeight,
    clipNames,
    muted = false,
    endedMessageType = WEBVIEW_VIDEO_MESSAGE.VIDEO_ENDED,
}: UseWebViewVideoPlayerOptions) {
    const webViewRef = useRef<WebView>(null);
    const lastSwapKeyRef = useRef('');
    const [domReady, setDomReady] = useState(false);
    const [webViewGeneration, setWebViewGeneration] = useState(0);
    const [videosLoaded, setVideosLoaded] = useState(false);
    const [videoCache, setVideoCache] = useState<Map<string, string>>(new Map());

    const mutedRef = useRef(muted);
    useEffect(() => { mutedRef.current = muted; }, [muted]);

    const html = useMemo(
        () => createDualVideoWebViewHtml({
            domReadyMessage,
            width: viewportWidth,
            height: viewportHeight,
        }),
        [domReadyMessage, viewportWidth, viewportHeight],
    );

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const cache = await preloadVideoAssets(clipNames);
            if (!cancelled) {
                setVideoCache(cache);
                setVideosLoaded(true);
            }
        })();
        return () => { cancelled = true; };
    }, [clipNames]);

    useEffect(() => {
        webViewRef.current?.injectJavaScript(buildSetMutedScript(muted));
    }, [muted]);

    useFocusEffect(
        useCallback(() => {
            webViewRef.current?.injectJavaScript(buildSetMutedScript(mutedRef.current));
            webViewRef.current?.injectJavaScript(buildResumeActiveScript());
        }, []),
    );

    const swapClip = useCallback((
        params: SwapClipParams,
        ref: RefObject<WebView | null> = webViewRef,
    ) => {
        const base64 = videoCache.get(params.clipName);
        if (!base64 || !ref.current) {
            return;
        }
        const swapKey = `${params.clipName}:${params.phaseTag}:${params.loopInPage ?? false}:${params.postEnded ?? true}`;
        if (lastSwapKeyRef.current === swapKey) {
            return;
        }
        lastSwapKeyRef.current = swapKey;
        const { clipName: _clipName, ...swapOpts } = params;
        ref.current.injectJavaScript(buildSwapClipScript({
            ...swapOpts,
            base64,
            muted: mutedRef.current,
            endedMessageType,
        }));
    }, [videoCache, endedMessageType]);

    const createMessageHandler = useCallback((
        onEnded?: (phase: string) => void,
        extraPlainMessages?: Record<string, () => void>,
    ) => (event: WebViewMessageEvent) => {
        const message = event.nativeEvent.data;
        if (isDomReadyMessage(message, domReadyMessage)) {
            lastSwapKeyRef.current = '';
            setWebViewGeneration(g => g + 1);
            setDomReady(true);
            return;
        }
        if (extraPlainMessages?.[message]) {
            extraPlainMessages[message]();
            return;
        }
        const data = parseWebViewVideoMessage(message);
        if (data?.type === endedMessageType && 'phase' in data && data.phase && onEnded) {
            onEnded(data.phase);
        }
    }, [domReadyMessage, endedMessageType]);

    const commonWebViewProps = useMemo(
        () => createWebViewVideoCommonProps(() => {}),
        [],
    );

    return {
        webViewRef,
        html,
        domReady,
        webViewGeneration,
        videosLoaded,
        videoCache,
        swapClip,
        createMessageHandler,
        commonWebViewProps,
    };
}
