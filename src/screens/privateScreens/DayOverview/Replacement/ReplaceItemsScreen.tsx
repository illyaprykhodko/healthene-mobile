// outsource dependencies
import React, { useState, useCallback } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
// local dependencies
import { Meal } from 'types/meal';
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { ROUTES } from 'constants/routes';
import DefImage from 'components/DefImage';
import Checkbox from 'components/Checkbox';
import { BoxHolder } from 'components/preloader';
import { RootStackParamList } from 'services/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGetRescueMealsQuery, useUpdatePhaseWithRescueMutation } from 'store/api/dayOverviewApi';

// interface Checkbox {
//     value: boolean;
//     disabled?: boolean;
//     onChange: () => void;
// }

// const Checkbox: React.FC<Checkbox> = ({ value, onChange, disabled }) => {
//     const theme = useTheme();
//     return (
//         <TouchableOpacity
//             onPress={onChange}
//             disabled={disabled}
//             style={[
//                 styles.checkbox,
//                 { borderColor: theme.colors.border },
//                 value && { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
//             ]}
//         >
//             {value && <Text style={styles.checkmark}>✓</Text>}
//         </TouchableOpacity>
//     );
// };

const ReplaceItemsScreen: React.FC = () => {
    const theme = useTheme();
    const route = useRoute<any>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const phaseId = route.params?.phaseId;
    const catalogId = route.params?.catalogId;
    const isRestaurantMode = route.params?.isRestaurantMode || false;

    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // Fetch meals options
    const { data: mealsData, isLoading } = useGetRescueMealsQuery(
        { phaseId, catalogId, isRestaurant: isRestaurantMode },
        { skip: !phaseId || !catalogId }
    );
    const [updatePhase, { isLoading: isUpdating }] = useUpdatePhaseWithRescueMutation();
    // Transform data to options format
    const options = (mealsData || []).map((meals: [Meal[]], idx: number) => ({
        meals,
        id: idx,
        title: `Option ${idx + 1}`,
    }));

    const handleReplace = useCallback(async () => {
        if (selectedIndex === null) { return; }
        Alert.alert(
            'Meal Replacement',
            'Do you really want to replace original meal set to this one?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Replace',
                    onPress: async () => {
                        try {
                            const selectedMeals = options[selectedIndex].meals;
                            const items = selectedMeals.map((item: any) => ({
                                id: item.id,
                                recipe: { id: item.recipe.id },
                            }));

                            await updatePhase({ phaseId, items }).unwrap();
                            
                            // Navigate back to Edit with success toast
                            navigation.navigate(ROUTES.EDIT, {
                                phaseId,
                                isToast: true,
                            }, { pop: true });
                        } catch (error) {
                            console.error('Replace error:', error);
                        }
                    },
                },
            ]
        );
    }, [selectedIndex, options, phaseId, updatePhase, navigation]);

    if (isLoading) {
        return <BoxHolder active />;
    }
    return (
        <Screen initialized style={styles.container}>
            <View style={[styles.title, { backgroundColor: theme.colors.surfaceAlt }]}>
                <Text variant="h3" textAlign="center" style={[styles.titleText, { color: theme.colors.text }]}>
                    Replacement options
                </Text>
            </View>
            <ScrollView style={styles.optionsWrapper}>
                {options.map((option: { id: number; title: string; meals: [Meal] }, idx: number) => {
                    const isSelected = selectedIndex === idx;
                    const isDisabled = selectedIndex !== null && !isSelected;
                    return (
                        <View
                            key={option.id}
                            style={[
                                styles.optionContainer,
                                // isSelected && styles.optionSelected,
                                isDisabled && styles.optionDisabled,
                                { backgroundColor: theme.colors.background },
                            ]}
                        >
                            <View style={styles.optionHeader}>
                                <Text variant="h3" style={[styles.optionTitle, { color: theme.colors.text }]}>
                                    {option.title}
                                </Text>
                                <Checkbox
                                    value={isSelected}
                                    editable={!isDisabled}
                                    onChange={() => setSelectedIndex(isSelected ? null : idx)}
                                />
                            </View>
                            <View style={styles.optionContent}>
                                {(option?.meals || []).map((meal: Meal) => (
                                    <View key={meal.id} style={styles.mealContainer}>
                                        <DefImage src={meal.recipe?.coverImage?.url} style={{ width: 48, height: 48 }} />
                                        <View style={styles.mealInfo}>
                                            <Text variant="h3" style={[styles.mealName, { color: theme.colors.text }]}>
                                                {meal.recipe?.name || 'Unknown Recipe'}
                                            </Text>
                                            <Text style={[styles.mealServing, { color: theme.colors.textSecondary }]}>
                                                {meal.servingData?.serving.name || '1 serving'}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                                {/* {option.meals.map((meal: any) => (
                                    <View key={meal.id} style={styles.mealContainer}>
                                        <Text style={[styles.mealName, { color: theme.colors.text }]}>
                                            {meal.recipe?.name || 'Unknown Recipe'}
                                        </Text>
                                        <Text style={[styles.mealServing, { color: theme.colors.textSecondary }]}>
                                            {meal.servingData?.serving || '1 serving'}
                                        </Text>
                                    </View>
                                ))} */}
                            </View>

                            {idx !== options.length - 1 && (
                                <View style={[styles.separator, { backgroundColor: '#A3C3D3' }]} />
                            )}
                        </View>
                    );
                })}
            </ScrollView>
            <TouchableOpacity
                onPress={handleReplace}
                disabled={selectedIndex === null || isUpdating}
                style={[
                    styles.replaceBtn,
                    selectedIndex === null && { backgroundColor: theme.colors.muted },
                    selectedIndex !== null ? styles.replaceBtnActive : styles.replaceBtnDisabled,
                ]}
            >
                {isUpdating ? (
                    <ActivityIndicator color="#4E733C" />
                ) : (
                    <Text
                        style={
                            selectedIndex !== null
                                ? styles.replaceBtnTextActive
                                : styles.replaceBtnText
                        }
                    >
                        REPLACE
                    </Text>
                )}
            </TouchableOpacity>
        </Screen>
    );
};

export default ReplaceItemsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 0,
        paddingRight: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    titleText: {
        fontSize: 15,
        fontWeight: '500',
    },
    optionsWrapper: {
        flex: 1,
        paddingTop: 16,
    },
    optionContainer: {
        marginBottom: 16,
        overflow: 'hidden',
    },
    optionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    optionTitle: {
        fontWeight: '600',
        width: '80%',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    optionContent: {
        padding: 16,
    },
    mealContainer: {
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    mealName: {
        fontWeight: '500',
        fontSize: 16,
        marginBottom: 4,
    },
    mealServing: {
        fontSize: 14,
    },
    separator: {
        height: 5,
    },
    optionSelected: {
        borderColor: '#4CAF50',
        borderWidth: 2,
    },
    optionDisabled: {
        opacity: 0.5,
    },
    replaceBtn: {
        margin: 24,
        borderRadius: 24,
        paddingVertical: 16,
        alignItems: 'center',
    },
    replaceBtnActive: {
        backgroundColor: '#96E072',
    },
    replaceBtnDisabled: {
        backgroundColor: '#EEEEEE',
    },
    replaceBtnText: {
        color: '#888888',
        fontWeight: 'bold',
        fontSize: 18,
    },
    replaceBtnTextActive: {
        color: '#4E733C',
        fontWeight: 'bold',
        fontSize: 18,
    },
    mealInfo: {
        marginLeft: 16,
    },
});
