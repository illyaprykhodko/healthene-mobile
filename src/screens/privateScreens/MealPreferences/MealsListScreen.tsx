// outsource dependencies
import Icon from '@react-native-vector-icons/fontawesome5';
import { View, FlatList, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import React, { useCallback, useState, useEffect, useLayoutEffect, useMemo } from 'react';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { COLORS } from 'constants/colors';
import DefImage from 'components/DefImage';
import { Button } from 'components/Button';
import StackHeader from 'components/StackHeader';
import { RangeSlider } from 'components/RangeSlider';
import ConfirmationAlert from 'components/ConfirmationAlert';
import { useReviewAlert } from 'components/ReviewAlertContext';
import {
    MealPreferenceType,
    MealWithPreferences,
    MealTemplatePreference
} from 'types/mealPreferences';
import {
    useGetMealsQuery,
    useGetMealPreferencesQuery,
    useGetNewMealTemplatesQuery,
    useUpdateMealPreferencesFrequencyMutation,
} from 'store/api/mealPreferencesApi';

interface MealsListScreenProps {
    navigation: any;
}

const MEAL_NAMES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

const useMealData = (mealName: string, enabled: boolean) => {
    const { data: prefs } = useGetMealPreferencesQuery(
        { type: MealPreferenceType.PREFERENCE, meal: mealName },
        { skip: !enabled }
    );
    const { data: newTemplates } = useGetNewMealTemplatesQuery(
        { type: MealPreferenceType.PREFERENCE, meal: mealName },
        { skip: !enabled }
    );
    return useMemo(() => ({ prefs, newTemplates }), [prefs, newTemplates]);
};

interface MealItemProps {
    navigation: any;
    isDirtyForm: boolean;
    item: MealWithPreferences;
    onUpdateItem: (item: MealWithPreferences) => void;
}

const MealItem: React.FC<MealItemProps> = ({
    item,
    navigation,
    isDirtyForm,
    onUpdateItem,
}) => {
    const theme = useTheme();
    const [isOpen, setIsOpen] = useState(true);

    const handleToggle = useCallback(() => setIsOpen(prev => !prev), []);

    const handleNavigate = useCallback(() => {
        navigation.navigate(ROUTES.MEAL_PREFERENCES_LIST, { item });
    }, [navigation, item]);

    const handleSliderChange = useCallback((preference: MealTemplatePreference, value: number) => {
        const updatedPreferences = (item.preferences || []).map(element =>
            (element.id === preference.id
                ? { ...element, relativeFrequency: value }
                : element)
        );
        onUpdateItem({ ...item, preferences: updatedPreferences });
    }, [item, onUpdateItem]);

    return (
        <View>
            <View style={[styles.mealHeader, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity
                    onPress={handleNavigate}
                    style={[styles.mealButton, { borderBottomColor: theme.colors.border }]}
                >
                    <View style={styles.mealTitleRow}>
                        <DefImage
                            style={styles.mealImage}
                            src={item?.coverImage?.url}
                        />
                        <Text variant="h4">{item.name}</Text>
                    </View>
                    <TouchableOpacity onPress={handleToggle} style={styles.chevronButton}>
                        <Icon
                            size={18}
                            iconStyle="solid"
                            name="chevron-right"
                            color={theme.colors.text}
                            style={[styles.chevronIcon, !isOpen && styles.chevronRotated]}
                        />
                    </TouchableOpacity>
                </TouchableOpacity>
            </View>

            {isOpen && item.preferences && item.preferences.length > 0 && (
                <View style={styles.preferencesContainer}>
                    {item.preferences.map(preference => (
                        <View key={preference.id || preference.mealTemplate?.id} style={styles.sliderItem}>
                            <RangeSlider
                                item={preference}
                                isFormDirty={isDirtyForm}
                                onChange={handleSliderChange}
                                value={preference.relativeFrequency || 1}
                                title={preference.mealTemplate?.displayName}
                            />
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const MealsListScreen: React.FC<MealsListScreenProps> = ({ navigation }) => {
    const theme = useTheme();
    const { hasShown, markShown, sessionId } = useReviewAlert();
    const [trackedSessionId, setTrackedSessionId] = useState(sessionId);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const [initialFrequencies, setInitialFrequencies] = useState<Record<number, number>>({});
    const [mealsWithPreferences, setMealsWithPreferences] = useState<MealWithPreferences[]>([]);

    if (trackedSessionId !== sessionId) {
        setTrackedSessionId(sessionId);
        setIsReviewOpen(false);
        setIsHydrated(false);
        setInitialFrequencies({});
        setMealsWithPreferences([]);
    }

    const { data: mealsList, isLoading: isLoadingMeals } = useGetMealsQuery(MealPreferenceType.PREFERENCE);

    const breakfast = useMealData('Breakfast', !!mealsList?.some(m => m.name === 'Breakfast'));
    const lunch = useMealData('Lunch', !!mealsList?.some(m => m.name === 'Lunch'));
    const dinner = useMealData('Dinner', !!mealsList?.some(m => m.name === 'Dinner'));
    const snack = useMealData('Snack', !!mealsList?.some(m => m.name === 'Snack'));

    const mealDataMap = useMemo(() => ({
        Breakfast: breakfast,
        Lunch: lunch,
        Dinner: dinner,
        Snack: snack,
    }), [breakfast, lunch, dinner, snack]);

    const [updateFrequency, { isLoading: isUpdating }] = useUpdateMealPreferencesFrequencyMutation();

    // True only once mealsList and every relevant prefs / new-templates query have resolved.
    const areQueriesReady = !!mealsList && mealsList.every(meal => {
        const data = mealDataMap[meal.name as typeof MEAL_NAMES[number]];
        return data?.prefs !== undefined && data?.newTemplates !== undefined;
    });

    useLayoutEffect(() => {
        if (!mealsList || !areQueriesReady) { return; }

        const fresh = mealsList
            .map(meal => ({
                ...meal,
                preferences: mealDataMap[meal.name as typeof MEAL_NAMES[number]]?.prefs ?? [],
            }))
            .filter(meal =>
                meal.preferences.length > 0
                || (mealDataMap[meal.name as typeof MEAL_NAMES[number]]?.newTemplates?.length ?? 0) > 0
            )
            .sort((a, b) => a.order - b.order);

        // Merge fresh server shape with any in-progress slider edits so that
        // templates added/removed from PreferencesListScreen show up while
        // unsaved frequency changes on this screen are preserved.
        setMealsWithPreferences(prev => fresh.map(freshMeal => {
            const prevMeal = prev.find(m => m.id === freshMeal.id);
            if (!prevMeal) { return freshMeal; }
            const mergedPreferences = freshMeal.preferences.map(freshPref => {
                // eslint-disable-next-line max-nested-callbacks
                const prevPref = prevMeal.preferences.find(p => p.id === freshPref.id);
                return prevPref
                    ? { ...freshPref, relativeFrequency: prevPref.relativeFrequency }
                    : freshPref;
            });
            return { ...freshMeal, preferences: mergedPreferences };
        }));

        setInitialFrequencies(prev => {
            const next: Record<number, number> = {};
            fresh.forEach(meal => {
                meal.preferences.forEach(pref => {
                    if (typeof pref.id !== 'number') { return; }
                    next[pref.id] = prev[pref.id] ?? (pref.relativeFrequency || 1);
                });
            });
            return next;
        });

        if (!isHydrated) { setIsHydrated(true); }
    }, [mealsList, areQueriesReady, mealDataMap, isHydrated]);

    const currentFrequencies = useMemo(
        () => mealsWithPreferences.reduce<Record<number, number>>((acc, meal) => {
            meal.preferences.forEach(pref => {
                if (typeof pref.id === 'number') {
                    acc[pref.id] = pref.relativeFrequency || 1;
                }
            });
            return acc;
        }, {}),
        [mealsWithPreferences]
    );

    const hasUnsavedChanges = useMemo(() => {
        if (!isHydrated) { return false; }
        const keys = new Set([
            ...Object.keys(initialFrequencies),
            ...Object.keys(currentFrequencies),
        ]);
        for (const key of keys) {
            if (initialFrequencies[Number(key)] !== currentFrequencies[Number(key)]) {
                return true;
            }
        }
        return false;
    }, [isHydrated, initialFrequencies, currentFrequencies]);

    useEffect(() => {
        if (hasUnsavedChanges && !hasShown()) {
            setIsReviewOpen(true);
            markShown();
        }
    }, [hasUnsavedChanges, hasShown, markShown]);

    const handleUpdateItem = useCallback((updatedItem: MealWithPreferences) => {
        setMealsWithPreferences(prev =>
            prev.map(item => (item.id === updatedItem.id ? updatedItem : item))
        );
    }, []);

    const handleSave = useCallback(async () => {
        const allPreferences = mealsWithPreferences.reduce<MealTemplatePreference[]>(
            (acc, meal) => acc.concat(
                meal.preferences.map(p => (p.relativeFrequency === 0 ? { ...p, relativeFrequency: 1 } : p))
            ),
            []
        );

        try {
            await updateFrequency(allPreferences).unwrap();
            const saved = allPreferences.reduce<Record<number, number>>((acc, pref) => {
                if (typeof pref.id === 'number') {
                    acc[pref.id] = pref.relativeFrequency || 1;
                }
                return acc;
            }, {});
            setInitialFrequencies(saved);
        } catch (error) {
            console.error('Failed to update meal preferences:', error);
        }
    }, [mealsWithPreferences, updateFrequency]);

    const handleContinueReview = useCallback(() => {
        setIsReviewOpen(false);
    }, []);

    const handleGoBackFromReview = useCallback(() => {
        setIsReviewOpen(false);
        navigation.goBack();
    }, [navigation]);

    const renderItem = useCallback(({ item }: { item: MealWithPreferences }) => (
        <MealItem
            item={item}
            navigation={navigation}
            isDirtyForm={hasUnsavedChanges}
            onUpdateItem={handleUpdateItem}
        />
    ), [hasUnsavedChanges, navigation, handleUpdateItem]);

    const keyExtractor = useCallback((item: MealWithPreferences) => String(item.id), []);

    return (
        <Screen
            initialized={!isLoadingMeals && areQueriesReady}
            style={[
                styles.container,
                { backgroundColor: theme.colors.background }
            ]}
        >
            <StackHeader
                title="Meal Preferences"
                onBack={() => navigation.goBack()}
                onOpenDrawer={() => navigation.openDrawer?.()}
            />
            <View style={styles.content}>
                <View style={styles.divider} />
                <FlatList
                    renderItem={renderItem}
                    data={mealsWithPreferences}
                    keyExtractor={keyExtractor}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                />
            </View>

            {hasUnsavedChanges && (
                <Button
                    title="SAVE"
                    variant="success"
                    onPress={handleSave}
                    disabled={isUpdating}
                    style={styles.submitBtn}
                    textStyle={styles.submitBtnText}
                />
            )}
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
    },
    content: {
        flex: 1,
        paddingHorizontal: OFFSET.VERTICAL,
    },
    divider: {
        paddingTop: 20,
    },
    listContent: {
        paddingBottom: OFFSET.VERTICAL * 2,
    },
    mealHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        marginVertical: OFFSET.VERTICAL / 2,
        borderRadius: 8,
    },
    mealButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        justifyContent: 'space-between',
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL * 1.5,
    },
    mealTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mealImage: {
        width: 42,
        height: 42,
        borderRadius: 8,
        marginRight: OFFSET.HORIZONTAL,
    },
    chevronButton: {
        padding: 15,
    },
    chevronIcon: {},
    chevronRotated: {
        transform: [{ rotate: '90deg' }],
    },
    preferencesContainer: {
        marginHorizontal: OFFSET.POINT,
    },
    sliderItem: {
        marginVertical: 2,
    },
    submitBtn: {
        width: '90%',
        borderRadius: 30,
        alignSelf: 'center',
        backgroundColor: '#96E072',
        borderColor: 'transparent',
        marginBottom: OFFSET.VERTICAL,
    },
    submitBtnText: {
        fontSize: 18,
        color: COLORS.DARK_GREY,
        fontWeight: Platform.OS === 'ios' ? '600' : '700',
    },
});

export default MealsListScreen;
