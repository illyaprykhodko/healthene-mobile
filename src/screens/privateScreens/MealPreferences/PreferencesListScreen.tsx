// outsource dependencies
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { View, FlatList, StyleSheet, Platform, TouchableOpacity } from 'react-native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
import Checkbox from 'components/Checkbox';
import {
    MealPreferenceType,
    MealTemplatePreference,
} from 'types/mealPreferences';
import {
    useGetMealPreferencesQuery,
    useGetNewMealTemplatesQuery,
    useSaveMealPreferencesMutation,
    useDeleteMealPreferencesMutation,
} from 'store/api/mealPreferencesApi';
import { ROUTES } from 'constants/routes';
import { RootStackParamList } from 'services/navigation';

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
                <Text variant="h4">{item.mealTemplate?.displayName}</Text>
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

    const [isDirty, setIsDirty] = useState(false);
    const [localFavorites, setLocalFavorites] = useState<MealTemplatePreference[]>([]);

    const { data: favoriteList, isLoading: isLoadingFavorites } = useGetMealPreferencesQuery({
        type: MealPreferenceType.PREFERENCE,
        meal: mealName,
    });

    const { data: newTemplates, isLoading: isLoadingTemplates } = useGetNewMealTemplatesQuery({
        type: MealPreferenceType.PREFERENCE,
        meal: mealName,
    });

    const [savePreferences, { isLoading: isSaving }] = useSaveMealPreferencesMutation();
    const [deletePreferences, { isLoading: isDeleting }] = useDeleteMealPreferencesMutation();

    useEffect(() => {
        if (favoriteList) {
            setLocalFavorites(favoriteList);
        }
    }, [favoriteList]);

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
        setIsDirty(true);
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
            } else {
                await deletePreferences({
                    type: MealPreferenceType.PREFERENCE,
                    meal: mealName,
                }).unwrap();
            }
            setIsDirty(false);
            navigation.goBack();
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }, [localFavorites, savePreferences, deletePreferences, mealName, navigation]);

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
                disabled={!isDirty || isSaving || isDeleting}
                style={[
                    styles.submitBtn,
                    isDirty ? styles.submitBtnActive : styles.submitBtnInactive,
                ]}
                textStyle={styles.submitBtnText}
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
        marginVertical: OFFSET.VERTICAL * 2,
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
        fontSize: 18,
        fontWeight: Platform.OS === 'ios' ? '600' : '700',
    },
});

export default PreferencesListScreen;
