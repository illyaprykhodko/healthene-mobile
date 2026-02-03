// outsource dependencies
import React, { memo, useState, useCallback } from 'react';
import { StyleSheet, View, Dimensions, Alert } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

// local dependencies
import { useTheme } from 'hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16; // 16:9 aspect ratio

// Extract YouTube video ID from various URL formats
const prepareYoutubeId = (url: string): string | null => {
    try {
        // Regex to parse YouTube URLs (including shorts, embed, full, and short URLs)
        const regex = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/;
        const match = regex.exec(url);
        return match ? match[1] : null;
    } catch {
        return null;
    }
};

interface YoutubeVideoProps {
    url: string;
    controls?: boolean;
    autoPlay?: boolean;
    onEnd?: () => void;
    onReady?: () => void;
}

const YoutubeVideo: React.FC<YoutubeVideoProps> = memo(({
    url,
    onEnd,
    onReady,
    controls = true,
    autoPlay = false,
}) => {
    const theme = useTheme();
    const [isPlaying, setIsPlaying] = useState(autoPlay);

    const videoId = prepareYoutubeId(url);

    const handleError = useCallback((error: string) => {
        console.error('YouTube Player Error:', error);
        Alert.alert('Video Error', 'Failed to load video. Please try again.');
    }, []);

    const handleStateChange = useCallback((state: string) => {
        if (state === 'ended') {
            setIsPlaying(false);
            onEnd?.();
        }
    }, [onEnd]);

    if (!videoId) {
        return (
            <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
                <View style={styles.errorContainer}>
                    {/* Error placeholder */}
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.wrapper, { backgroundColor: theme.colors.primary }]}>
            <YoutubePlayer
                play={isPlaying}
                videoId={videoId}
                onReady={onReady}
                height={VIDEO_HEIGHT}
                onError={handleError}
                onChangeState={handleStateChange}
            />
        </View>
    );
});

export default YoutubeVideo;

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        overflow: 'hidden',
    },
    errorContainer: {
        height: VIDEO_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
