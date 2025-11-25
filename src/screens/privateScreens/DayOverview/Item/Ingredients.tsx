// outsource dependencies
import _ from 'lodash';
import React from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { PhaseItem } from 'types/overview';
import { prepareIngredientNameWithUnit } from 'utils/ingredientUtils';

interface IngredientsProps {
    item: PhaseItem;
}

const Ingredients: React.FC<IngredientsProps> = ({ item }) => {
    const theme = useTheme();
    const { recipe } = item;
    const ingredients = recipe?.ingredients || [];
    const serving = recipe?.serving || {};
    const peopleEatingNumber = item.peopleEatingNumber || 1;
    const servingAmount = item.amount || 1;
    const servingName = serving.name || 'serving';

    if (!recipe || !ingredients.length) {
        return (
            <View style={styles.emptyContainer}>
                <Text
                    textAlign="center"
                    style={{ color: theme.colors.grey, fontSize: 16 }}
                >
                    No ingredients information available
                </Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text
                textAlign="center"
                style={[styles.title, { fontSize: 24, fontWeight: '700' }]}
            >
                {recipe.name}
            </Text>

            <View style={styles.infoGroup}>
                <Text style={styles.servings}>
                    Servings: {servingAmount} {servingName}
                </Text>
            </View>

            <Text style={[styles.subtitle, { fontSize: 22 }]}>Ingredients:</Text>

            <FlatList
                scrollEnabled={false}
                data={ingredients}
                keyExtractor={(ing, index) => String(ing?.id || index)}
                renderItem={({ item: ing }) => (
                    <View style={styles.ingredientItem}>
                        <Text style={styles.listItmDot}>•</Text>
                        <Text variant="h4" style={styles.ingredientText}>
                            {prepareIngredientNameWithUnit({
                                ingredient: ing,
                                peopleEatingNumber,
                                amount: _.get(ing, 'amount'),
                            })}
                        </Text>
                    </View>
                )}
            />
        </ScrollView>
    );
};

export default Ingredients;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        marginTop: OFFSET.VERTICAL,
        marginBottom: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    infoGroup: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
        marginBottom: OFFSET.VERTICAL,
    },
    servings: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2978A0',
    },
    subtitle: {
        fontWeight: '700',
        borderBottomWidth: 1,
        paddingBottom: OFFSET.VERTICAL,
        borderBottomColor: '#D9D9D9',
        fontSize: 14,
        paddingHorizontal: OFFSET.HORIZONTAL,
        marginBottom: OFFSET.VERTICAL,
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    listItmDot: {
        fontSize: 22,
        lineHeight: 26,
        paddingRight: 5,
        paddingLeft: OFFSET.HORIZONTAL,
    },
    ingredientText: {
        lineHeight: 24,
        flex: 1,
        paddingRight: OFFSET.HORIZONTAL,
    },
});
