// outsource dependencies
import React, { memo, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useNavigation, useRoute, StackActions } from '@react-navigation/native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
// import { ROUTES } from 'constants/routes';
import YoutubeVideo from 'components/YoutubeVideo';
import PrivateVideo from 'components/PrivateVideo';
import { VIDEO_LIBRARY_TYPE } from 'constants/spec';
import {
    useMarkGeneralVideoWatchedMutation,
    useMarkOverviewVideoWatchedMutation,
    useMarkHealthProfileVideoWatchedMutation,
} from 'store/api/videoApi';
import type { Attachment } from 'types/video';

interface VideoScreenParams {
    id?: number;
    video: Attachment;
    backLink: string;
    library: string;
}

const VideoScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const params: VideoScreenParams = route.params || {};
    const { id, video, backLink, library } = params;

    const [markHealthProfileWatched] = useMarkHealthProfileVideoWatchedMutation();
    const [markGeneralWatched] = useMarkGeneralVideoWatchedMutation();
    const [markOverviewWatched] = useMarkOverviewVideoWatchedMutation();

    // Mark video as watched when screen loads
    useEffect(() => {
        if (!id) { return; }

        const markAsWatched = async () => {
            try {
                switch (library) {
                    case VIDEO_LIBRARY_TYPE.HEALTH_PROFILE:
                        await markHealthProfileWatched(id).unwrap();
                        break;
                    case VIDEO_LIBRARY_TYPE.GENERAL_VIDEO:
                        await markGeneralWatched(id).unwrap();
                        break;
                    case VIDEO_LIBRARY_TYPE.OVERVIEW_VIDEO:
                        await markOverviewWatched(id).unwrap();
                        break;
                    default:
                        console.log('Unknown library type:', library);
                }
            } catch (error) {
                console.error('Failed to mark video as watched:', error);
            }
        };

        markAsWatched();
    }, [id, library, markHealthProfileWatched, markGeneralWatched, markOverviewWatched]);

    const handleClose = useCallback(() => {
        if (backLink) {
            // Try to pop back to the backLink screen
            const state = navigation.getState();
            if (state?.routes) {
                const backLinkIndex = state.routes.findIndex(
                    (r: any) => r.name === backLink
                );
                if (backLinkIndex >= 0 && backLinkIndex < state.index) {
                    const popCount = state.index - backLinkIndex;
                    navigation.dispatch(StackActions.pop(popCount));
                    return;
                }
            }
            navigation.navigate(backLink);
        } else {
            navigation.goBack();
        }
    }, [backLink, navigation]);

    const renderVideoPlayer = () => {
        if (!video) {
            return (
                <View style={styles.noVideoContainer}>
                    <Text
                        variant="h4"
                        color={theme.colors.text}
                        textAlign="center"
                    >
                        No video available
                    </Text>
                </View>
            );
        }

        // Check if it's a YouTube video
        if (video.embedUrl) {
            return <YoutubeVideo url={video.embedUrl} />;
        }

        // Otherwise, play from server
        return <PrivateVideo video={video} paused={false} />;
    };

    return (
        <Screen initialized style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {video?.title && (
                    <Text
                        variant="h3"
                        style={[styles.title, { color: theme.colors.text }]}
                    >
                        {video.title}
                    </Text>
                )}
                {renderVideoPlayer()}
                {video?.description && (
                    <Text
                        style={[styles.description, { color: theme.colors.text }]}
                    >
                        {video.description}
                    </Text>
                )}
            </ScrollView>
            <View style={styles.buttonContainer}>
                <Button
                    title="CLOSE"
                    variant="primary"
                    onPress={handleClose}
                />
            </View>
        </Screen>
    );
};

export default memo(VideoScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 0,
        paddingRight: 0,
    },
    scrollContent: {
        flexGrow: 1,
    },
    title: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    noVideoContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    buttonContainer: {
        padding: OFFSET.HORIZONTAL,
        paddingBottom: OFFSET.VERTICAL * 2,
    },
});
