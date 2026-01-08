// outsource dependencies
import React from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { View, StyleSheet, FlatList } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { size, sortBy } from 'utils/general';
import { PatientRecipe } from 'types/overview';

interface RecipeProps {
    recipe: PatientRecipe;
}

const Recipe: React.FC<RecipeProps> = ({ recipe }) => {
    const theme = useTheme();
    const recipeSize = size(recipe?.steps);
    if (!recipe || !recipeSize) {
        return (
            <View style={styles.emptyContainer}>
                <Text textAlign="center" style={{ color: theme.colors.grey }}>
                    No recipe steps available
                </Text>
            </View>
        );
    }

    const steps = sortBy(recipe?.steps, 'order');
    const stepsTitles = steps.filter(step => Boolean(step.name));
    const lastItem = steps[steps.length - 1];

    const renderHeader = () => (
        <View>
            <Text variant="h1" textAlign="center" style={[styles.title, styles.offset]}>
                {recipe.name}
            </Text>
            {!recipe.surrogateRecipe && (
                <View style={styles.infoGroup}>
                    <Icon name="clock" size={20} color="#2978A0" />
                    <Text style={styles.headerPreparationName} variant="h3">
                        {recipe.preparationTime.name || '-'}
                    </Text>
                </View>
            )}
        </View>
    );

    const renderItem = ({ item, index }: { item: any; index: number }) => {
        const stepIndex = stepsTitles.findIndex(step => step.name === item.name);
        const isLastItem = index === steps.length - 1;
        return (
            <View style={[styles.offset]}>
                {item?.name ? (
                    <Text style={styles.link}>
                        {stepIndex + 1}. {item?.name}
                    </Text>
                ) : null}
                {!isLastItem ? (
                    <View
                        style={[
                            styles.listItemView,
                            !item?.name && !index && styles.listItemIndent,
                        ]}
                    >
                        <Text style={styles.listItmDot}>•</Text>
                        <Text style={styles.listIteContent} variant="h4">
                            {item.content.trim()}
                        </Text>
                    </View>
                ) : null}
            </View>
        );
    };

    const renderFooter = () => (
        <View>
            <Text style={styles.listFooter} variant="h1" textAlign="center">
                {lastItem.content}
            </Text>
        </View>
    );

    return (
        <FlatList
            data={steps}
            renderItem={renderItem}
            initialNumToRender={steps.length}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            keyExtractor={({ id }, index) => String(id || index)}
        />
    );
};

export default Recipe;

const styles = StyleSheet.create({
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        marginTop: OFFSET.VERTICAL,
        fontSize: 24,
        fontWeight: '700',
    },
    infoGroup: {
        flexDirection: 'row',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingTop: OFFSET.VERTICAL * 2,
        marginHorizontal: OFFSET.HORIZONTAL,
        alignItems: 'center',
    },
    offset: {
        paddingLeft: OFFSET.HORIZONTAL,
        paddingRight: OFFSET.HORIZONTAL,
    },
    link: {
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 25,
        fontSize: 18,
        color: '#000',
    },
    headerPreparationName: {
        marginLeft: 10,
        color: '#2978A0',
    },
    listItemView: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginLeft: 20,
    },
    listItemIndent: {
        marginTop: 25,
    },
    listItmDot: {
        fontSize: 22,
        lineHeight: 26,
        paddingRight: 5,
    },
    listIteContent: {
        lineHeight: 24,
        flex: 1,
    },
    listFooter: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        marginBottom: 35,
        marginTop: 15,
        color: '#007FFF',
    },
});
