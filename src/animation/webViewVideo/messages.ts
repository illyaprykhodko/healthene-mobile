export const WEBVIEW_VIDEO_MESSAGE = {
    VIDEO_LOADED: 'WEBVIEW_VIDEO_LOADED',
    VIDEO_FAILED: 'WEBVIEW_VIDEO_FAILED',
    VIDEO_ENDED: 'WEBVIEW_VIDEO_ENDED',
} as const;

export type WebViewVideoEndedMessage = {
    type: typeof WEBVIEW_VIDEO_MESSAGE.VIDEO_ENDED;
    phase: string;
};

export type WebViewVideoJsonMessage =
    | WebViewVideoEndedMessage
    | { type: typeof WEBVIEW_VIDEO_MESSAGE.VIDEO_LOADED }
    | { type: typeof WEBVIEW_VIDEO_MESSAGE.VIDEO_FAILED };

export function parseWebViewVideoMessage (raw: string): WebViewVideoJsonMessage | null {
    try {
        const data = JSON.parse(raw) as WebViewVideoJsonMessage;
        if (data && typeof data.type === 'string') {
            return data;
        }
    } catch {
        // not JSON
    }
    return null;
}

export function isDomReadyMessage (raw: string, domReadyMessage: string): boolean {
    return raw === domReadyMessage;
}
