// outsource dependencies
import { useNavigation } from '@react-navigation/native';
import React, { memo, useCallback, useMemo } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { COLORS } from 'constants/colors';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { VIDEO_LIBRARY } from 'types/video';
import { Skeleton } from 'components/Skeleton';
import {
    useGetFoodTreeQuery,
    useGetMedicalProblemsQuery,
    useGetDestinationTreeQuery,
    useGetMedicationAllergiesQuery,
} from 'store/api/videoApi';

// Humanize library names
const humanizeLibraryName = (name: string): string => {
    switch (name) {
        case VIDEO_LIBRARY.DISEASE:
            return 'Disease';
        case VIDEO_LIBRARY.FOOD:
            return 'Food';
        case VIDEO_LIBRARY.GENERAL:
        case VIDEO_LIBRARY.OTHER:
            return 'Other';
        default:
            return name.charAt(0) + name.slice(1).toLowerCase();
    }
};

const VideoLibraryScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();

    const { data: medicalProblems = [], isLoading: isLoadingDisease } = useGetMedicalProblemsQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });
    const { data: medicationAllergies = [], isLoading: isLoadingAllergies } = useGetMedicationAllergiesQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });
    const { data: foodTree = [], isLoading: isLoadingFood } = useGetFoodTreeQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });
    const { data: destinationTree = [], isLoading: isLoadingGeneral } = useGetDestinationTreeQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });

    const isLoading = isLoadingDisease || isLoadingAllergies || isLoadingFood || isLoadingGeneral;

    // Combine medical problems and allergies for disease videos
    const diseaseVideo = useMemo(() => {
        const hasVideos = medicalProblems.some(item => item.readyToSeeAttachments?.length || item.seenAttachments?.length);
        if (hasVideos) {
            return [...medicalProblems, ...medicationAllergies];
        }
        return medicationAllergies;
    }, [medicalProblems, medicationAllergies]);

    // Filter destination tree for items with attachments
    const otherVideo = useMemo(() => {
        return destinationTree.filter(item => item.attachments && item.attachments.length > 0);
    }, [destinationTree]);

    const isEmpty = diseaseVideo.length === 0 && foodTree.length === 0 && otherVideo.length === 0;

    const handleNavigateToCategory = useCallback((library: string, list: any[]) => {
        navigation.navigate(ROUTES.VIDEO_CATEGORY, { library, list });
    }, [navigation]);

    if (isLoading) {
        return (
            <Screen initialized style={styles.container}>
                <View style={styles.skeletonContainer}>
                    {[1, 2, 3].map((_, index) => (
                        <View key={index} style={[styles.item, { borderBottomColor: theme.colors.border }]}>
                            <Skeleton width="40%" height={20} borderRadius={4} />
                            <Skeleton width={24} height={24} borderRadius={4} />
                        </View>
                    ))}
                </View>
            </Screen>
        );
    }

    return (
        <Screen initialized style={styles.container}>
            {isEmpty ? (
                <View style={styles.emptyContainer}>
                    <Text
                        variant="h3"
                        textAlign="center"
                        color={COLORS.DARK_GREY}
                    >
                        No videos
                    </Text>
                </View>
            ) : (
                <ScrollView>
                    {diseaseVideo.length > 0 && (
                        <TouchableOpacity
                            style={[styles.item, { borderBottomColor: theme.colors.border }]}
                            onPress={() => handleNavigateToCategory(VIDEO_LIBRARY.DISEASE, diseaseVideo)}
                        >
                            <Text variant="h4" style={{ color: theme.colors.text }}>
                                {humanizeLibraryName(VIDEO_LIBRARY.DISEASE)}
                            </Text>
                            <Icon
                                size={24}
                                iconStyle="solid"
                                color={COLORS.GREY}
                                name="chevron-right"
                            />
                        </TouchableOpacity>
                    )}
                    {foodTree.length > 0 && (
                        <TouchableOpacity
                            style={[styles.item, { borderBottomColor: theme.colors.border }]}
                            onPress={() => handleNavigateToCategory(VIDEO_LIBRARY.FOOD, foodTree)}
                        >
                            <Text variant="h4" style={{ color: theme.colors.text }}>
                                {humanizeLibraryName(VIDEO_LIBRARY.FOOD)}
                            </Text>
                            <Icon
                                size={24}
                                iconStyle="solid"
                                color={COLORS.GREY}
                                name="chevron-right"
                            />
                        </TouchableOpacity>
                    )}
                    {otherVideo.length > 0 && (
                        <TouchableOpacity
                            style={[styles.item, { borderBottomColor: theme.colors.border }]}
                            onPress={() => handleNavigateToCategory(VIDEO_LIBRARY.GENERAL, otherVideo)}
                        >
                            <Text variant="h4" style={{ color: theme.colors.text }}>
                                {humanizeLibraryName(VIDEO_LIBRARY.OTHER)}
                            </Text>
                            <Icon
                                size={24}
                                iconStyle="solid"
                                color={COLORS.GREY}
                                name="chevron-right"
                            />
                        </TouchableOpacity>
                    )}
                </ScrollView>
            )}
        </Screen>
    );
};

export default memo(VideoLibraryScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: OFFSET.VERTICAL,
        borderBottomWidth: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skeletonContainer: {
        paddingTop: OFFSET.VERTICAL,
    },
});
