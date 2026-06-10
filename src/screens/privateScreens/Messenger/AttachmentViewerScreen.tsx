// outsource dependencies
import React from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

// local dependencies
import { ROUTES } from 'constants/routes.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { RootStackParamList } from 'services/navigation';

type AttachmentViewerRoute = RouteProp<RootStackParamList, typeof ROUTES.MESSENGER_ATTACHMENT_VIEWER>;

type ViewerKind = 'video' | 'audio' | 'image' | 'unsupported';

const kindFor = (mimeType: string): ViewerKind => {
    const [primary] = mimeType.split('/');
    if (primary === 'video') { return 'video'; }
    if (primary === 'audio') { return 'audio'; }
    if (primary === 'image') { return 'image'; }
    return 'unsupported';
};

const buildHtml = (uri: string, mimeType: string, backgroundColor: string) => {
    const kind = kindFor(mimeType);

    // Common page chrome — dark background, centered content, no scroll.
    const layout = `
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background: ${backgroundColor};
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
    `;

    if (kind === 'video') {
        return `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" /><style>${layout}
            video { width: 100%; height: 100%; object-fit: contain; background: ${backgroundColor}; }
        </style></head><body><video controls autoplay playsinline preload="auto" src="${uri}"></video></body></html>`;
    }

    if (kind === 'image') {
        return `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /><style>${layout}
            img { max-width: 100%; max-height: 100%; object-fit: contain; }
        </style></head><body><img src="${uri}" /></body></html>`;
    }

    if (kind === 'audio') {
        // Centered HTML5 audio player with a generic music glyph above it.
        return `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" /><style>${layout}
            body { flex-direction: column; gap: 32px; padding: 24px; box-sizing: border-box; }
            .glyph { font-size: 96px; color: #888; line-height: 1; }
            audio { width: 100%; max-width: 480px; }
        </style></head><body>
            <div class="glyph">🎵</div>
            <audio controls autoplay preload="auto" src="${uri}"></audio>
        </body></html>`;
    }

    // unsupported — show a small message; the navigator's back button gets the user out.
    return `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>${layout}
        .msg { color: #ddd; font-family: -apple-system, Roboto, Arial, sans-serif; font-size: 16px; text-align: center; padding: 24px; }
    </style></head><body><div class="msg">This file type can't be previewed in-app.<br/>Use the download button to open it with another app.</div></body></html>`;
};

const AttachmentViewerScreen = () => {
    const theme = useTheme();
    const route = useRoute<AttachmentViewerRoute>();
    const uri = route.params?.uri ?? '';
    const mimeType = route.params?.mimeType ?? '';

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.black }]}>
            <WebView
                allowFileAccess
                originWhitelist={['*']}
                allowsInlineMediaPlayback
                allowFileAccessFromFileURLs
                allowUniversalAccessFromFileURLs
                mediaPlaybackRequiresUserAction={false}
                source={{ html: buildHtml(uri, mimeType, theme.colors.black) }}
                style={[styles.webview, { backgroundColor: theme.colors.black }]}
            />
        </View>
    );
};

export default AttachmentViewerScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
});
