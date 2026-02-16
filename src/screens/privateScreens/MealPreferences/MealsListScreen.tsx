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
import { COLORS } from 'constants/colors';
import DefImage from 'components/DefImage';
import { Button } from 'components/Button';
import { RangeSlider } from 'components/RangeSlider';
import {
    // Meal,
    MealPreferenceType,
    MealWithPreferences,
    MealTemplatePreference,
} from 'types/mealPreferences';
import {
    useGetMealsQuery,
    useGetMealPreferencesQuery,
    useUpdateMealPreferencesFrequencyMutation,
} from 'store/api/mealPreferencesApi';

interface MealsListScreenProps {
    navigation: any;
}

interface MealItemProps {
    navigation: any;
    isDirtyForm: boolean;
    item: MealWithPreferences;
    setIsDirtyForm: (dirty: boolean) => void;
    onUpdateItem: (item: MealWithPreferences) => void;
}

const MealItem: React.FC<MealItemProps> = ({
    item,
    navigation,
    isDirtyForm,
    onUpdateItem,
    setIsDirtyForm,
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
        setIsDirtyForm(true);
    }, [item, onUpdateItem, setIsDirtyForm]);

    return (
        <View>
            <View style={[styles.mealHeader, { backgroundColor: theme.colors.white }]}>
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
    const [isDirty, setIsDirty] = useState(false);
    const [mealsWithPreferences, setMealsWithPreferences] = useState<MealWithPreferences[]>([]);

    const { data: mealsList, isLoading: isLoadingMeals } = useGetMealsQuery(MealPreferenceType.PREFERENCE);

    const mealsToFetch = mealsList || [];

    const { data: breakfastPrefs } = useGetMealPreferencesQuery(
        { type: MealPreferenceType.PREFERENCE, meal: 'Breakfast' },
        { skip: !mealsList?.some(m => m.name === 'Breakfast') }
    );
    const { data: lunchPrefs } = useGetMealPreferencesQuery(
        { type: MealPreferenceType.PREFERENCE, meal: 'Lunch' },
        { skip: !mealsList?.some(m => m.name === 'Lunch') }
    );
    const { data: dinnerPrefs } = useGetMealPreferencesQuery(
        { type: MealPreferenceType.PREFERENCE, meal: 'Dinner' },
        { skip: !mealsList?.some(m => m.name === 'Dinner') }
    );
    const { data: snackPrefs } = useGetMealPreferencesQuery(
        { type: MealPreferenceType.PREFERENCE, meal: 'Snack' },
        { skip: !mealsList?.some(m => m.name === 'Snack') }
    );

    const [updateFrequency, { isLoading: isUpdating }] = useUpdateMealPreferencesFrequencyMutation();

    useEffect(() => {
        if (mealsList) {
            const prefsMap: Record<string, MealTemplatePreference[] | undefined> = {
                Breakfast: breakfastPrefs,
                Dinner: dinnerPrefs,
                Lunch: lunchPrefs,
                Snack: snackPrefs,
            };

            const combined = mealsList
                .map(meal => ({
                    ...meal,
                    preferences: prefsMap[meal.name] || [],
                }))
                .sort((a, b) => a.order - b.order);

            setMealsWithPreferences(combined);
        }
    }, [mealsList, breakfastPrefs, lunchPrefs, dinnerPrefs, snackPrefs]);

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
            setIsDirty(false);
        } catch (error) {
            console.error('Failed to update meal preferences:', error);
        }
    }, [mealsWithPreferences, updateFrequency]);

    const renderItem = useCallback(({ item }: { item: MealWithPreferences }) => (
        <MealItem
            item={item}
            isDirtyForm={isDirty}
            navigation={navigation}
            setIsDirtyForm={setIsDirty}
            onUpdateItem={handleUpdateItem}
        />
    ), [isDirty, navigation, handleUpdateItem]);

    const keyExtractor = useCallback((item: MealWithPreferences) => String(item.id), []);

    return (
        <Screen
            style={styles.container}
            initialized={!isLoadingMeals}
        >
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

            {isDirty && (
                <Button
                    title="SAVE"
                    variant="success"
                    onPress={handleSave}
                    disabled={isUpdating}
                    style={styles.submitBtn}
                    textStyle={styles.submitBtnText}
                />
            )}
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        paddingHorizontal: OFFSET.VERTICAL,
    },
    content: {
        flex: 1,
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
