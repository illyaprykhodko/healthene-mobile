// outsource dependencies
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View, SectionList, TouchableOpacity } from 'react-native';
import React, { memo, useCallback, useLayoutEffect, useMemo, useState } from 'react';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import BackBtn from 'components/BackBtn';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import DefImage from 'components/DefImage';
import { Button } from 'components/Button';
import { SHOPPING_STEP } from 'constants/spec';
import { useAppDispatch, useAppSelector } from 'store';
import {
    setCurrentStep,
    toggleStockItem,
    selectCheckedStockItems,
} from 'store/slices/shoppingSlice';
import {
    useGetStockListQuery,
    useGetStockCategoriesQuery,
    useUpdateStockItemsMutation,
    useMoveStocksToShoppingListMutation
} from 'store/api/shoppingApi';
import HorizontalMenu from 'components/HorizontalMenu';
import ConfirmationAlert from 'components/ConfirmationAlert';

interface StockItem {
    id: number;
    gramWeight: number;
    food: {
        id: number;
        name: string;
        coverImage?: { url: string };
        shoppingCartCategory?: {
            id: number;
            name: string;
        };
    };
}

interface GroupedSection {
    title: string;
    data: StockItem[];
}

const ALL_CATEGORY: { name: string; id?: number | null } = { name: 'All' };
const ADDITIONAL_CATEGORY_NAME = 'Additional';

const StockList: React.FC = () => {
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();

    const [open, setOpen] = useState(true);
    const [activeCategory, setActiveCategory] = useState<{ name: string; id?: number | null }>(ALL_CATEGORY);
    const [page, setPage] = useState(0);
    const checkedItems = useAppSelector(selectCheckedStockItems);
    const hasActiveCategoryId = Object.prototype.hasOwnProperty.call(activeCategory || {}, 'id');
    const selectedStockCategoryId = hasActiveCategoryId
        ? activeCategory.id
        : undefined;
    const { data: stockData, isLoading, isFetching } = useGetStockListQuery({
        shoppingCartCategoryId: selectedStockCategoryId,
        page,
        size: 20,
    });
    // const { data: stockData, isLoading } = useGetStockListQuery();
    const [updateStock, { isLoading: isUpdating }] = useUpdateStockItemsMutation();
    const { data: categoriesData } = useGetStockCategoriesQuery();
    const [moveStocksToShoppingList] = useMoveStocksToShoppingListMutation();
    const stockList = stockData?.content || [];
    // Get unique categories
    // const tabs = useMemo(() => {
    //     const categories = new Map<number, string>();
    //     stockList.forEach((item: StockItem) => {
    //         const cat = item.food?.shoppingCartCategory;
    //         if (cat) {
    //             categories.set(cat.id, cat.name);
    //         }
    //     });
    //     return [
    //         { name: 'All' },
    //         ...Array.from(categories.entries()).map(([id, name]) => ({ id, name })),
    //     ];
    // }, [stockList]);
    const tabs = useMemo(() => {
        const categories = categoriesData || [];
        const normalized = categories
            .filter(category => category && typeof category.name === 'string' && category.name.trim() !== '')
            .map(category => ({ ...category, name: category.name.trim() }));
        return [ALL_CATEGORY, ...normalized];
    }, [categoriesData]);

    const uncategorizedCategoryName = useMemo(() => (
        tabs.find(tab => tab?.id === null || tab?.id === 0)?.name || ADDITIONAL_CATEGORY_NAME
    ), [tabs]);
    // Filter and group by category
    const groupedList: GroupedSection[] = useMemo(() => {
        // let filtered = stockList;
        // if (activeCategory.id) {
        //     filtered = stockList.filter(
        //         (item: StockItem) => item.food?.shoppingCartCategory?.id === activeCategory.id
        //     );
        // }

        const grouped: Record<string, StockItem[]> = {};
        stockList.forEach((item: StockItem) => {
            const categoryName = item.food?.shoppingCartCategory?.name
                || (item as any)?.shoppingCartCategory?.name
                || uncategorizedCategoryName;
            if (!grouped[categoryName]) {
                grouped[categoryName] = [];
            }
            grouped[categoryName].push(item);
        });

        return Object.entries(grouped).map(([title, data]) => ({ title, data }));
    }, [stockList, uncategorizedCategoryName]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => <BackBtn onPress={handleGoBack} />,
        });
    }, [navigation]);

    const handleGoBack = useCallback(() => {
        dispatch(setCurrentStep(SHOPPING_STEP.MAIN));
        navigation.goBack();
    }, [navigation, dispatch]);

    const handleToggleItem = useCallback((item: StockItem) => {
        dispatch(toggleStockItem(item.id));
    }, [dispatch]);

    const handleNextBtn = useCallback(async () => {
        try {
            if (checkedItems.length > 0) {
                // await updateStock({ ids: checkedItems }).unwrap();
                await moveStocksToShoppingList({ ids: checkedItems }).unwrap();
            }
            dispatch(setCurrentStep(SHOPPING_STEP.CHECK));
            navigation.navigate(ROUTES.SHOPPING_LIST);
        } catch (error) {
            console.error('Error updating stock:', error);
        }
    }, [checkedItems, updateStock, dispatch, navigation, moveStocksToShoppingList, checkedItems]);

    const handleCategoryChange = useCallback((item: any) => {
        const next = item?.activeItem ?? item;
        setActiveCategory({ name: next?.name ?? 'All', id: next?.id });
        // setActiveCategory(item.activeItem || item);
        setPage(0);
    }, []);

    const handleCloseAlert = useCallback(() => setOpen(false), []);

    const disabled = isLoading || isUpdating;

    const renderItem = useCallback(({ item }: { item: StockItem }) => {
        const isChecked = checkedItems.includes(item.id);

        // Convert weight
        // let convertedWeight = filters.kilogramsToPounds(item.gramWeight);
        let convertedWeight = Math.round((item.gramWeight / 1000) * 2.20462 * 100) / 100;
        let unit = 'lbs';
        if (convertedWeight <= 0) {
            convertedWeight = Math.round(item.gramWeight * 0.03527396195 * 1000) / 1000;
            unit = 'oz';
        }

        return (
            <TouchableOpacity
                disabled={disabled}
                style={styles.itemContainer}
                onPress={() => handleToggleItem(item)}
            >
                <DefImage
                    src={item.food?.coverImage?.url}
                    style={isChecked ? { ...styles.image, ...styles.imageChecked } : styles.image}
                />
                <View style={styles.textContainer}>
                    <Text
                        variant="h5"
                        style={isChecked ? styles.textDecoration : undefined}
                    >
                        {item.food?.name}
                    </Text>
                    <Text
                        variant="h6"
                        color={COLORS.GREY}
                        style={isChecked ? styles.textDecoration : undefined}
                    >
                        {convertedWeight} {unit}
                    </Text>
                </View>
                <View style={[styles.checkbox, isChecked && styles.checkboxUnchecked]}>
                    {!isChecked && <Text style={styles.checkmark}>✓</Text>}
                </View>
            </TouchableOpacity>
        );
    }, [checkedItems, disabled, handleToggleItem]);

    const renderSectionHeader = useCallback(({ section }: { section: GroupedSection }) => (
        <View style={styles.section}>
            <Text variant="h3" style={styles.sectionTitle}>{section.title}</Text>
        </View>
    ), []);

    return (
        <Screen initialized={!isLoading} style={styles.container}>
            <View style={styles.content}>
                {groupedList.length === 0 ? (
                    <Text textAlign="center" color={COLORS.GREY} style={styles.emptyText}>
                        No Stock list was found
                    </Text>
                ) : (
                    <>
                        <HorizontalMenu
                            data={tabs}
                            disabled={disabled}
                            activeItem={activeCategory}
                            handleItem={handleCategoryChange}
                        />
                        <SectionList
                            sections={groupedList}
                            renderItem={renderItem}
                            stickySectionHeadersEnabled
                            renderSectionHeader={renderSectionHeader}
                            keyExtractor={(item, index) => `${item.id}_${index}`}
                            onEndReached={() => {
                                if (stockData && !isFetching && page + 1 < stockData.totalPages) {
                                    setPage(p => p + 1);
                                }
                            }}
                        />
                    </>
                )}
            </View>

            <View style={styles.buttonControl}>
                <Button
                    variant="primary"
                    disabled={disabled}
                    style={styles.nextBtn}
                    onPress={handleNextBtn}
                    textStyle={styles.nextBtnText}
                    title={checkedItems.length === 0 ? 'Skip' : 'Next'}
                />
            </View>

            <ConfirmationAlert
                hideCancelBtn
                isOpen={open}
                title="Stock List"
                disabled={disabled}
                applyTxt="View List"
                onClose={handleCloseAlert}
                onSubmit={handleCloseAlert}
                message="Check that these items are still in your kitchen."
            />
        </Screen>
    );
};

export default memo(StockList);

const styles = StyleSheet.create({
    container: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    content: {
        flex: 1,
        marginTop: OFFSET.VERTICAL,
    },
    emptyText: {
        marginTop: OFFSET.VERTICAL * 2,
    },
    section: {
        paddingLeft: 16,
        paddingVertical: 16,
        alignItems: 'center',
        flexDirection: 'row',
        borderBottomWidth: 1,
        justifyContent: 'space-between',
        borderBottomColor: COLORS.LIGHT_GREY,
        backgroundColor: '#E8F4FC',
    },
    sectionTitle: {
        color: COLORS.THEME_COLOR,
    },
    itemContainer: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.LIGHT_GREY,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    imageChecked: {
        opacity: 0.5,
    },
    textContainer: {
        flex: 1,
        marginLeft: OFFSET.HORIZONTAL,
    },
    textDecoration: {
        color: COLORS.GREY,
        textDecorationStyle: 'solid',
        textDecorationLine: 'line-through',
    },
    checkbox: {
        width: 27,
        height: 27,
        borderRadius: 4,
        backgroundColor: COLORS.GREEN,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxUnchecked: {
        backgroundColor: COLORS.WHITE,
        // backgroundColor: COLORS.GREEN,
        borderWidth: 2,
        borderColor: COLORS.GREY,
    },
    checkmark: {
        color: COLORS.WHITE,
        fontWeight: 'bold',
        fontSize: 20,
        // alignSelf: 'center',
    },
    buttonControl: {
        borderTopWidth: 1,
        flexDirection: 'row',
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
        borderTopColor: COLORS.LIGHT_GREY,
    },
    nextBtn: {
        flex: 1,
        backgroundColor: '#B8E6B3',
        borderColor: '#00788D',
        borderWidth: 3,
        borderRadius: 30,
    },
    nextBtnText: {
        fontSize: 24,
        color: '#00788D',
        fontWeight: 'bold',
    },
});
