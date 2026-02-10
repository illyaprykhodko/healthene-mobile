// outsource dependencies
import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import Icon from '@react-native-vector-icons/ionicons';

// local dependencies
import Text from './Text';
import { config } from 'constants';
import { COLORS } from 'constants/colors';
import { useTheme } from 'hooks/useTheme';
import { useAppSelector } from 'store';
import { ATTACHMENT_STATUS } from 'constants/spec';
import type { Attachment } from 'types/video';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16; // 16:9 aspect ratio

// Construct video URL with authentication
const getVideoUrl = (videoId: number, accessToken: string) => {
    const baseUrl = `${config.serviceUrl}/${config.apiPath}`;
    return `${baseUrl}/s3-service/attachment/${videoId}/video.mp4?access_token=${accessToken}`;
};

// Buffer configuration for smoother playback
const bufferConfig = {
    minBufferMs: 5000,
    maxBufferMs: 25000,
    bufferForPlaybackMs: 1500,
    bufferForPlaybackAfterRebufferMs: 3000,
};

interface PrivateVideoProps {
    style?: object;
    paused?: boolean;
    video: Attachment;
    onEnd?: () => void;
}

const PrivateVideo: React.FC<PrivateVideoProps> = memo(({
    video,
    style,
    onEnd,
    paused: initialPaused = true,
}) => {
    const theme = useTheme();
    const accessToken = useAppSelector(state => state.app.accessToken);

    const [state, setState] = useState({
        isLoading: true,
        isPaused: initialPaused,
        fallbackTriggered: false,
    });

    const videoUri = useMemo(() => {
        if (!video?.id || !accessToken) { return null; }
        return getVideoUrl(video.id, accessToken);
    }, [video?.id, accessToken]);

    const handleUpdate = useCallback((newState: Partial<typeof state>) => {
        setState(prev => ({ ...prev, ...newState }));
    }, []);

    // Fallback: if iOS doesn't call onReadyForDisplay
    useEffect(() => {
        if (!state.isLoading || state.fallbackTriggered) {
            return;
        }

        const fallback = setTimeout(() => {
            console.log('Fallback triggered — iOS did NOT call onReadyForDisplay');
            handleUpdate({ isLoading: false, fallbackTriggered: true });
        }, 3000);

        return () => clearTimeout(fallback);
    }, [state.isLoading, state.fallbackTriggered, handleUpdate]);

    const handlePlayToggle = useCallback(() => {
        handleUpdate({ isPaused: !state.isPaused });
    }, [state.isPaused, handleUpdate]);

    const handleError = useCallback((error: any) => {
        console.error('PrivateVideo ERROR:', error);
        handleUpdate({ isLoading: false });
    }, [handleUpdate]);

    const handleLoad = useCallback(() => {
        handleUpdate({ isLoading: false });
    }, [handleUpdate]);

    const handleLoadStart = useCallback(() => {
        handleUpdate({ isLoading: true });
    }, [handleUpdate]);

    const handleReadyForDisplay = useCallback(() => {
        handleUpdate({ isLoading: false });
    }, [handleUpdate]);

    const handleEnd = useCallback(() => {
        handleUpdate({ isPaused: true });
        onEnd?.();
    }, [handleUpdate, onEnd]);

    const renderVideo = useCallback(() => {
        switch (video?.status) {
            case ATTACHMENT_STATUS.COMPLETED:
                return (
                    <View style={[styles.wrapper, style]}>
                        <Video
                            resizeMode="cover"
                            onEnd={handleEnd}
                            onLoad={handleLoad}
                            style={styles.video}
                            onError={handleError}
                            paused={state.isPaused}
                            posterResizeMode="cover"
                            ignoreSilentSwitch="ignore"
                            source={{ uri: videoUri! }}
                            bufferConfig={bufferConfig}
                            controls={!state.isLoading}
                            poster={video?.thumbnailUrl}
                            onLoadStart={handleLoadStart}
                            onReadyForDisplay={handleReadyForDisplay}
                        />

                        {state.isLoading && (
                            <ActivityIndicator
                                animating
                                size="large"
                                color={COLORS.BLUE}
                                style={styles.activityIndicator}
                            />
                        )}

                        {state.isPaused && !state.isLoading && (
                            <TouchableOpacity
                                onPress={handlePlayToggle}
                                style={styles.playButton}
                            >
                                <Icon
                                    size={64}
                                    color="white"
                                    name="play-circle"
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                );

            case ATTACHMENT_STATUS.ERROR:
                return (
                    <View style={[styles.wrapper, styles.errorWrapper]}>
                        <Text color={COLORS.RED} textAlign="center" style={styles.statusText}>
                            There is some error with the video transcoding
                        </Text>
                    </View>
                );

            case ATTACHMENT_STATUS.PENDING:
                return (
                    <View style={[styles.wrapper, styles.pendingWrapper]}>
                        <Text
                            textAlign="center"
                            style={styles.statusText}
                            color={theme.colors.text}
                        >
                            The video will be available soon
                        </Text>
                    </View>
                );

            default:
                return null;
        }
    }, [
        video,
        style,
        state,
        videoUri,
        theme.colors.text,
        handleEnd,
        handleLoad,
        handleError,
        handleLoadStart,
        handlePlayToggle,
        handleReadyForDisplay,
    ]);

    if (!video) {
        return null;
    }

    return renderVideo();
});

export default PrivateVideo;

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        height: VIDEO_HEIGHT,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
    },
    video: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    activityIndicator: {
        position: 'absolute',
        top: '40%',
        left: 70,
        right: 70,
        height: 50,
    },
    playButton: {
        position: 'absolute',
        zIndex: 20,
    },
    statusText: {
        marginVertical: 20,
        marginHorizontal: 20,
    },
    errorWrapper: {
        backgroundColor: '#FFF0F0',
    },
    pendingWrapper: {
        backgroundColor: '#F5F5F5',
    },
});
