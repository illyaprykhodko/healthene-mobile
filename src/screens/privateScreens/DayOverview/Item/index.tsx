// outsource dependencies
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
// local dependencies
import { OVERVIEW_TYPE } from '../types';
import Text from '../../../../components/Text';
import Screen from '../../../../components/Screen';
import { useTheme } from '../../../../hooks/useTheme';
import { COLORS } from '../../../../constants/colors';

// Temporary types until full migration
interface PhaseItem {
    food?: any;
    meal?: any;
    type: string;
    recipe?: any;
    title: string;
    status?: string;
    measurement?: any;
    id: string | number;
    amount?: number;
    initialAmount?: number;
    weight?: {
        unit: {
            name: string;
        };
    };
    serving?: any;
    useServing?: boolean;
    modified?: boolean;
}

interface ItemProps {
    phase?: any;
    item?: PhaseItem;
    measurement?: any;
}

const ENTITY_TYPE = {
    FOOD: 'FOOD',
    RECIPE: 'RECIPE',
    CUSTOM_RECIPE: 'CUSTOM_RECIPE',
};

const ITEM_TABS = {
    RECIPE: 'RECIPE',
    OVERVIEW: 'OVERVIEW',
    MORE_INFO: 'MORE_INFO',
    INGREDIENTS: 'INGREDIENTS',
};

const isShownSurrogateRecipe = (tab: string, item: any) => (
    [ITEM_TABS.RECIPE, ITEM_TABS.INGREDIENTS].includes(tab)
  && _.get(item, 'recipe.surrogateRecipe', true)
);

export const Item: React.FC<ItemProps> = ({ item, phase, measurement }) => {
    const theme = useTheme();
    const navigation = useNavigation();
    const route = useRoute<any>();
    const [activeTab, setActiveTab] = useState(ITEM_TABS.OVERVIEW);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const currentId = route.params?.id;
        if (currentId !== route.params?.id) {
            // Re-initialize when item changes
            setInitialized(false);
        }
    
        if (phase) {
            switch (_.get(phase, 'type')) {
                default:
                    navigation.setOptions({ title: 'Item' });
                    break;
                case OVERVIEW_TYPE.MEAL:
                    navigation.setOptions({ title: _.get(phase, 'meal.name', '') });
                    break;
                case OVERVIEW_TYPE.ADDED_BY_PATIENT:
                case OVERVIEW_TYPE.SUPPLEMENT:
                case OVERVIEW_TYPE.MEDICATION:
                case OVERVIEW_TYPE.PHYSICAL_ACTIVITY:
                case OVERVIEW_TYPE.ANYTIME:
                    navigation.setOptions({
                        title: _.get(phase, 'type') || '',
                        headerTitleStyle: {
                            fontSize: 18,
                            textTransform: 'capitalize' as any
                        }
                    });
                    break;
                case OVERVIEW_TYPE.MEASUREMENT:
                    navigation.setOptions({ title: 'Measurement' });
                    break;
                case OVERVIEW_TYPE.QUESTION:
                    navigation.setOptions({ title: 'Health Question' });
                    break;
            }
        }
    
        setInitialized(true);
    }, [phase, navigation, route.params]);

    const tabsList = () => {
        if (!item || !item.type) { return []; }
    
        if ([ENTITY_TYPE.RECIPE, ENTITY_TYPE.FOOD, ENTITY_TYPE.CUSTOM_RECIPE].includes(item.type)) {
            return Object.values(ITEM_TABS).filter(tab =>
                (isShownSurrogateRecipe(tab, item) ? null : tab)
            );
        }
        return [];
    };

    const prepareIngredientNameWithUnit = (item: any, options: { withoutName?: boolean } = {}) => {
        const amount = item.amount || item.initialAmount;
        const serving = item.serving;
        const useServing = item.useServing;
        const ingredient = item.recipe?.ingredients?.[0];

        if (!amount) { return ''; }

        let result = '';
        
        if (useServing && serving) {
            result += `${serving} serving`;
        } else {
            result += amount;
            if (item.weight?.unit?.name) {
                result += ` ${item.weight.unit.name}`;
            }
        }

        if (!options.withoutName && ingredient?.entity?.name) {
            result += ` ${ingredient.entity.name}`;
        }

        return result;
    };

    const renderOverview = () => {
        const amount = item?.amount || item?.initialAmount;
        
        return (
            <ScrollView style={{ flex: 1 }}>
                <View style={{ padding: 16 }}>
                    <Text variant="h4" style={{ color: theme.colors.text, marginBottom: 16 }}>
                        {item?.title || 'Item Overview'}
                    </Text>
                    
                    <View style={styles.infoSection}>
                        <Text style={styles.infoLabel}>Status:</Text>
                        <Text style={styles.infoValue}>{item?.status || 'Unknown'}</Text>
                    </View>

                    {amount && (
                        <View style={styles.infoSection}>
                            <Text style={styles.infoLabel}>Amount:</Text>
                            <Text style={styles.infoValue}>
                                {amount} {item?.weight?.unit?.name || ''}
                            </Text>
                        </View>
                    )}

                    {item?.modified && (
                        <View style={styles.infoSection}>
                            <Text style={styles.infoLabel}>Modified:</Text>
                            <Text style={[styles.infoValue, { color: '#2978A0', fontWeight: '600' }]}>
                                Yes (edited by me)
                            </Text>
                        </View>
                    )}

                    {item?.recipe?.modified && (
                        <View style={styles.infoSection}>
                            <Text style={styles.infoLabel}>Recipe Modified:</Text>
                            <Text style={[styles.infoValue, { color: '#2978A0', fontWeight: '600' }]}>
                                Yes (edited by me)
                            </Text>
                        </View>
                    )}

                    {item?.recipe?.surrogateRecipe && (
                        <View style={styles.infoSection}>
                            <Text style={styles.infoLabel}>Recipe Type:</Text>
                            <Text style={[styles.infoValue, { color: '#FF6B35', fontWeight: '600' }]}>
                                Surrogate Recipe
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        );
    };

    const renderRecipe = () => {
        const recipe = item?.recipe;
        if (!recipe) {
            return (
                <View style={{ padding: 16 }}>
                    <Text style={{ textAlign: 'center', color: COLORS.GREY }}>
                        No recipe information available
                    </Text>
                </View>
            );
        }

        return (
            <ScrollView style={{ flex: 1 }}>
                <View style={{ padding: 16 }}>
                    <Text variant="h4" style={{ color: theme.colors.text, marginBottom: 16 }}>
                        Recipe Details
                    </Text>

                    <View style={styles.infoSection}>
                        <Text style={styles.infoLabel}>Name:</Text>
                        <Text style={styles.infoValue}>{recipe.name || 'N/A'}</Text>
                    </View>

                    {recipe.description && (
                        <View style={styles.infoSection}>
                            <Text style={styles.infoLabel}>Description:</Text>
                            <Text style={styles.infoValue}>{recipe.description}</Text>
                        </View>
                    )}

                    {item?.amount && (
                        <View style={styles.infoSection}>
                            <Text style={styles.infoLabel}>Serving Size:</Text>
                            <Text style={styles.infoValue}>
                                {prepareIngredientNameWithUnit(item, { withoutName: true })}
                            </Text>
                        </View>
                    )}

                    {recipe.surrogateRecipe && (
                        <View style={styles.infoSection}>
                            <Text style={styles.infoLabel}>Type:</Text>
                            <Text style={[styles.infoValue, { color: '#FF6B35', fontWeight: '600' }]}>
                                Surrogate Recipe (Simplified)
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        );
    };

    const renderIngredients = () => {
        const recipe = item?.recipe;
        if (!recipe || !recipe.ingredients) {
            return (
                <View style={{ padding: 16 }}>
                    <Text style={{ textAlign: 'center', color: COLORS.GREY }}>
                        No ingredients information available
                    </Text>
                </View>
            );
        }

        return (
            <ScrollView style={{ flex: 1 }}>
                <View style={{ padding: 16 }}>
                    <Text variant="h4" style={{ color: theme.colors.text, marginBottom: 16 }}>
                        Ingredients
                    </Text>

                    {recipe.ingredients.map((ingredient: any, index: number) => (
                        <View key={index} style={styles.ingredientItem}>
                            <Text style={styles.ingredientName}>
                                {ingredient.entity?.name || 'Unknown Ingredient'}
                            </Text>
                            {ingredient.amount && (
                                <Text style={styles.ingredientAmount}>
                                    {ingredient.amount} {ingredient.weight?.unit?.name || ''}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        );
    };

    const renderMoreInfo = () => {
        return (
            <ScrollView style={{ flex: 1 }}>
                <View style={{ padding: 16 }}>
                    <Text variant="h4" style={{ color: theme.colors.text, marginBottom: 16 }}>
                        More Information
                    </Text>

                    <View style={styles.infoSection}>
                        <Text style={styles.infoLabel}>Item Type:</Text>
                        <Text style={styles.infoValue}>{item?.type || 'Unknown'}</Text>
                    </View>

                    <View style={styles.infoSection}>
                        <Text style={styles.infoLabel}>Item ID:</Text>
                        <Text style={styles.infoValue}>{item?.id || 'N/A'}</Text>
                    </View>

                    {item?.recipe?.id && (
                        <View style={styles.infoSection}>
                            <Text style={styles.infoLabel}>Recipe ID:</Text>
                            <Text style={styles.infoValue}>{item.recipe.id}</Text>
                        </View>
                    )}

                    {item?.food?.id && (
                        <View style={styles.infoSection}>
                            <Text style={styles.infoLabel}>Food ID:</Text>
                            <Text style={styles.infoValue}>{item.food.id}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        );
    };

    const renderBody = () => {
        const tabs = tabsList();
    
        switch (activeTab) {
            default:
                return (
                    <Text style={{ textAlign: 'center', color: COLORS.BLACK }}>
                        Nothing found
                    </Text>
                );
            case ITEM_TABS.OVERVIEW:
                return renderOverview();
            case ITEM_TABS.RECIPE:
                return renderRecipe();
            case ITEM_TABS.INGREDIENTS:
                return renderIngredients();
            case ITEM_TABS.MORE_INFO:
                return renderMoreInfo();
        }
    };

    const renderTabs = () => {
        const tabs = tabsList().map(tab => ({
            label: tab.charAt(0) + tab.slice(1).toLowerCase(),
            value: tab
        }));

        if (tabs.length === 0) { return null; }

        return (
            <View style={styles.tabsRow}>
                {tabs.map((tab, index) => {
                    const isActive = activeTab === tab.value;
                    return (
                        <TouchableOpacity
                            key={tab.value}
                            style={[
                                styles.tabButton,
                                isActive && styles.activeTabButton,
                                { borderRightWidth: tabs.length === (index + 1) ? 0 : 2 }
                            ]}
                            onPress={() => setActiveTab(tab.value)}
                        >
                            <Text style={[
                                styles.tabText,
                                ...(isActive ? [styles.activeTabText] : [])
                            ]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    if (!initialized) {
        return (
            <Screen initialized={false} style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>Loading...</Text>
                </View>
            </Screen>
        );
    }

    return (
        <Screen initialized={true} style={styles.container}>
            {renderTabs()}
            {renderBody()}
        </Screen>
    );
};

export default Item;

const styles = StyleSheet.create({
    container: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    tabsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginVertical: 20,
        borderWidth: 2,
        borderColor: '#156F93',
        borderRadius: 8,
        overflow: 'hidden',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 15,
        backgroundColor: COLORS.LIGHT_GREY,
        alignItems: 'center',
        borderRightColor: '#156F93',
    },
    activeTabButton: {
        backgroundColor: COLORS.BLUE,
    },
    tabText: {
        color: COLORS.BLACK,
        fontWeight: '500',
        fontSize: 15.5,
    },
    activeTabText: {
        color: COLORS.WHITE,
        fontWeight: '600',
    },
    infoSection: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    infoLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.DARK_GREY,
        width: 100,
        marginRight: 8,
    },
    infoValue: {
        fontSize: 16,
        color: COLORS.BLACK,
        flex: 1,
    },
    ingredientItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.LIGHT_GREY,
    },
    ingredientName: {
        fontSize: 16,
        color: COLORS.BLACK,
        flex: 1,
    },
    ingredientAmount: {
        fontSize: 14,
        color: COLORS.GREY,
        marginLeft: 8,
    },
});
