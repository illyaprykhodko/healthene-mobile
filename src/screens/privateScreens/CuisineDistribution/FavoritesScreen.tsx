// outsource dependencies
import Icon from '@react-native-vector-icons/fontawesome5';
import React, { useCallback, useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Platform } from 'react-native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
import { RangeSlider } from 'components/RangeSlider';
import { TagType, CuisineFrequency } from 'types/cuisineDistribution';
import {
    useGetCuisineFrequencyQuery,
    useUpdateCuisineFrequencyMutation,
} from 'store/api/cuisineDistributionApi';

interface FavoritesScreenProps {
    navigation: any;
}

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ navigation }) => {
    const theme = useTheme();
    const [isDirty, setIsDirty] = useState(false);
    const [localFavoriteList, setLocalFavoriteList] = useState<CuisineFrequency[]>([]);

    const { data: favoriteList, isLoading, isFetching } = useGetCuisineFrequencyQuery(TagType.CUISINE);
    const [updateFrequency, { isLoading: isUpdating }] = useUpdateCuisineFrequencyMutation();

    useEffect(() => {
        if (favoriteList) {
            setLocalFavoriteList(favoriteList);
        }
    }, [favoriteList]);

    const navigateToList = useCallback(() => {
        navigation.navigate(ROUTES.CUISINE_DISTRIBUTION_LIST);
    }, [navigation]);

    const handleChange = useCallback((item: CuisineFrequency, value: number) => {
        setLocalFavoriteList(prev =>
            prev.map(elem =>
                (elem?.tag?.name === item?.tag?.name
                    ? { ...elem, relativeFrequency: value }
                    : elem)
            )
        );
        setIsDirty(true);
    }, []);

    const handleSave = useCallback(async () => {
        try {
            await updateFrequency(localFavoriteList).unwrap();
            setIsDirty(false);
        } catch (error) {
            console.error('Failed to update cuisine frequency:', error);
        }
    }, [updateFrequency, localFavoriteList]);

    const renderItem = useCallback(({ item }: { item: CuisineFrequency }) => (
        <RangeSlider
            item={item}
            isFormDirty={isDirty}
            onChange={handleChange}
            title={item?.tag?.name}
            value={item?.relativeFrequency || 1}
        />
    ), [isDirty, handleChange]);

    const keyExtractor = useCallback((item: CuisineFrequency) =>
        String(item?.id ?? item?.tag?.id), []);

    return (
        <Screen
            style={styles.container}
            initialized={!isLoading && !isFetching}
        >
            <View style={styles.content}>
                <View style={[styles.titleButtons,
                    { backgroundColor: theme.colors.white }
                ]}>
                    <TouchableOpacity
                        onPress={navigateToList}
                        style={[styles.changeButton, { borderBottomColor: theme.colors.border }]}
                    >
                        <Text variant="h4">Change Cuisine</Text>
                        <Icon
                            size={18}
                            iconStyle="solid"
                            name="chevron-right"
                            color={theme.colors.text}
                        />
                    </TouchableOpacity>
                </View>

                {localFavoriteList.length > 0 && (
                    <View style={styles.sectionHeader}>
                        <Text variant="h5" color={theme.colors.textSecondary}>
                            SET CUISINE PREFERENCE AMOUNT
                        </Text>
                    </View>
                )}

                <FlatList
                    renderItem={renderItem}
                    data={localFavoriteList}
                    keyExtractor={keyExtractor}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text variant="body" color={theme.colors.textSecondary} style={styles.emptyText}>
                                No cuisines selected. Tap "Change Cuisine" to add your preferences.
                            </Text>
                        </View>
                    }
                />
            </View>

            <Button
                title="SAVE"
                variant="success"
                onPress={handleSave}
                disabled={!localFavoriteList.length || !isDirty || isUpdating}
                style={[
                    styles.submitBtn,
                    isDirty ? styles.submitBtnActive : styles.submitBtnInactive,
                ]}
                textStyle={styles.submitBtnText}
            />
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    content: {
        flex: 1,
        marginBottom: OFFSET.VERTICAL,
    },
    titleButtons: {
        alignItems: 'center',
        flexDirection: 'row',
        marginVertical: OFFSET.VERTICAL,
    },
    changeButton: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        justifyContent: 'space-between',
        paddingVertical: OFFSET.VERTICAL * 1.5,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    sectionHeader: {
        marginTop: OFFSET.VERTICAL * 2,
        marginBottom: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    listContent: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingBottom: OFFSET.VERTICAL * 2,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: OFFSET.VERTICAL * 4,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    emptyText: {
        textAlign: 'center',
    },
    submitBtn: {
        width: '90%',
        borderRadius: 30,
        alignSelf: 'center',
        marginBottom: OFFSET.VERTICAL,
        borderColor: 'transparent',
    },
    submitBtnActive: {
        backgroundColor: '#96E072',
    },
    submitBtnInactive: {
        backgroundColor: '#E5E5EA',
    },
    submitBtnText: {
        fontSize: 18,
        fontWeight: Platform.OS === 'ios' ? '600' : '700',
    },
});

export default FavoritesScreen;
