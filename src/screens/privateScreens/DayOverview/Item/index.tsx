// outsource dependencies
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
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
}

interface ItemProps {
    phase?: any;
    item?: PhaseItem;
    measurement?: any;
}

// Temporary constants until full migration
// const OVERVIEW_TYPE = {
//     MEAL: 'MEAL',
//     SUPPLEMENT: 'SUPPLEMENT',
//     MEDICATION: 'MEDICATION',
//     MEASUREMENT: 'MEASUREMENT',
//     ADDED_BY_PATIENT: 'ADDED_BY_PATIENT',
//     PHYSICAL_ACTIVITY: 'PHYSICAL_ACTIVITY',
//     QUESTION: 'QUESTION',
//     ANYTIME: 'ANYTIME',
// };

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
                return (
                    <View style={{ padding: 16 }}>
                        <Text variant="h4" style={{ color: theme.colors.text }}>
                            {item?.title || 'Item Overview'}
                        </Text>
                        <Text style={{ marginTop: 8, color: theme.colors.text }}>
              Status: {item?.status || 'Unknown'}
                        </Text>
                    </View>
                );
            case ITEM_TABS.RECIPE:
                return (
                    <View style={{ padding: 16 }}>
                        <Text variant="h4" style={{ color: theme.colors.text }}>
              Recipe Details
                        </Text>
                        <Text style={{ marginTop: 8, color: theme.colors.text }}>
              Recipe information will be displayed here
                        </Text>
                    </View>
                );
            case ITEM_TABS.INGREDIENTS:
                return (
                    <View style={{ padding: 16 }}>
                        <Text variant="h4" style={{ color: theme.colors.text }}>
              Ingredients
                        </Text>
                        <Text style={{ marginTop: 8, color: theme.colors.text }}>
              Ingredients list will be displayed here
                        </Text>
                    </View>
                );
            case ITEM_TABS.MORE_INFO:
                return (
                    <View style={{ padding: 16 }}>
                        <Text variant="h4" style={{ color: theme.colors.text }}>
              More Information
                        </Text>
                        <Text style={{ marginTop: 8, color: theme.colors.text }}>
              Additional information will be displayed here
                        </Text>
                    </View>
                );
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
});
