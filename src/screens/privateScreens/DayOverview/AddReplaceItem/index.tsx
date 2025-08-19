// outsource dependencies
import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
// local dependencies
import Text from '../../../../components/Text';
import Screen from '../../../../components/Screen';
import { useTheme } from '../../../../hooks/useTheme';
import { COLORS } from '../../../../constants/colors';
import { Button } from '../../../../components/Button';
import { useGetAvailableItemsQuery, AvailableItem } from '../../../../store/api/dayOverviewApi';

// Temporary types until full migration
interface AddReplaceItemProps {
  entityType?: string;
  excludeIds?: string[];
  onApply?: (item: any) => void;
}

export const AddReplaceItem: React.FC<AddReplaceItemProps> = () => {
    const theme = useTheme();
    const navigation = useNavigation();
    const route = useRoute<any>();
  
    const [selectedItems, setSelectedItems] = useState<AvailableItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
  
    const entityType = route.params?.entityType || 'FOOD';
    const excludeIds = route.params?.excludeIds || [];
    const onApply = route.params?.onApply;

    const { data: availableItems, isLoading, error, refetch } = useGetAvailableItemsQuery({
        page,
        size: 20,
        excludeIds,
        entityType,
        sort: 'name,ASC',
        name: searchQuery || undefined,
    });

    const filteredItems = availableItems || [];

    useEffect(() => {
        navigation.setOptions({
            title: `Select ${entityType.toLowerCase()}`,
        });
    }, [navigation, entityType]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setPage(0);
            refetch();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, refetch]);

    const handleItemPress = (item: AvailableItem) => {
        if (selectedItems.find(selected => selected.id === item.id)) {
            setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    const handleApply = () => {
        if (onApply && selectedItems.length > 0) {
            onApply(selectedItems[0]); // For now, just take the first selected item
            navigation.goBack();
        }
    };

    const handleLoadMore = () => {
        if (!isLoading) {
            setPage(prev => prev + 1);
        }
    };

    const renderItem = ({ item }: { item: AvailableItem }) => {
        const isSelected = selectedItems.find(selected => selected.id === item.id);
    
        return (
            <TouchableOpacity
                style={styles.listItem}
                onPress={() => handleItemPress(item)}
            >
                <View style={styles.content}>
                    <View style={styles.image} />
                    <View style={styles.listTitle}>
                        <Text style={{ fontSize: 16, fontWeight: '500', color: theme.colors.text }}>
                            {item.name}
                        </Text>
                        <Text style={{ fontSize: 14, color: COLORS.GREY, marginTop: 4 }}>
                            {item.type}
                        </Text>
                        {item.description && (
                            <Text style={{ fontSize: 12, color: COLORS.GREY, marginTop: 2 }}>
                                {item.description}
                            </Text>
                        )}
                    </View>
                </View>
                {isSelected && (
                    <Text style={{ color: COLORS.BLUE, fontSize: 18 }}>✓</Text>
                )}
            </TouchableOpacity>
        );
    };

    const renderSearchInput = () => (
        <View style={[styles.search, styles.offset]}>
            <TextInput
                value={searchQuery}
                placeholder="Search..."
                onChangeText={setSearchQuery}
                placeholderTextColor={COLORS.GREY}
                style={[styles.searchInput, { color: theme.colors.text }]}
            />
        </View>
    );

    if (isLoading && page === 0) {
        return (
            <Screen initialized={true} style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text>Loading available items...</Text>
                </View>
            </Screen>
        );
    }

    if (error) {
        return (
            <Screen initialized={true} style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={{ color: COLORS.RED }}>
            Error loading items. Please try again.
                    </Text>
                </View>
            </Screen>
        );
    }

    return (
        <Screen initialized={true} style={styles.container}>
            <View style={styles.offset}>
                <Text variant="h3" style={styles.title}>
          Select {entityType.toLowerCase()}
                </Text>
            </View>

            {renderSearchInput()}

            <FlatList
                style={styles.list}
                data={filteredItems}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    <Text style={[styles.emptyScreen, { textAlign: 'center', color: COLORS.GREY }]}>
            No items found
                    </Text>
                }
                ListFooterComponent={
                    isLoading && page > 0 ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text>Loading more...</Text>
                        </View>
                    ) : null
                }
            />

            {selectedItems.length > 0 && (
                <View style={styles.buttonContainer}>
                    <Button
                        title={`Add ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}`}
                        variant="primary"
                        onPress={handleApply}
                    />
                </View>
            )}
        </Screen>
    );
};

export default AddReplaceItem;

const styles = StyleSheet.create({
    container: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    offset: {
        paddingTop: 20,
        paddingLeft: 16,
        paddingRight: 16,
    },
    title: {
        paddingTop: 20,
        marginBottom: 20,
    },
    search: {
        marginBottom: 4,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: COLORS.GREY,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        backgroundColor: COLORS.WHITE,
    },
    list: {
        flex: 1,
        paddingLeft: 16,
        paddingRight: 0,
    },
    listItem: {
        display: 'flex',
        flexDirection: 'row',
        paddingVertical: 20,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.DARK_GREY,
        marginRight: 16,
    },
    content: {
        display: 'flex',
        flexDirection: 'row',
        maxWidth: '85%',
    },
    image: {
        width: 48,
        height: 48,
        marginRight: 4,
        backgroundColor: COLORS.LIGHT_GREY,
        borderRadius: 4,
    },
    listTitle: {
        flex: 1,
        alignSelf: 'center',
    },
    emptyScreen: {
        marginTop: 20,
    },
    buttonContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.LIGHT_GREY,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
