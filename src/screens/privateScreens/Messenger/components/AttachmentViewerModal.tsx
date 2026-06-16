// outsource dependencies
import React from 'react';
import { WebView } from 'react-native-webview';
import Icon from '@react-native-vector-icons/material-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Modal, Pressable, StatusBar, StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';

interface AttachmentViewerModalProps {
    uri: string;
    title?: string;
    mimeType: string;
    onClose: () => void;
}

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

    const layout = `
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: flex;
            overflow: hidden;
            align-items: center;
            justify-content: center;
            background: ${backgroundColor};
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
        return `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" /><style>${layout}
            body { flex-direction: column; gap: 32px; padding: 24px; box-sizing: border-box; }
            .glyph { font-size: 96px; color: #888; line-height: 1; }
            audio { width: 100%; max-width: 480px; }
        </style></head><body>
            <div class="glyph">🎵</div>
            <audio controls autoplay preload="auto" src="${uri}"></audio>
        </body></html>`;
    }

    return `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>${layout}
        .msg { color: #ddd; font-family: -apple-system, Roboto, Arial, sans-serif; font-size: 16px; text-align: center; padding: 24px; }
    </style></head><body><div class="msg">This file type can't be previewed in-app.<br/>Use the download button to open it with another app.</div></body></html>`;
};

export const AttachmentViewerModal = ({ uri, mimeType, title, onClose }: AttachmentViewerModalProps) => {
    const theme = useTheme();
    return (
        <Modal
            visible
            statusBarTranslucent
            animationType="slide"
            onRequestClose={onClose}
        >
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.headerBg} />
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.headerBg }}>
                <View style={styles.header}>
                    <Text
                        variant="h4"
                        numberOfLines={1}
                        style={styles.title}
                        color={theme.colors.headerText}
                    >
                        {title || 'Preview'}
                    </Text>
                    <Pressable
                        hitSlop={12}
                        onPress={onClose}
                        style={styles.closeButton}
                    >
                        <Icon name="close" size={28} color={theme.colors.headerText} />
                    </Pressable>
                </View>
            </SafeAreaView>
            <SafeAreaView
                edges={['bottom']}
                style={[styles.container, { backgroundColor: theme.colors.background }]}
            >
                <WebView
                    allowFileAccess
                    originWhitelist={['*']}
                    allowsInlineMediaPlayback
                    allowFileAccessFromFileURLs
                    allowUniversalAccessFromFileURLs
                    mediaPlaybackRequiresUserAction={false}
                    source={{ html: buildHtml(uri, mimeType, theme.colors.background) }}
                    style={[styles.webview, { backgroundColor: theme.colors.background }]}
                />
            </SafeAreaView>
        </Modal>
    );
};

export default AttachmentViewerModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
    header: {
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        // Reserve right gutter for the absolutely-positioned close button so the
        // centered title never overlaps it.
        paddingHorizontal: 60,
    },
    title: {
        flex: 1,
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        right: 12,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
