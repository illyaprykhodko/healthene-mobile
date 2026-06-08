// outsource dependencies
import Icon from '@react-native-vector-icons/fontawesome5';
import React, { useCallback, useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Platform } from 'react-native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
import StackHeader from 'components/StackHeader';
import { RangeSlider } from 'components/RangeSlider';
import ConfirmationAlert from 'components/ConfirmationAlert';
import { TagType, CuisineFrequency } from 'types/cuisineDistribution';
import { useReviewAlert } from 'screens/privateScreens/CuisineDistribution/ReviewAlertContext';
import {
    useGetCuisineFrequencyQuery,
    useUpdateCuisineFrequencyMutation,
} from 'store/api/cuisineDistributionApi';

interface FavoritesScreenProps {
    navigation: any;
}

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ navigation }) => {
    const theme = useTheme();
    const { hasShown, markShown, sessionId } = useReviewAlert();
    const [trackedSessionId, setTrackedSessionId] = useState(sessionId);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const [initialFrequencies, setInitialFrequencies] = useState<Record<number, number>>({});
    const [localFavoriteList, setLocalFavoriteList] = useState<CuisineFrequency[]>([]);

    if (trackedSessionId !== sessionId) {
        setTrackedSessionId(sessionId);
        setIsReviewOpen(false);
        setIsHydrated(false);
        setInitialFrequencies({});
        setLocalFavoriteList([]);
    }

    const { data: favoriteList, isLoading, isFetching } = useGetCuisineFrequencyQuery(TagType.CUISINE);
    const [updateFrequency, { isLoading: isUpdating }] = useUpdateCuisineFrequencyMutation();

    useEffect(() => {
        if (favoriteList === undefined) { return; }

        setLocalFavoriteList(prev => favoriteList.map(freshItem => {
            const freshTagId = freshItem?.tag?.id || freshItem?.id;
            const prevItem = prev.find(p => (p?.tag?.id || p?.id) === freshTagId);
            return prevItem
                ? { ...freshItem, relativeFrequency: prevItem.relativeFrequency }
                : freshItem;
        }));

        setInitialFrequencies(prev => {
            const next: Record<number, number> = {};
            favoriteList.forEach(item => {
                const tagId = item?.tag?.id || item?.id;
                if (typeof tagId !== 'number') { return; }
                next[tagId] = prev[tagId] ?? (item?.relativeFrequency || 1);
            });
            return next;
        });

        if (!isHydrated) { setIsHydrated(true); }
    }, [isHydrated, favoriteList]);

    const currentFrequencies = React.useMemo(
        () => localFavoriteList.reduce<Record<number, number>>((acc, item) => {
            const tagId = item?.tag?.id || item?.id;
            if (typeof tagId === 'number') {
                acc[tagId] = item?.relativeFrequency || 1;
            }
            return acc;
        }, {}),
        [localFavoriteList]
    );

    const hasUnsavedChanges = React.useMemo(() => {
        if (!isHydrated) { return false; }
        const keys = Array.from(new Set([
            ...Object.keys(initialFrequencies),
            ...Object.keys(currentFrequencies),
        ])).sort();
        return keys.some(key => initialFrequencies[Number(key)] !== currentFrequencies[Number(key)]);
    }, [isHydrated, initialFrequencies, currentFrequencies]);

    useEffect(() => {
        if (hasUnsavedChanges && !hasShown()) {
            setIsReviewOpen(true);
            markShown();
        }
    }, [hasUnsavedChanges, hasShown, markShown]);

    const navigateToList = useCallback(() => {
        navigation.navigate(ROUTES.CUISINE_DISTRIBUTION_LIST);
    }, [navigation]);

    const handleChange = useCallback((item: CuisineFrequency, value: number) => {
        setLocalFavoriteList(prev =>
            prev.map(elem =>
                (elem?.tag?.name === item?.tag?.name
                    ? { ...elem, relativeFrequency: value }
                    : elem)
            )
        );
    }, []);

    const handleSave = useCallback(async () => {
        try {
            await updateFrequency(localFavoriteList).unwrap();
            const saved = localFavoriteList.reduce<Record<number, number>>((acc, item) => {
                const tagId = item?.tag?.id || item?.id;
                if (typeof tagId === 'number') {
                    acc[tagId] = item?.relativeFrequency || 1;
                }
                return acc;
            }, {});
            setInitialFrequencies(saved);
        } catch (error) {
            console.error('Failed to update cuisine frequency:', error);
        }
    }, [updateFrequency, localFavoriteList]);

    const handleContinueReview = useCallback(() => {
        setIsReviewOpen(false);
    }, []);

    const handleGoBackFromReview = useCallback(() => {
        setIsReviewOpen(false);
        navigation.goBack();
    }, [navigation]);

    const renderItem = useCallback(({ item }: { item: CuisineFrequency }) => (
        <RangeSlider
            item={item}
            onChange={handleChange}
            title={item?.tag?.name}
            isFormDirty={hasUnsavedChanges}
            value={item?.relativeFrequency || 1}
        />
    ), [hasUnsavedChanges, handleChange]);

    const keyExtractor = useCallback((item: CuisineFrequency) =>
        String(item?.id ?? item?.tag?.id), []);

    return (
        <Screen
            style={styles.container}
            initialized={!isLoading && !isFetching}
        >
            <StackHeader
                title="International Cuisine"
                onBack={() => navigation.goBack()}
                onOpenDrawer={() => navigation.openDrawer?.()}
            />
            <View style={styles.content}>
                <View style={[styles.titleButtons,
                    { backgroundColor: theme.colors.white }
                ]}>
                    <TouchableOpacity
                        onPress={navigateToList}
                        style={[styles.changeButton, { borderBottomColor: theme.colors.border }]}
                    >
                        <Text variant="h4">Change Cuisine</Text>
                        <Icon
                            size={18}
                            iconStyle="solid"
                            name="chevron-right"
                            color={theme.colors.text}
                        />
                    </TouchableOpacity>
                </View>

                {localFavoriteList.length > 0 && (
                    <View style={styles.sectionHeader}>
                        <Text variant="h5" color={theme.colors.textSecondary}>
                            SET CUISINE PREFERENCE AMOUNT
                        </Text>
                    </View>
                )}

                <FlatList
                    renderItem={renderItem}
                    data={localFavoriteList}
                    keyExtractor={keyExtractor}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text variant="body" color={theme.colors.textSecondary} style={styles.emptyText}>
                                No cuisines selected. Tap "Change Cuisine" to add your preferences.
                            </Text>
                        </View>
                    }
                />
            </View>

            <Button
                title="SAVE"
                variant="success"
                onPress={handleSave}
                disabled={!localFavoriteList.length || !hasUnsavedChanges || isUpdating}
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
        marginVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    listContent: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingBottom: OFFSET.VERTICAL * 2,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: OFFSET.VERTICAL * 4,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    emptyText: {
        textAlign: 'center',
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

export default FavoritesScreen;
