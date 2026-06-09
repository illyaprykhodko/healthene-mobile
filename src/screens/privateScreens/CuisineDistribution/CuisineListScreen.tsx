// outsource dependencies
import { useSelector } from 'react-redux';
import React, { useCallback, useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Platform, TouchableOpacity } from 'react-native';

// local dependencies
import { RootState } from 'store';
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
import Checkbox from 'components/Checkbox';
import StackHeader from 'components/StackHeader';
import ConfirmationAlert from 'components/ConfirmationAlert';
import { useReviewAlert } from 'components/ReviewAlertContext';
import { TagType, CuisineTag, CuisineFrequency } from 'types/cuisineDistribution';
import {
    useGetCuisineTagsQuery,
    useGetCuisineFrequencyQuery,
    useSaveCuisineFrequencyMutation,
} from 'store/api/cuisineDistributionApi';

interface CuisineListScreenProps {
    navigation: any;
}

interface ListItemProps {
    item: CuisineTag;
    isSelected: boolean;
    onPress: (item: CuisineTag) => void;
}

const ListItem: React.FC<ListItemProps> = ({ item, isSelected, onPress }) => {
    const theme = useTheme();

    const handlePress = useCallback(() => {
        onPress(item);
    }, [onPress, item]);

    return (
        <View style={[styles.itemWrapper, { backgroundColor: theme.colors.white }]}>
            <TouchableOpacity
                onPress={handlePress}
                style={[styles.itemContainer, { borderBottomColor: theme.colors.border }]}
            >
                <Text variant="h4">{item.name}</Text>
                <Checkbox
                    size={10}
                    value={isSelected}
                    onChange={handlePress}
                />
            </TouchableOpacity>
        </View>
    );
};

const CuisineListScreen: React.FC<CuisineListScreenProps> = ({ navigation }) => {
    const theme = useTheme();
    const { hasShown, markShown, sessionId } = useReviewAlert();
    const [trackedSessionId, setTrackedSessionId] = useState(sessionId);
    const [isHydrated, setIsHydrated] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [initialFavoriteTagIds, setInitialFavoriteTagIds] = useState<number[]>([]);
    const [page, setPage] = useState(0);
    const [localFavoriteList, setLocalFavoriteList] = useState<CuisineFrequency[]>([]);
    const [allTags, setAllTags] = useState<CuisineTag[]>([]);

    if (trackedSessionId !== sessionId) {
        setTrackedSessionId(sessionId);
        setIsReviewOpen(false);
        setIsHydrated(false);
        setInitialFavoriteTagIds([]);
        setLocalFavoriteList([]);
        setAllTags([]);
        setPage(0);
    }

    const user = useSelector((state: RootState) => state.app.user);

    const { data: tagsData, isLoading: isLoadingTags, isFetching } = useGetCuisineTagsQuery({
        filter: {
            excludeIds: [],
            disabled: false,
            type: TagType.CUISINE,
        },
        page,
        size: 20,
        sort: 'name,ASC',
    });

    const { data: favoriteList, isLoading: isLoadingFavorites } = useGetCuisineFrequencyQuery(TagType.CUISINE);

    const [saveCuisine, { isLoading: isSaving }] = useSaveCuisineFrequencyMutation();

    useEffect(() => {
        if (isHydrated || favoriteList === undefined) { return; }
        setLocalFavoriteList(favoriteList);
        setInitialFavoriteTagIds(
            favoriteList
                .map(item => item?.tag?.id || item?.id)
                .filter((id): id is number => typeof id === 'number')
        );
        setIsHydrated(true);
    }, [isHydrated, favoriteList]);

    const selectedFavoriteTagIds = React.useMemo(
        () => localFavoriteList
            .map(item => item?.tag?.id || item?.id)
            .filter((id): id is number => typeof id === 'number')
            .sort((a, b) => a - b),
        [localFavoriteList]
    );

    const initialFavoriteTagIdsSorted = React.useMemo(
        () => [...initialFavoriteTagIds].sort((a, b) => a - b),
        [initialFavoriteTagIds]
    );

    const hasUnsavedChanges = React.useMemo(() => {
        if (!isHydrated) { return false; }
        if (selectedFavoriteTagIds.length !== initialFavoriteTagIdsSorted.length) { return true; }
        return selectedFavoriteTagIds.some((id, idx) => id !== initialFavoriteTagIdsSorted[idx]);
    }, [isHydrated, selectedFavoriteTagIds, initialFavoriteTagIdsSorted]);

    useEffect(() => {
        if (hasUnsavedChanges && !hasShown()) {
            setIsReviewOpen(true);
            markShown();
        }
    }, [hasUnsavedChanges, hasShown, markShown]);

    useEffect(() => {
        if (tagsData?.content) {
            setAllTags(prev => {
                if (page === 0) {
                    return tagsData.content;
                }
                const existingIds = new Set(prev.map(t => t.id));
                const newTags = tagsData.content.filter(t => !existingIds.has(t.id));
                return [...prev, ...newTags];
            });
        }
    }, [tagsData, page]);

    const isItemSelected = useCallback((tagId: number) => {
        return localFavoriteList.some(
            item => (item?.tag?.id || item?.id) === tagId
        );
    }, [localFavoriteList]);

    const handleCheck = useCallback((tag: CuisineTag) => {
        const existingItem = favoriteList?.find(el => el?.tag?.id === tag.id);
        const isCurrentlySelected = isItemSelected(tag.id);

        if (!isCurrentlySelected) {
            if (existingItem) {
                setLocalFavoriteList(prev => [...prev, existingItem]);
            } else {
                const newItem: CuisineFrequency = {
                    id: null,
                    tag,
                    meal: { id: 40 },
                    relativeFrequency: 1,
                    patient: { id: user?.id || 0 },
                };
                setLocalFavoriteList(prev => [...prev, newItem]);
            }
        } else {
            setLocalFavoriteList(prev =>
                prev.filter(item => item?.tag?.id !== tag.id)
            );
        }
    }, [favoriteList, isItemSelected, user?.id]);

    const clearChoose = useCallback(() => {
        setLocalFavoriteList([]);
    }, []);

    const handleSave = useCallback(async () => {
        try {
            await saveCuisine({
                tagType: TagType.CUISINE,
                data: localFavoriteList,
            }).unwrap();
            const savedTagIds = localFavoriteList
                .map(item => item?.tag?.id || item?.id)
                .filter((id): id is number => typeof id === 'number');
            setInitialFavoriteTagIds(savedTagIds);
            navigation.goBack();
        } catch (error) {
            console.error('Failed to save cuisines:', error);
        }
    }, [saveCuisine, localFavoriteList, navigation]);

    const handleContinueReview = useCallback(() => {
        setIsReviewOpen(false);
    }, []);

    const handleGoBackFromReview = useCallback(() => {
        setIsReviewOpen(false);
        navigation.goBack();
    }, [navigation]);

    const handleLoadMore = useCallback(() => {
        if (!isFetching && tagsData && page < tagsData.totalPages - 1) {
            setPage(prev => prev + 1);
        }
    }, [isFetching, tagsData, page]);

    const renderItem = useCallback(({ item }: { item: CuisineTag }) => (
        <ListItem
            item={item}
            onPress={handleCheck}
            isSelected={isItemSelected(item.id)}
        />
    ), [handleCheck, isItemSelected]);

    const keyExtractor = useCallback((item: CuisineTag) =>
        String(item.id), []);

    const isLoading = isLoadingTags || isLoadingFavorites;
    const hasNoPreference = localFavoriteList.length === 0;

    return (
        <Screen
            style={styles.container}
            initialized={!isLoading}
        >
            <StackHeader
                title="International Cuisine"
                onBack={() => navigation.goBack()}
                onOpenDrawer={() => navigation.openDrawer?.()}
            />
            <View style={styles.content}>
                <View style={[styles.titleButtons, { backgroundColor: theme.colors.white }]}>
                    <TouchableOpacity
                        onPress={clearChoose}
                        style={[styles.changeButton, { borderBottomColor: theme.colors.border }]}
                    >
                        <Text variant="h4">No Preference</Text>
                        <Checkbox
                            size={10}
                            onChange={clearChoose}
                            value={hasNoPreference}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionHeader}>
                    <Text variant="h5" color={theme.colors.textSecondary}>
                        SELECT CUISINE
                    </Text>
                </View>

                <FlatList
                    data={allTags}
                    style={styles.list}
                    initialNumToRender={15}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    onEndReachedThreshold={0.5}
                    onEndReached={handleLoadMore}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                />
            </View>

            <Button
                title="SAVE"
                variant="success"
                onPress={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                style={[
                    styles.submitBtn,
                    hasUnsavedChanges ? styles.submitBtnActive : styles.submitBtnInactive,
                ]}
                textStyle={styles.submitBtnText}
            />
            <ConfirmationAlert
                cancelTxt="Go Back"
                applyTxt="Continue"
                isOpen={isReviewOpen}
                title="Dietitian Review"
                onSubmit={handleContinueReview}
                onClose={handleGoBackFromReview}
                message="These changes will be reviewed by your registered dietitian."
            />
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    content: {
        flex: 1,
        marginBottom: OFFSET.VERTICAL,
    },
    titleButtons: {
        alignItems: 'center',
        flexDirection: 'row',
        marginVertical: OFFSET.VERTICAL,
    },
    changeButton: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        justifyContent: 'space-between',
        paddingVertical: OFFSET.VERTICAL * 1.5,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    sectionHeader: {
        marginTop: OFFSET.VERTICAL * 2,
        marginBottom: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    list: {
        backgroundColor: '#FFFFFF',
    },
    listContent: {
        paddingBottom: OFFSET.VERTICAL * 2,
    },
    itemWrapper: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    itemContainer: {
        width: '100%',
        borderBottomWidth: 1,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL * 1.5,
    },
    submitBtn: {
        width: '90%',
        borderRadius: 30,
        alignSelf: 'center',
        marginBottom: OFFSET.VERTICAL,
        borderColor: 'transparent',
    },
    submitBtnActive: {
        backgroundColor: '#96E072',
    },
    submitBtnInactive: {
        backgroundColor: '#E5E5EA',
    },
    submitBtnText: {
        fontSize: 18,
        fontWeight: Platform.OS === 'ios' ? '600' : '700',
        color: '#333333',
    },
});

export default CuisineListScreen;
