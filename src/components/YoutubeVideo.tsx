// outsource dependencies
import { ActivityIndicator, View } from 'react-native';
import React, { useCallback, useMemo, useState } from 'react';
import YoutubePlayer, {
    YoutubeIframeProps,
} from 'react-native-youtube-iframe';

// local dependencies
import { useTheme } from 'hooks/useTheme';
import { MessageService } from 'services/messages';

const YOUTUBE_ID_REGEX
    = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;

const prepareYoutubeId = (url: string): string | null => {
    const match = YOUTUBE_ID_REGEX.exec(url);
    return match && match[1] ? match[1] : null;
};

export interface YoutubeVideoProps
    extends Omit<YoutubeIframeProps, 'videoId' | 'height'> {
    url: string;
    height?: number;
}

const YoutubeVideo: React.FC<YoutubeVideoProps> = props => {
    const theme = useTheme();
    const { url, height, ...rest } = props;

    const videoId = useMemo(() => prepareYoutubeId(url), [url]);
    const [isReady, setIsReady] = useState(false);
    const handleError = useCallback(
        (error: string) => {
            MessageService.error({
                message: error ?? 'Youtube player error',
                title: 'Youtube player error',
            });
        },
        []
    );

    if (!videoId) {
        return null;
    }

    const handleReady = useCallback(() => {
        setIsReady(true);
    }, []);

    return (
        <View style={{ backgroundColor: theme.colors.background, position: 'relative' }}>
            {!isReady ? <ActivityIndicator style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }} size="large" color={theme.colors.primary} /> : null}
            <YoutubePlayer
                videoId={videoId}
                onError={handleError}
                onReady={handleReady}
                height={height ?? 200}
                {...rest}
            />
        </View>
    );
};

export default YoutubeVideo;
