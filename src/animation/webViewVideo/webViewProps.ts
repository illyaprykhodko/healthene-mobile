import type { WebViewMessageEvent } from 'react-native-webview/src/WebViewTypes.ts';

export function createWebViewVideoCommonProps (onMessage: (event: WebViewMessageEvent) => void) {
    return {
        incognito: true as const,
        cacheEnabled: false,
        onMessage,
        cacheMode: 'LOAD_NO_CACHE' as const,
        onError: (_e: unknown) => {},
        allowsInlineMediaPlayback: true,
        mediaPlaybackRequiresUserAction: false,
        javaScriptEnabled: true,
        originWhitelist: ['*' as const],
    };
}
