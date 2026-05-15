// outsource dependencies
import React, { memo, useCallback, useState } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity, View, FlatList } from 'react-native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { COLORS } from 'constants/colors';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import {
    VIDEO_LIBRARY,
    type VideoItem,
    type FoodTreeItem,
    type DestinationTreeItem,
    type MedicalTermWithVideos,
} from 'types/video';

// Humanize destination names
const humanizeDestination = (destination: string): string => {
    return destination
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
};

interface VideoCategoryRouteParams {
    library: string;
    list: any[];
}

const VideoCategoryScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const { library, list = [] } = (route.params || {}) as VideoCategoryRouteParams;

    // For food tree navigation
    const [foodTreeList, setFoodTreeList] = useState<FoodTreeItem[]>(list as FoodTreeItem[]);

    const handleNavigateToVideoList = useCallback((videoList: VideoItem[]) => {
        navigation.navigate(ROUTES.VIDEO_LIST, { videoList });
    }, [navigation]);

    // Handle food tree navigation
    const handleFoodTreeItem = useCallback((item: FoodTreeItem) => {
        if (item.children && item.attachments) {
            // Navigate deeper into tree
            setFoodTreeList([...item.children, { attachments: item.attachments }]);
        } else if (!item.children) {
            // Navigate to video list
            const videos = item.attachments || [];
            handleNavigateToVideoList(videos);
        }
    }, [handleNavigateToVideoList]);

    const renderDiseaseItem = useCallback(({ item }: { item: MedicalTermWithVideos }) => {
        const alreadySeen = item.seenAttachments || [];
        if (alreadySeen.length === 0) { return null; }

        return (
            <TouchableOpacity
                style={[styles.item, { borderBottomColor: theme.colors.border }]}
                onPress={() => handleNavigateToVideoList(alreadySeen)}
            >
                <Text
                    variant="h4"
                    numberOfLines={1}
                    style={[styles.title, { color: theme.colors.text }]}
                >
                    {item.medicalTerm?.name}
                </Text>
                <Icon
                    size={24}
                    iconStyle="solid"
                    color={COLORS.GREY}
                    name="chevron-right"
                />
            </TouchableOpacity>
        );
    }, [theme.colors, handleNavigateToVideoList]);

    // Render general video item
    const renderGeneralItem = useCallback(({ item }: { item: DestinationTreeItem }) => {
        const videoList = item.attachments || [];
        if (videoList.length === 0) {
            return (
                <Text
                    textAlign="center"
                    color={COLORS.GREY}
                    style={styles.noDataText}
                >
                    No video available TEST
                </Text>
            );
        }

        return (
            <TouchableOpacity
                style={[styles.item, { borderBottomColor: theme.colors.border }]}
                onPress={() => handleNavigateToVideoList(videoList)}
            >
                <Text
                    variant="h4"
                    numberOfLines={1}
                    style={[styles.title, { color: theme.colors.text }]}
                >
                    {humanizeDestination(item.destination)}
                </Text>
                <Icon
                    size={24}
                    iconStyle="solid"
                    color={COLORS.GREY}
                    name="chevron-right"
                />
            </TouchableOpacity>
        );
    }, [theme.colors, handleNavigateToVideoList]);

    const renderFoodItem = useCallback(({ item }: { item: FoodTreeItem }) => {
        const foodCategory = item.foodCategory || (item.attachments?.[0] as any);
        const name = foodCategory?.category?.name || 'General';

        return (
            <TouchableOpacity
                style={[styles.item, { borderBottomColor: theme.colors.border }]}
                onPress={() => handleFoodTreeItem(item)}
            >
                <Text
                    variant="h4"
                    numberOfLines={1}
                    style={[styles.title, { color: theme.colors.text }]}
                >
                    {name}
                </Text>
                <Icon
                    size={24}
                    iconStyle="solid"
                    color={COLORS.GREY}
                    name="chevron-right"
                />
            </TouchableOpacity>
        );
    }, [theme.colors, handleFoodTreeItem]);

    // Render the appropriate list based on library type
    const renderContent = () => {
        if (list.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text variant="h3" textAlign="center" color={COLORS.DARK_GREY}>
                        No videos has been seen yet
                    </Text>
                </View>
            );
        }

        switch (library) {
            case VIDEO_LIBRARY.DISEASE:
                const filteredDiseaseList = (list as MedicalTermWithVideos[]).filter(
                    item => item.seenAttachments && item.seenAttachments.length > 0
                );
                if (filteredDiseaseList.length === 0) {
                    return (
                        <View style={styles.emptyContainer}>
                            <Text color={COLORS.GREY} textAlign="center">
                                No videos has been seen yet
                            </Text>
                        </View>
                    );
                }
                return (
                    <FlatList
                        data={filteredDiseaseList}
                        renderItem={renderDiseaseItem}
                        keyExtractor={item => String(item.id)}
                    />
                );

            case VIDEO_LIBRARY.GENERAL:
                return (
                    <FlatList
                        renderItem={renderGeneralItem}
                        data={list as DestinationTreeItem[]}
                        keyExtractor={item => item.destination}
                    />
                );

            case VIDEO_LIBRARY.FOOD:
                return (
                    <FlatList
                        data={foodTreeList}
                        renderItem={renderFoodItem}
                        keyExtractor={(item, index) => String(item.foodCategory?.id || index)}
                    />
                );

            default:
                return (
                    <View style={styles.emptyContainer}>
                        <Text variant="h3" textAlign="center" color={COLORS.DARK_GREY}>
                            Something went wrong
                        </Text>
                    </View>
                );
        }
    };

    return (
        <Screen initialized style={styles.container}>
            {renderContent()}
        </Screen>
    );
};

export default memo(VideoCategoryScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: OFFSET.VERTICAL,
        borderBottomWidth: 1,
    },
    title: {
        flex: 1,
        marginRight: OFFSET.HORIZONTAL,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    noDataText: {
        marginVertical: OFFSET.VERTICAL,
    },
});
