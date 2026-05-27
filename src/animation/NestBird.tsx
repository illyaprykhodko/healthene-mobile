// outsource dependencies
import { WebView } from 'react-native-webview';
import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

// local dependencies
import { useWebViewVideoPlayer } from './webViewVideo';

/** Size, spacing, and offsets for {@link NestBird} — edit here only. */
export const NEST_BIRD_ANIMATION_CONFIG = {
    width: 100,
    height: 100,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: -14,
    marginRight: 0,
} as const;

const DOM_READY = 'NEST_BIRD_DOM_READY';
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
    const {
        html,
        domReady,
        swapClip,
        webViewRef,
        videosLoaded,
        webViewGeneration,
        commonWebViewProps,
        createMessageHandler,
    } = useWebViewVideoPlayer({
        domReadyMessage: DOM_READY,
        viewportWidth: NEST_BIRD_ANIMATION_CONFIG.width,
        viewportHeight: NEST_BIRD_ANIMATION_CONFIG.height,
        clipNames: [CLIP_NAME],
    });

    const onMessage = useCallback(
        createMessageHandler(),
        [createMessageHandler],
    );

    useEffect(() => {
        if (domReady && videosLoaded) {
            swapClip({
                clipName: CLIP_NAME,
                phaseTag: CLIP_NAME,
                postEnded: false,
            });
        }
    }, [domReady, webViewGeneration, videosLoaded, swapClip]);

    if (!videosLoaded) {
        return null;
    }

    return (
        <View style={styles.wrap} pointerEvents="none">
            <WebView
                {...commonWebViewProps}
                ref={webViewRef}
                onMessage={onMessage}
                style={styles.webView}
                source={{ html }}
            />
        </View>
    );
};
