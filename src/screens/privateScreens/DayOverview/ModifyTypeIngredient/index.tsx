// outsource dependencies
import _ from 'lodash';
import React, { memo, useCallback, useMemo } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';

export const MODIFY_TYPES = {
    UNIT: 'UNIT',
    INGREDIENT: 'INGREDIENT',
} as const;

export type ModifyType = typeof MODIFY_TYPES[keyof typeof MODIFY_TYPES];

interface IngredientEntity {
    id: number;
    name: string;
    weights?: IngredientWeight[];
    coverImage?: {
        url?: string;
    };
}

interface IngredientWeight {
    id: number;
    amount?: number;
    unit?: {
        id: number;
        name: string;
    };
    isDefault?: boolean;
    usedInRecipes?: boolean;
}

interface ModifyIngredientItem {
    id: number;
    amount?: number;
    entity?: IngredientEntity;
    weight?: IngredientWeight;
    unit?: {
        id: number;
        name: string;
    };
    modified?: boolean;
}

interface ListItem {
    id: number;
    unitName: string;
}

interface ModifyTypeIngredientParams {
    modifyType: ModifyType;
    item: ModifyIngredientItem;
    modifyIngredients?: ModifyIngredientItem[];
    onSelectUnit?: (weight: IngredientWeight, item: ModifyIngredientItem) => void;
    onSelectIngredient?: (ingredient: ModifyIngredientItem, item: ModifyIngredientItem) => void;
}

const ModifyTypeIngredient: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    
    const params = route.params as ModifyTypeIngredientParams;
    const modifyType = params?.modifyType || MODIFY_TYPES.UNIT;
    const item = params?.item;
    const modifyIngredients = params?.modifyIngredients || [];
    const onSelectUnit = params?.onSelectUnit;
    const onSelectIngredient = params?.onSelectIngredient;

    const handleClear = useCallback(() => {
        // Clean up on unmount
    }, []);

    const weights = useMemo(() => (
        (item?.entity?.weights || []).map(w => ({
            id: w?.id,
            unitName: w?.unit?.name || ''
        }))
    ), [item]);

    const unit = useMemo(() => {
        const defaultWeight = _.find(item?.entity?.weights, { usedInRecipes: true })
            || _.get(item?.entity, 'weights.0');
        return _.get(defaultWeight, 'unit') || item?.unit;
    }, [item]);

    const newIngredients = useMemo(() => (
        (modifyIngredients || []).map(ing => ({
            id: ing?.id,
            unitName: ing?.entity?.name || ''
        }))
    ), [modifyIngredients]);

    const ingredient = item?.entity?.name;

    const handleUnit = useCallback((id: number) => {
        const weight = _.find(item?.entity?.weights, { id });
        if (weight && onSelectUnit) {
            onSelectUnit(weight, item);
        }
        navigation.goBack();
    }, [item, onSelectUnit, navigation]);

    // Handle ingredient replacement selection
    const handleIngredient = useCallback((id: number) => {
        const includeIngredient = _.find(modifyIngredients, { id });
        if (includeIngredient && onSelectIngredient) {
            onSelectIngredient({
                // ...item,
                ...includeIngredient,
                modified: true,
            }, item);
        }
        navigation.goBack();
    }, [modifyIngredients, item, onSelectIngredient, navigation]);

    const list = useMemo<ListItem[]>(() => (
        modifyType === MODIFY_TYPES.INGREDIENT ? newIngredients : weights
    ), [modifyType, newIngredients, weights]);

    const handlePress = useCallback((pressedItem: ListItem) => {
        if (modifyType === MODIFY_TYPES.INGREDIENT) {
            handleIngredient(pressedItem.id);
        } else {
            handleUnit(pressedItem.id);
        }
    }, [modifyType, handleIngredient, handleUnit]);

    const isSelected = useCallback((listItem: ListItem) => {
        if (modifyType === MODIFY_TYPES.INGREDIENT) {
            return ingredient === listItem.unitName;
        }
        return unit?.name === listItem.unitName;
    }, [modifyType, ingredient, unit]);

    const renderItem = useCallback(({ item: listItem }: { item: ListItem }) => (
        <View style={styles.wrapper}>
            <View style={[
                styles.listItem,
                { backgroundColor: isSelected(listItem) ? theme.colors.surfaceAlt : theme.colors.surface, borderBottomColor: theme.colors.border }
            ]}>
                <TouchableOpacity
                    onPress={() => handlePress(listItem)}
                    style={styles.main}
                >
                    <View style={styles.recipeContainer}>
                        <Text
                            variant="h4"
                            numberOfLines={2}
                            style={[styles.offset, styles.main, styles.capitalize]}
                        >
                            {listItem.unitName}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    ), [handlePress, isSelected]);

    return (
        <Screen
            initialized
            init={() => {}}
            clear={handleClear}
            style={styles.screenStyle}
        >
            <View style={[styles.mainTitle, { backgroundColor: theme.colors.surfaceAlt }]}>
                <Text color={theme.colors.text} style={styles.itemName}>Add item</Text>
            </View>
            <View style={styles.titleContainer}>
                <Text color={theme.colors.text} style={styles.title}>
                    {modifyType === MODIFY_TYPES.INGREDIENT ? 'Replacement Ingredients' : 'Measurements'}
                </Text>
            </View>
            <ScrollView contentContainerStyle={styles.main}>
                {!list?.length ? (
                    <Text textAlign="center" color={theme.colors.text}>
                        No items found
                    </Text>
                ) : (
                    <FlatList
                        data={list}
                        scrollEnabled={false}
                        renderItem={renderItem}
                        keyExtractor={({ id }) => String(id)}
                    />
                )}
            </ScrollView>
        </Screen>
    );
};

export default memo(ModifyTypeIngredient);

const styles = StyleSheet.create({
    screenStyle: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    wrapper: {},
    listItem: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: OFFSET.POINT,
        paddingRight: OFFSET.POINT,
        opacity: 1,
        borderBottomColor: '#D9D9D9',
        borderBottomWidth: 2,
    },
    image: {
        width: 40,
        height: 40,
    },
    offset: {
        paddingLeft: OFFSET.HORIZONTAL,
        paddingRight: OFFSET.HORIZONTAL,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recipeContainer: {
        paddingVertical: 20,
        alignItems: 'center',
        flexDirection: 'row',
    },
    main: {
        flex: 1,
    },
    buttons: {
        flexDirection: 'row',
    },
    button: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainTitle: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        justifyContent: 'center',
        paddingVertical: OFFSET.VERTICAL,
        backgroundColor: '#E0EBF7',
        height: 65,
        marginBottom: OFFSET.VERTICAL,
    },
    itemName: {
        width: '100%',
        fontWeight: '400',
        textAlign: 'center',
        fontSize: 18,
    },
    titleContainer: {
        width: '100%',
        marginBottom: OFFSET.VERTICAL,
    },
    title: {
        width: '100%',
        fontWeight: '700',
        textAlign: 'center',
        fontSize: 18,
    },
    capitalize: {
        textTransform: 'capitalize',
    },
});

