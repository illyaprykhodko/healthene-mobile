// outsource dependencies
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';

// local dependencies
import Text from 'components/Text';
import Rating from 'components/Rating';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import Controls from 'components/Controls';
import DefImage from 'components/DefImage';
import { PhaseItem } from 'types/overview';
import { ENTITY_TYPE, OVERVIEW_TYPE } from 'constants/spec';
import { prepareIngredientNameWithUnit } from 'utils/ingredientUtils';

interface OverviewProps {
    item: PhaseItem;
    disabled?: boolean;
    isSurrogateRecipe?: boolean;
    updateItem: (data: any) => void;
}

const Overview: React.FC<OverviewProps> = ({
    item,
    disabled = false,
    isSurrogateRecipe = false,
    updateItem,
}) => {
    const theme = useTheme();
    const {
        type,
        food,
        recipe,
        amount,
        weight,
        rating,
        serving,
        supplement,
        medication,
        useServing,
        initialAmount,
        physicalActivity,
    } = item;

    const renderContent = () => {
        switch (type) {
            case ENTITY_TYPE.FOOD: {
                return (
                    <View style={styles.offset}>
                        <Text textAlign="center" variant="h1" style={styles.title}>
                            {food?.name}
                        </Text>
                        <Text textAlign="center" variant="h1" style={styles.subTitle}>
                            Rate this Food
                        </Text>
                        <Rating
                            value={rating || 0}
                            disabled={disabled}
                            style={styles.rating}
                            onApply={({ rating }) => updateItem({ ...item, rating })}
                        />
                        <View style={[styles.center, { marginBottom: OFFSET.VERTICAL }]}>
                            <DefImage
                                src={food?.coverImage?.url}
                                style={styles.image}
                            />
                        </View>
                        <View style={[styles.center, styles.marginBottom]}>
                            <Controls
                                disabled={disabled}
                                amount={amount || initialAmount}
                                isSurrogateRecipe={isSurrogateRecipe}
                                updateData={amount => updateItem({ ...item, amount })}
                                unit={
                                    !isSurrogateRecipe
                                        ? weight?.unit?.name
                                        : `${weight?.unit?.name || 'serving'} of ${food?.name}`
                                }
                            />
                        </View>
                    </View>
                );
            }
            case ENTITY_TYPE.CUSTOM_RECIPE:
            case ENTITY_TYPE.RECIPE: {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const recipeData = recipe;
                return (
                    <View style={styles.offset}>
                        <View style={styles.titleWrapper}>
                            <Text variant="h1" textAlign="center" style={styles.title}>
                                {recipeData?.name}
                            </Text>
                            <Text textAlign="center" variant="h1" style={styles.subTitle}>
                                Rate this Recipe
                            </Text>
                        </View>
                        <Rating
                            value={rating || 0}
                            disabled={disabled}
                            style={styles.rating}
                            onApply={({ rating }) => updateItem({ ...item, rating })}
                        />
                        <View style={[styles.center, { marginBottom: OFFSET.VERTICAL }]}>
                            <DefImage
                                style={styles.image}
                                src={
                                    recipeData?.surrogateRecipe
                                        ? recipeData?.ingredients?.[0]?.entity?.coverImage?.url
                                        : recipeData?.coverImage?.url
                                }
                            />
                        </View>
                        <View style={[styles.center, styles.marginBottom]}>
                            <Controls
                                disabled={disabled}
                                amount={amount || initialAmount || 1}
                                updateData={amount => updateItem({ ...item, amount })}
                                unit={
                                    isSurrogateRecipe
                                        ? prepareIngredientNameWithUnit(
                                            {
                                                amount,
                                                serving,
                                                useServing,
                                                ingredient: recipeData?.ingredients?.[0],
                                            },
                                            { withoutName: true, withoutAmount: true }
                                        )
                                        : recipeData?.serving?.name || 'serving'
                                }
                            />
                        </View>
                    </View>
                );
            }
            case OVERVIEW_TYPE.PHYSICAL_ACTIVITY:
                return (
                    <View style={styles.offset}>
                        <Text textAlign="center" variant="h1" style={styles.title}>
                            {physicalActivity?.name}
                        </Text>
                        <Text variant="h4" textAlign="center">
                            {physicalActivity?.description}
                        </Text>
                        <Rating
                            value={rating || 0}
                            disabled={disabled}
                            style={styles.rating}
                            onApply={({ rating }) => updateItem({ ...item, rating })}
                        />
                        <View style={[styles.center, styles.marginBottom]}>
                            <DefImage
                                src={physicalActivity?.coverImage?.url}
                                style={styles.image}
                            />
                        </View>
                    </View>
                );
            case OVERVIEW_TYPE.MEDICATION:
                return (
                    <View style={styles.offset}>
                        <Text textAlign="center" variant="h1" style={styles.title}>
                            {medication?.name}
                        </Text>
                        <Text variant="h4" textAlign="center">
                            {medication?.description}
                        </Text>
                        <View style={[styles.center, { marginBottom: OFFSET.VERTICAL }]}>
                            <DefImage
                                src={medication?.coverImage?.url}
                                style={styles.image}
                            />
                        </View>
                    </View>
                );
            case OVERVIEW_TYPE.SUPPLEMENT:
                return (
                    <View style={styles.offset}>
                        <Text textAlign="center" variant="h1" style={styles.title}>
                            {supplement?.name}
                        </Text>
                        <Text variant="h4" textAlign="center">
                            {supplement?.description}
                        </Text>
                        <View style={[styles.center, { marginBottom: OFFSET.VERTICAL }]}>
                            <DefImage
                                src={supplement?.coverImage?.url}
                                style={styles.image}
                            />
                        </View>
                    </View>
                );
            default:
                return (
                    <View style={styles.offset}>
                        <Text textAlign="center" variant="h4" style={{ color: theme.colors.grey }}>
                            No data available
                        </Text>
                    </View>
                );
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scroller}>
            {renderContent()}
        </ScrollView>
    );
};

export default Overview;

const styles = StyleSheet.create({
    titleWrapper: {
        flex: 1,
    },
    title: {
        // marginVertical: OFFSET.VERTICAL * 2,
        fontSize: 24,
        fontWeight: '700',
    },
    subTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2978A0',
    },
    center: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    image: {
        width: 200,
        height: 200,
        borderRadius: 8,
    },
    offset: {
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    rating: {
        paddingBottom: OFFSET.VERTICAL * 2,
        paddingTop: OFFSET.VERTICAL,
    },
    marginBottom: {
        marginBottom: OFFSET.VERTICAL * 3,
    },
    main: {
        flex: 1,
        justifyContent: 'center',
    },
    scroller: {
        flexGrow: 1,
        paddingVertical: OFFSET.VERTICAL * 2,
    },
});
