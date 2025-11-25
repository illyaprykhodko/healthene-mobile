// outsource dependencies
import React, { useCallback } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import {
    useGetRescueCatalogQuery,
    // useRevertPhaseItemMutation, // for debugging
    useGetRestaurantCatalogQuery,
} from 'store/api/dayOverviewApi';
import { ROUTES } from 'constants/routes';
import { RootStackParamList } from 'services/navigation';

// temporary types
interface Category {
    id: number;
    name: string;
    restaurantCatalog: boolean;
    coverImage?: { url: string };
    parent: {
        id: number;
        recipeCount: number;
    }
    list: [] | null;
    rescueNodes: any[];
    parentIds: number[];
    catalogType: 'RESCUE' | string;
    contentType: 'ANOTHER' | 'FROZEN' | 'RESTAURANT';
};

const ReplacementScreen: React.FC = () => {
    const theme = useTheme();
    const route = useRoute<any>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const phaseId = route.params?.phaseId;
    const isRestaurantMode = route.params?.isRestaurantMode || false;

    // Fetch rescue catalog
    const { data: rescueCatalog, isLoading: isLoadingRescue } = useGetRescueCatalogQuery(phaseId, {
        skip: !phaseId,
    });

    // const [revertPhaseItem] = useRevertPhaseItemMutation();
    // Fetch restaurant catalog
    const { data: restaurantCatalog, isLoading: isLoadingRestaurant } = useGetRestaurantCatalogQuery(phaseId, {
        skip: !phaseId,
    });

    const categories: Category[] = isRestaurantMode
        ? (restaurantCatalog?.list || [])
        : [...(rescueCatalog?.list || []), ...(restaurantCatalog ? [restaurantCatalog] : [])];
    const handleCategoryPress = useCallback(
        (category: Category) => {
            if (category.list) {
                // Nested categories - navigate to another Replacement screen
                navigation.navigate(ROUTES.REPLACEMENT, {
                    phaseId,
                    list: category.list,
                    isRestaurantMode: category.restaurantCatalog,
                });
            } else {
                // Final category - navigate to ReplaceItems
                navigation.navigate(ROUTES.REPLACE_ITEMS, {
                    phaseId,
                    isRestaurantMode,
                    title: category.name,
                    catalogId: category.id,
                });
            }
        },
        [navigation, phaseId, isRestaurantMode]
    );

    const isLoading = isLoadingRescue || isLoadingRestaurant;

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!categories || categories.length === 0) {
        return (
            <Screen initialized style={styles.container}>
                <Text color={theme.colors.textSecondary} style={styles.emptyText} textAlign="center">
                    No replacement options available
                </Text>

                {/* <TouchableOpacity
                    onPress={() => revertPhaseItem({ phaseItemId: 52981701 })}
                >
                    <Text
                    >
                        REVERT
                    </Text>
                </TouchableOpacity> */}
            </Screen>
        );
    }

    return (
        <Screen initialized style={styles.container}>
            <View style={[styles.header]}>
                <Text variant="h3" style={[styles.headerText, { color: theme.colors.text }]}>
                    Main Entrée
                </Text>
            </View>
            <View style={styles.list}>
                {categories.map((category, index) => (
                    <TouchableOpacity
                        key={category.id || index}
                        style={[styles.categoryItem, { borderBottomColor: theme.colors.border }]}
                        onPress={() => handleCategoryPress(category)}
                    >
                        {category.coverImage?.url ? (
                            <View style={styles.imageContainer}>
                                <Image source={{ uri: category.coverImage.url }} style={styles.image} />
                            </View>
                        ) : category.name === 'Restaurant Meals' ? (
                            <View style={styles.imageContainer}>
                                <Icon name="utensils" size={32} color={theme.colors.primary} />
                            </View>
                        ) : (
                            <View style={styles.imageContainer} />
                        )}
                        <Text variant="h4" style={[styles.categoryName, { color: theme.colors.text }]}>
                            {category.name}
                        </Text>
                        <Icon
                            size={18}
                            name="chevron-right"
                            color={theme.colors.textSecondary}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        </Screen>
    );
};

export default ReplacementScreen;

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
    header: {
        paddingHorizontal: 8,
        paddingVertical: 16,
        borderBottomWidth: 1
    },
    headerText: {
        fontWeight: '500',
        marginLeft: 16,
    },
    list: {
        flex: 1,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
    },
    imageContainer: {
        width: 48,
        height: 48,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryName: {
        flex: 1,
        fontWeight: '600',
        fontSize: 18,
        lineHeight: 24,
        marginRight: 8,
    },
    image: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    emptyText: {
        marginTop: 8,
    },
});
