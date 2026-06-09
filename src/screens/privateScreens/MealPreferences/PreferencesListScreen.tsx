// outsource dependencies
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { View, FlatList, StyleSheet, Platform, TouchableOpacity } from 'react-native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { Button } from 'components/Button';
import Checkbox from 'components/Checkbox';
import StackHeader from 'components/StackHeader';
import { RootStackParamList } from 'services/navigation';
import ConfirmationAlert from 'components/ConfirmationAlert';
import { useReviewAlert } from 'components/ReviewAlertContext';
import {
    MealPreferenceType,
    MealTemplatePreference,
} from 'types/mealPreferences';
import {
    useGetMealPreferencesQuery,
    useGetNewMealTemplatesQuery,
    useSaveMealPreferencesMutation,
    useResetMealPreferencesToDefaultMutation,
} from 'store/api/mealPreferencesApi';

type PreferencesListScreenProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.MEAL_PREFERENCES_LIST
>;

interface ListItemProps {
    isSelected: boolean;
    item: MealTemplatePreference;
    onPress: (item: MealTemplatePreference) => void;
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
                <Text style={styles.itemName} variant="h4">{item.mealTemplate?.displayName}</Text>
                <Checkbox
                    size={10}
                    value={isSelected}
                    onChange={handlePress}
                />
            </TouchableOpacity>
        </View>
    );
};

const PreferencesListScreen: React.FC<PreferencesListScreenProps> = ({ navigation, route }) => {
    const theme = useTheme();
    const mealName = route.params?.item?.name;
    const mealId = route.params?.item?.id;

    const { hasShown, markShown, sessionId } = useReviewAlert();
    const [trackedSessionId, setTrackedSessionId] = useState(sessionId);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const [initialFavoriteIds, setInitialFavoriteIds] = useState<number[]>([]);
    const [localFavorites, setLocalFavorites] = useState<MealTemplatePreference[]>([]);

    if (trackedSessionId !== sessionId) {
        setTrackedSessionId(sessionId);
        setIsReviewOpen(false);
        setIsHydrated(false);
        setInitialFavoriteIds([]);
        setLocalFavorites([]);
    }

    const { data: favoriteList, isLoading: isLoadingFavorites } = useGetMealPreferencesQuery({
        type: MealPreferenceType.PREFERENCE,
        meal: mealName,
    });

    const { data: newTemplates, isLoading: isLoadingTemplates } = useGetNewMealTemplatesQuery({
        type: MealPreferenceType.PREFERENCE,
        meal: mealName,
    });

    const [savePreferences, { isLoading: isSaving }] = useSaveMealPreferencesMutation();
    const [resetPreferences, { isLoading: isResetting }] = useResetMealPreferencesToDefaultMutation();

    useEffect(() => {
        if (isHydrated || favoriteList === undefined) { return; }
        setLocalFavorites(favoriteList);
        setInitialFavoriteIds(
            favoriteList
                .map(item => item.mealTemplate?.id)
                .filter((id): id is number => typeof id === 'number')
        );
        setIsHydrated(true);
    }, [isHydrated, favoriteList]);

    const selectedFavoriteIds = useMemo(
        () => localFavorites
            .map(item => item.mealTemplate?.id)
            .filter((id): id is number => typeof id === 'number')
            .sort((a, b) => a - b),
        [localFavorites]
    );

    const initialFavoriteIdsSorted = useMemo(
        () => [...initialFavoriteIds].sort((a, b) => a - b),
        [initialFavoriteIds]
    );

    const hasUnsavedChanges = useMemo(() => {
        if (!isHydrated) { return false; }
        if (selectedFavoriteIds.length !== initialFavoriteIdsSorted.length) { return true; }
        return selectedFavoriteIds.some((id, idx) => id !== initialFavoriteIdsSorted[idx]);
    }, [isHydrated, selectedFavoriteIds, initialFavoriteIdsSorted]);

    useEffect(() => {
        if (hasUnsavedChanges && !hasShown()) {
            setIsReviewOpen(true);
            markShown();
        }
    }, [hasUnsavedChanges, hasShown, markShown]);

    const allItems = useMemo(() => {
        const combined = [...(favoriteList || []), ...(newTemplates || [])];
        // Remove duplicates by mealTemplate.id
        const unique = combined.filter((item, index, self) =>
            index === self.findIndex(t => t.mealTemplate?.id === item.mealTemplate?.id)
        );
        return unique;
    }, [favoriteList, newTemplates]);

    const isItemSelected = useCallback((templateId: number) => {
        return localFavorites.some(item => item.mealTemplate?.id === templateId);
    }, [localFavorites]);

    const handleCheck = useCallback((item: MealTemplatePreference) => {
        const isCurrentlySelected = isItemSelected(item.mealTemplate?.id);

        if (!isCurrentlySelected) {
            setLocalFavorites(prev => [...prev, item]);
        } else {
            setLocalFavorites(prev =>
                prev.filter(p => p.mealTemplate?.id !== item.mealTemplate?.id)
            );
        }
    }, [isItemSelected]);

    const handleSave = useCallback(async () => {
        try {
            if (localFavorites.length > 0) {
                const preparedList = localFavorites.map(item =>
                    (item.relativeFrequency === 0
                        ? { ...item, relativeFrequency: 1 }
                        : item)
                );
                await savePreferences(preparedList).unwrap();
            } else if (typeof mealId === 'number') {
                await resetPreferences({ mealId }).unwrap();
            }
            const savedIds = localFavorites
                .map(item => item.mealTemplate?.id)
                .filter((id): id is number => typeof id === 'number');
            setInitialFavoriteIds(savedIds);
            navigation.goBack();
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }, [localFavorites, savePreferences, resetPreferences, mealId, navigation]);

    const handleContinueReview = useCallback(() => {
        setIsReviewOpen(false);
    }, []);

    const handleGoBackFromReview = useCallback(() => {
        setIsReviewOpen(false);
        navigation.goBack();
    }, [navigation]);

    const renderItem = useCallback(({ item }: { item: MealTemplatePreference }) => (
        <ListItem
            item={item}
            onPress={handleCheck}
            isSelected={isItemSelected(item.mealTemplate?.id)}
        />
    ), [handleCheck, isItemSelected]);

    const keyExtractor = useCallback((item: MealTemplatePreference) =>
        String(item.mealTemplate?.id), []);

    const isLoading = isLoadingFavorites || isLoadingTemplates;

    return (
        <Screen
            style={styles.container}
            initialized={!isLoading}
        >
            <StackHeader
                onBack={() => navigation.goBack()}
                title={mealName || 'Meal Preferences'}
                onOpenDrawer={() => (navigation as any).openDrawer?.()}
            />
            <View style={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text variant="h5" color={theme.colors.textSecondary}>
                        SELECT FOOD
                    </Text>
                </View>

                <FlatList
                    data={allItems}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text variant="body" color={theme.colors.textSecondary}>
                                No templates available
                            </Text>
                        </View>
                    }
                />
            </View>

            <Button
                title="SAVE"
                variant="success"
                onPress={handleSave}
                textStyle={styles.submitBtnText}
                disabled={!hasUnsavedChanges || isSaving || isResetting}
                style={[
                    styles.submitBtn,
                    hasUnsavedChanges ? styles.submitBtnActive : styles.submitBtnInactive,
                ]}
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
    sectionHeader: {
        marginVertical: OFFSET.VERTICAL * 1.5,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    listContent: {
        paddingBottom: OFFSET.VERTICAL * 2,
    },
    itemWrapper: {
        marginBottom: 2,
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
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: OFFSET.VERTICAL * 4,
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
        color: COLORS.DARK_GREY,
        fontSize: 18,
        fontWeight: Platform.OS === 'ios' ? '600' : '700',
    },
    itemName: {
        width: '80%'
    }
});

export default PreferencesListScreen;
