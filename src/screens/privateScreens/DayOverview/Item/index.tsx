// outsource dependencies
import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

// local dependencies
import Recipe from './Recipe';
import Overview from './Overview';
import Text from 'components/Text';
import Screen from 'components/Screen';
import Ingredients from './Ingredients';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { COLORS } from 'constants/colors';
import { humanize } from 'services/filter';
import { PhaseItem } from 'types/overview';
import { ENTITY_TYPE, OVERVIEW_TYPE } from 'constants/spec';
import { useGetPhaseItemQuery, useUpdatePhaseItemMutation } from 'store/api/dayOverviewApi';

interface RouteParams {
    date?: string;
    activeTab?: string;
    id: number | string;
}

const ITEM_TABS = {
    OVERVIEW: 'OVERVIEW',
    INGREDIENTS: 'INGREDIENTS',
    RECIPE: 'RECIPE',
    // MORE_INFO: 'MORE_INFO',
};

// Returns true if tab should be HIDDEN for surrogate recipes
const isShownSurrogateRecipe = (tab: string, item: any) => (
    [ITEM_TABS.RECIPE, ITEM_TABS.INGREDIENTS, ITEM_TABS.OVERVIEW].includes(tab)
    && (item?.recipe?.surrogateRecipe ?? false)
);
// [ITEM_TABS.RECIPE, ITEM_TABS.INGREDIENTS, ITEM_TABS.OVERVIEW].includes(tab)
// && (item?.recipe?.surrogateRecipe ?? true)
const Item: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation();
    const route = useRoute();
    
    const params = route.params as RouteParams | undefined;
    const itemId = params?.id;
    const date = params?.date;
    const initialTab = params?.activeTab || ITEM_TABS.OVERVIEW;
    
    const [activeTab, setActiveTab] = useState(initialTab);
    
    const { data: item, isLoading, error } = useGetPhaseItemQuery(itemId!, {
        skip: !itemId,
    }) as { data: PhaseItem| undefined; isLoading: boolean; error: any };
    const [updatePhaseItem] = useUpdatePhaseItemMutation();
    useEffect(() => {
        if (item) {
            const type = item.type;
            switch (type) {
                default:
                    navigation.setOptions({ title: 'Recipe' });
                    break;
                case OVERVIEW_TYPE.MEAL:
                    navigation.setOptions({ title: item.title });
                    // navigation.setOptions({ title: _.get(phase, 'meal.name', 'Meal') });
                    break;
                case OVERVIEW_TYPE.ADDED_BY_PATIENT:
                case OVERVIEW_TYPE.SUPPLEMENT:
                case OVERVIEW_TYPE.MEDICATION:
                case OVERVIEW_TYPE.PHYSICAL_ACTIVITY:
                case OVERVIEW_TYPE.ANYTIME:
                    navigation.setOptions({
                        title: humanize(type),
                        // title: humanize(_.get(phase, 'type') || ''),
                    });
                    break;
                case OVERVIEW_TYPE.MEASUREMENT:
                    navigation.setOptions({ title: 'Measurement' });
                    break;
            }
        }
    }, [item, navigation]);

    const tabsList = () => {
        if (!item || !item.type) {
            return [];
        }

        if (
            [ENTITY_TYPE.RECIPE, ENTITY_TYPE.FOOD, ENTITY_TYPE.CUSTOM_RECIPE].includes(
                item.type as any
            )
        ) {
            return Object.values(ITEM_TABS).filter(
                tab => !isShownSurrogateRecipe(tab, item)
            );
        }
        return [];
    };

    const handleUpdateItem = async (updatedItem: any) => {
        if (!itemId || !item?.phase?.id) {
            return;
        }
        
        try {
            await updatePhaseItem({
                id: itemId,
                phaseId: item.phase.id,
                data: updatedItem,
                date,
            }).unwrap();
        } catch (error) {
            console.error('Failed to update item:', error);
        }
    };

    const renderBody = () => {
        if (!item) {
            return null;
        }

        const isSurrogateRecipe = isShownSurrogateRecipe(ITEM_TABS.RECIPE, item);

        switch (activeTab) {
            case ITEM_TABS.OVERVIEW:
                return (
                    <Overview
                        item={item}
                        disabled={false}
                        updateItem={handleUpdateItem}
                        isSurrogateRecipe={isSurrogateRecipe}
                    />
                );
            case ITEM_TABS.RECIPE:
                return <Recipe recipe={item.recipe} />;
            case ITEM_TABS.INGREDIENTS:
                return <Ingredients item={item} />;
            default:
                return (
                    <View style={styles.emptyContainer}>
                        <Text style={{ textAlign: 'center', color: theme.colors.text }}>
                            Nothing found
                        </Text>
                    </View>
                );
        }
    };

    const renderTabs = () => {
        const tabs = tabsList().map(tab => ({
            label: humanize(tab),
            value: tab,
        }));

        if (tabs.length === 0 || !item?.recipe) {
            return null;
        }

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
                                { borderRightWidth: tabs.length === index + 1 ? 0 : 2 },
                            ]}
                            onPress={() => setActiveTab(tab.value)}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    ...(isActive ? [styles.activeTabText] : []),
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    if (isLoading) {
        return (
            <Screen initialized={false} style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={{ marginTop: OFFSET.VERTICAL, color: theme.colors.text }}>
                        Loading...
                    </Text>
                </View>
            </Screen>
        );
    }

    if (error || !item) {
        return (
            <Screen initialized={true} style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Text style={{ color: theme.colors.error, textAlign: 'center' }}>
                        {error ? 'Failed to load item' : 'Item not found'}
                    </Text>
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
        marginHorizontal: OFFSET.HORIZONTAL,
        marginVertical: OFFSET.VERTICAL,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: OFFSET.HORIZONTAL,
    },
});
