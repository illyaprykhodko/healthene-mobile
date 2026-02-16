// outsource dependencies
import Icon from '@react-native-vector-icons/feather';
import { useNavigation } from '@react-navigation/native';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
// local dependencies
import {
    useGetShoppingPreferencesQuery,
    useGenerateShoppingListMutation,
    useUpdateShoppingPreferencesMutation,
} from 'store/api/shoppingApi';
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useAppDispatch } from 'store';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { Button } from 'components/Button';
import { SHOPPING_STEP } from 'constants/spec';
import { setCurrentStep } from 'store/slices/shoppingSlice';
// import { ShoppingListSkeleton } from 'components/Skeleton/ShoppingListSkeleton';
import GenerateShoppingListSkeleton from 'components/Skeleton/GenerateShoppingListSkeleton';
import { ShoppingPreferencesSkeleton } from 'components/Skeleton/ShoppingPreferencesSkeleton';

interface PreferenceItem {
    id: number;
    name: string;
    amount: number;
    order: number;
}

const ShoppingPreferences: React.FC = () => {
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();

    const [localPreferences, setLocalPreferences] = useState<PreferenceItem[]>([]);
    const [isChanged, setIsChanged] = useState(false);

    const { data: preferences, isLoading } = useGetShoppingPreferencesQuery();
    const [updatePreferences, { isLoading: isUpdating }] = useUpdateShoppingPreferencesMutation();
    const [generateList, { isLoading: isGenerating }] = useGenerateShoppingListMutation();

    useEffect(() => {
        if (preferences) {
            const sorted = [...preferences].sort((a, b) => a.order - b.order);
            setLocalPreferences(sorted);
        }
    }, [preferences]);

    const handleAmountChange = useCallback((id: number, delta: number) => {
        setLocalPreferences(prev =>
            prev.map(item =>
                (item.id === id
                    ? { ...item, amount: Math.max(0, item.amount + delta) }
                    : item)
            )
        );
        setIsChanged(true);
    }, []);

    const handleNext = useCallback(async () => {
        try {
            if (isChanged) {
                await updatePreferences(localPreferences).unwrap();
                await generateList({}).unwrap();
            }
            dispatch(setCurrentStep(SHOPPING_STEP.MAIN));
            navigation.navigate(ROUTES.SHOPPING_LIST, { excluded: false });
            setIsChanged(false);
        } catch (error) {
            console.error('Error updating preferences:', error);
        }
    }, [isChanged, localPreferences, updatePreferences, generateList, dispatch, navigation]);

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const disabled = isLoading || isUpdating || isGenerating;
    const hasValidAmount = localPreferences.some(p => p.amount > 0);

    const renderItem = useCallback(({ item }: { item: PreferenceItem }) => (
        <View style={styles.listItem}>
            <Text variant="h4" style={styles.itemName}>{item.name}</Text>
            <View style={styles.controls}>
                <TouchableOpacity
                    onPress={() => handleAmountChange(item.id, -1)}
                    disabled={disabled || item.amount === 0}
                    style={[styles.controlBtn, item.amount === 0 && styles.controlBtnDisabled]}
                >
                    <Icon name="minus" size={16} color={item.amount === 0 ? COLORS.DARK_GREY : COLORS.DARK_GREY} />
                </TouchableOpacity>
                <View style={styles.amountWrapper}>
                    <Text style={styles.amount}>{item.amount}</Text>
                    <Text style={styles.amountLabel}>Amount</Text>
                </View>
                <TouchableOpacity
                    onPress={() => handleAmountChange(item.id, 1)}
                    disabled={disabled}
                    style={styles.controlBtn}
                >
                    <Icon name="plus" size={16} color={COLORS.DARK_GREY} />
                </TouchableOpacity>
            </View>
        </View>
    ), [handleAmountChange, disabled]);
    if (isGenerating) {
        return <GenerateShoppingListSkeleton />;
    }
    if (isLoading || isUpdating) {
        return <ShoppingPreferencesSkeleton />;
    }
    return (
        <Screen initialized={!isLoading} style={styles.container}>
            <View style={styles.description}>
                <Text textAlign="center" variant="h3" color={COLORS.DARK_BLUE}>
                    People Eating Per Meal
                </Text>
            </View>

            <View style={styles.list}>
                <FlatList
                    data={localPreferences}
                    renderItem={renderItem}
                    keyExtractor={item => String(item.id)}
                />
            </View>

            <View style={styles.buttonControl}>
                <Button
                    title="Back"
                    variant="secondary"
                    disabled={disabled}
                    onPress={handleBack}
                    style={styles.backBtn}
                    textStyle={styles.backBtnText}
                />
                <Button
                    title="Next"
                    variant="primary"
                    onPress={handleNext}
                    style={styles.nextBtn}
                    textStyle={styles.nextBtnText}
                    disabled={disabled || !hasValidAmount}
                />
            </View>
        </Screen>
    );
};

export default memo(ShoppingPreferences);

const styles = StyleSheet.create({
    container: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    description: {
        marginVertical: 25,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    list: {
        flex: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    listItem: {
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'space-between',
        marginBottom: OFFSET.VERTICAL,
        marginRight: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
        backgroundColor: '#F3F3F380',
        borderWidth: 1,
        borderRadius: 5,
        borderColor: COLORS.DARKER_GREY,
    },
    itemName: {
        marginBottom: 10,
        color: COLORS.BLACK,
    },
    controls: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL * 2,
    },
    controlBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.WHITE,
        borderWidth: 1,
        borderColor: COLORS.DARKER_GREY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlBtnDisabled: {
        borderColor: COLORS.GREY,
    },
    amountWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 56,
    },
    amount: {
        fontSize: 36,
        fontWeight: 'bold',
        marginHorizontal: 12,
        minWidth: 48,
        textAlign: 'center',
        color: COLORS.BLUE,
    },
    amountLabel: {
        textTransform: 'uppercase',
        color: COLORS.GREY,
        textAlign: 'center',
        fontSize: 18,
    },
    buttonControl: {
        flexDirection: 'row',
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
        borderTopWidth: 1,
        borderTopColor: COLORS.LIGHT_GREY,
        marginBottom: OFFSET.VERTICAL,
    },
    backBtn: {
        flex: 1,
        marginRight: 8,
        backgroundColor: '#EBB3D1',
        borderRadius: 30,
    },
    backBtnText: {
        color: COLORS.BLACK,
        fontSize: 24,
        fontWeight: 'bold',
    },
    nextBtn: {
        flex: 1,
        marginLeft: 8,
        backgroundColor: '#B8E6B3',
        borderColor: '#00788D',
        borderRadius: 30,
    },
    nextBtnText: {
        color: '#00788D',
        fontSize: 24,
        fontWeight: 'bold',
    },
});
