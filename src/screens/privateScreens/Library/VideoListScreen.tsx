// outsource dependencies
import React, { memo, useCallback } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity, View, FlatList } from 'react-native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { COLORS } from 'constants/colors';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import YoutubeVideo from 'components/YoutubeVideo';
import PrivateVideo from 'components/PrivateVideo';
import type { VideoItem, Attachment } from 'types/video';

interface VideoListRouteParams {
    videoList: VideoItem[];
}

const VideoListScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const { videoList = [] } = (route.params || {}) as VideoListRouteParams;

    const handleNavigateToVideo = useCallback((video: Attachment) => {
        navigation.navigate(ROUTES.VIDEO, {
            video,
            backLink: ROUTES.VIDEO_LIST,
        });
    }, [navigation]);

    const renderVideoItem = useCallback(({ item }: { item: VideoItem }) => {
        // Get the video attachment - could be nested or direct
        const video: Attachment | undefined = (item as any)?.attachment || item;

        if (!video) { return null; }

        return (
            <TouchableOpacity
                style={styles.listItem}
                onPress={() => handleNavigateToVideo(video)}
            >
                <View style={styles.videoContainer}>
                    {video.embedUrl ? (
                        <View pointerEvents="none">
                            <YoutubeVideo url={video.embedUrl} controls={false} />
                        </View>
                    ) : (
                        <View pointerEvents="none">
                            <PrivateVideo video={video} paused />
                        </View>
                    )}
                </View>
                <Text
                    variant="h4"
                    numberOfLines={2}
                    style={[styles.title, { color: theme.colors.text }]}
                >
                    {video.title || 'Untitled Video'}
                </Text>
            </TouchableOpacity>
        );
    }, [theme.colors.text, handleNavigateToVideo]);

    if (!videoList.length) {
        return (
            <Screen initialized style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Text color={COLORS.GREY} textAlign="center">
                        No video available
                    </Text>
                </View>
            </Screen>
        );
    }

    return (
        <Screen initialized style={styles.container}>
            <FlatList
                data={videoList}
                renderItem={renderVideoItem}
                contentContainerStyle={styles.listContainer}
                keyExtractor={(item, index) => String((item as any)?.id || item?.attachment?.id || index)}
            />
        </Screen>
    );
};

export default memo(VideoListScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 0,
        paddingRight: 0,
    },
    listContainer: {
        paddingBottom: OFFSET.VERTICAL * 2,
    },
    listItem: {
        marginBottom: OFFSET.VERTICAL,
    },
    videoContainer: {
        width: '100%',
        overflow: 'hidden',
    },
    title: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
        marginBottom: OFFSET.VERTICAL,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: OFFSET.VERTICAL,
    },
});
