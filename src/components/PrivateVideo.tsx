// outsource dependencies
import {
    View,
    ViewStyle,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Video, { OnLoadData, OnProgressData } from 'react-native-video';

// local dependencies
import Text from './Text';
import { config } from 'constants';
import { useAppSelector } from 'store';
import { debounce } from 'utils/general';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { ATTACHMENT_STATUS } from 'constants/spec';
import { useRefreshSessionMutation } from 'store/api/authApi';

const DEFAULT_VIDEO_HEIGHT = 250;

// Buffer configuration for smooth playback (Android only)
const BUFFER_CONFIG = {
    minBufferMs: 5000,
    maxBufferMs: 25000,
    bufferForPlaybackMs: 1500,
    bufferForPlaybackAfterRebufferMs: 3000,
};

interface Attachment {
    id: string | number;
    status?: string;
    url?: string;
}

export interface PrivateVideoProps {
    height?: number;
    muted?: boolean;
    paused?: boolean;
    repeat?: boolean;
    video: Attachment;
    style?: ViewStyle;
    onError?: (error: any) => void;
    onLoad?: (data: OnLoadData) => void;
    onProgress?: (data: OnProgressData) => void;
}

interface VideoState {
    uri: string;
    isPaused: boolean;
    isLoading: boolean;
    isFirstStart: boolean;
    videoId: string | number;
    currentToken: string | null;
}

export const PrivateVideo: React.FC<PrivateVideoProps> = ({
    video,
    style,
    onLoad,
    onError,
    onProgress,
    muted = false,
    paused = true,
    repeat = false,
    height = DEFAULT_VIDEO_HEIGHT,
}) => {
    const theme = useTheme();
    const accessToken = useAppSelector(state => state.app.accessToken);
    const [refreshSession] = useRefreshSessionMutation();

    const getVideoUrl = useCallback(
        (videoId: string | number, token: string | null): string => {
            if (!token) {
                console.warn('PrivateVideo: No access token available');
                return '';
            }
            return `${config.serviceUrl}/${config.apiPath}/s3-service/attachment/${videoId}/video.mp4?access_token=${token}`;
        },
        []
    );

    const [videoState, setVideoState] = useState<VideoState>({
        isLoading: true,
        isPaused: paused,
        videoId: video?.id,
        isFirstStart: !paused,
        currentToken: accessToken,
        uri: getVideoUrl(video?.id, accessToken),
    });

    // Update video URL when token or video changes
    useEffect(() => {
        if (video?.id && accessToken && videoState.videoId !== video.id) {
            setVideoState(prevState => ({
                ...prevState,
                isLoading: true,
                videoId: video.id,
                isFirstStart: true,
                currentToken: accessToken,
                uri: getVideoUrl(video.id, accessToken),
            }));
        }
    }, [video?.id, accessToken, getVideoUrl, videoState.videoId]);

    const updateVideoState = useCallback((updates: Partial<VideoState>) => {
        setVideoState(prevState => ({ ...prevState, ...updates }));
    }, []);

    const handleVideoError = useMemo(
        () =>
            debounce(
                (error: any) => {
                    console.error('PrivateVideo ERROR:', error);

                    // Try to refresh session
                    refreshSession()
                        .unwrap()
                        .then(() => {
                            // eslint-disable-next-line no-console
                            console.log('Session refreshed successfully');
                        })
                        .catch(error => {
                            console.error('Failed to refresh session:', error);
                        });

                    // Call custom error handler if provided
                    onError?.(error);
                },
                2000,
                { leading: true, trailing: false }
            ),
        [refreshSession, onError]
    );

    const handleLoad = useCallback(
        (data: OnLoadData) => {
            updateVideoState({ isFirstStart: true });
            onLoad?.(data);
        },
        [updateVideoState, onLoad]
    );

    const handleLoadStart = useCallback(() => {
        updateVideoState({ isLoading: true });
    }, [updateVideoState]);

    const handleReadyForDisplay = useCallback(() => {
        updateVideoState({ isLoading: false });
    }, [updateVideoState]);

    const handlePlayPress = useCallback(() => {
        updateVideoState({
            isLoading: false,
            isFirstStart: false,
            isPaused: !videoState.isPaused,
        });
    }, [updateVideoState, videoState.isPaused]);

    const renderVideo = useCallback(() => {
        const videoStatus = video?.status || ATTACHMENT_STATUS.COMPLETED;

        switch (videoStatus) {
            case ATTACHMENT_STATUS.ERROR:
                return (
                    <View
                        style={[
                            styles.messageContainer,
                            { backgroundColor: theme.colors.surface, height },
                            style,
                        ]}
                    >
                        <Icon name="alert-circle" size={48} color={theme.colors.error} />
                        <Text
                            style={[styles.messageText, { color: theme.colors.error }]}
                            textAlign="center"
                        >
                            There is some error with the video transcoding
                        </Text>
                    </View>
                );

            case ATTACHMENT_STATUS.PENDING:
                return (
                    <View
                        style={[
                            styles.messageContainer,
                            { backgroundColor: theme.colors.surface, height },
                            style,
                        ]}
                    >
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text
                            style={[styles.messageText, { color: theme.colors.text }]}
                            textAlign="center"
                        >
                            The video will be available soon
                        </Text>
                    </View>
                );

            case ATTACHMENT_STATUS.COMPLETED:
            default:
                if (!videoState.uri) {
                    return (
                        <View
                            style={[
                                styles.messageContainer,
                                { backgroundColor: theme.colors.surface, height },
                                style,
                            ]}
                        >
                            <Icon name="videocam-off" size={48} color={theme.colors.grey} />
                            <Text
                                style={[styles.messageText, { color: theme.colors.grey }]}
                                textAlign="center"
                            >
                                Video not available
                            </Text>
                        </View>
                    );
                }

                return (
                    <View
                        style={[
                            styles.wrapper,
                            videoState.isFirstStart && {
                                backgroundColor: theme.colors.blue,
                            },
                            { height },
                            style,
                        ]}
                    >
                        <Video
                            muted={muted}
                            repeat={repeat}
                            fullscreen={false}
                            onLoad={handleLoad}
                            resizeMode="contain"
                            onProgress={onProgress}
                            onError={handleVideoError}
                            ignoreSilentSwitch="ignore"
                            paused={videoState.isPaused}
                            bufferConfig={BUFFER_CONFIG}
                            onLoadStart={handleLoadStart}
                            source={{ uri: videoState.uri }}
                            controls={!videoState.isFirstStart}
                            onReadyForDisplay={handleReadyForDisplay}
                            style={[
                                styles.video,
                                {
                                    backgroundColor: theme.colors.black,
                                    opacity:
                                        videoState.isLoading || videoState.isFirstStart
                                            ? 0
                                            : 1,
                                },
                            ]}
                        />

                        {videoState.isLoading && (
                            <ActivityIndicator
                                animating
                                size="large"
                                color={theme.colors.cerulean300}
                                style={styles.activityIndicator}
                            />
                        )}

                        {!videoState.isLoading && videoState.isFirstStart && (
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={handlePlayPress}
                                style={styles.playButton}
                            >
                                {videoState.isPaused && (
                                    <Icon
                                        size={64}
                                        name="play-circle"
                                        color={theme.colors.white}
                                    />
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                );
        }
    }, [
        video,
        theme,
        style,
        height,
        muted,
        repeat,
        onProgress,
        videoState,
        handleLoad,
        handleVideoError,
        handlePlayPress,
        handleLoadStart,
        handleReadyForDisplay,
    ]);

    if (!video) {
        return null;
    }

    return renderVideo();
};

export default PrivateVideo;

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
    },
    video: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    messageContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    messageText: {
        marginTop: OFFSET.VERTICAL,
        fontSize: 16,
        fontWeight: '500',
    },
    activityIndicator: {
        position: 'absolute',
        top: '40%',
        left: 0,
        right: 0,
    },
    playButton: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
