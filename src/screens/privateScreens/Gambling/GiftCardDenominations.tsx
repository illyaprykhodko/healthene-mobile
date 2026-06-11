// outsource dependencies
import React, { useMemo, useState } from 'react';
import {
    View,
    FlatList,
    Platform,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import Icon from '@react-native-vector-icons/fontawesome5';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { ROUTES } from 'constants/routes';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { RootStackParamList } from 'services/navigation';
import { useGetGiftCardBrandQuery } from 'store/api/giftCardApi';
import { useGetPatientGamblingPointsQuery } from 'store/api/gamblingPointsApi';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, typeof ROUTES.GAMBLING_GIFT_CARD_DENOMINATIONS>;

const VARIABLE_PRICE_STEPS_IN_CENTS = [
    500, 1000, 1500, 2000, 2500, 5000, 7500,
    10000, 15000, 20000, 25000, 50000, 75000,
    100000, 150000, 200000,
];

const GiftCardDenominations: React.FC = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<Navigation>();
    const theme = useTheme();
    const { brandCode, brandName, imageUrl } = route.params;

    const [selectedPriceInCents, setSelectedPriceInCents] = useState<number | null>(null);

    const { data: brand, isLoading: isBrandLoading, isError } = useGetGiftCardBrandQuery(brandCode);
    const { data: availablePoints } = useGetPatientGamblingPointsQuery();

    const prices = useMemo<number[]>(() => {
        if (!brand) { return []; }
        if (!brand.variablePrice && brand.allowedPricesInCents) {
            return brand.allowedPricesInCents;
        }
        return VARIABLE_PRICE_STEPS_IN_CENTS.filter(
            cents => cents >= brand.minPriceInCents && cents <= brand.maxPriceInCents,
        );
    }, [brand]);

    const handleGetGiftCard = () => {
        if (selectedPriceInCents === null) { return; }
        navigation.navigate(ROUTES.GAMBLING_GIFT_CARD_CONFIRMATION, {
            imageUrl,
            brandCode,
            brandName,
            priceInCents: selectedPriceInCents,
        });
    };

    const renderItem = ({ item }: { item: number }) => {
        const isSelected = selectedPriceInCents === item;
        const isDisabled = availablePoints !== undefined && item > availablePoints;
        const dollars = (item / 100).toFixed(2);

        const handlePress = () => {
            if (!isDisabled) { setSelectedPriceInCents(item); }
        };

        return (
            <TouchableOpacity
                disabled={isDisabled}
                onPress={handlePress}
                activeOpacity={isDisabled ? 1 : 0.8}
                style={[
                    styles.denominationRow,
                    { borderBottomColor: theme.colors.border },
                    isSelected && styles.denominationRowSelected,
                    isDisabled && styles.denominationRowDisabled,
                ]}
            >
                <View style={[styles.checkboxBox, isSelected && styles.checkboxBoxSelected]}>
                    {isSelected && <Icon name="check" iconStyle="solid" size={22} color="#FFFFFF" />}
                </View>
                <Text
                    variant="h4"
                    style={
                        isDisabled
                            ? [styles.denominationTextDisabled, { color: theme.colors.textMuted }]
                            : isSelected
                                ? [styles.denominationText, styles.denominationTextSelected, { color: theme.colors.text }]
                                : [styles.denominationText, { color: theme.colors.textSecondary }]
                    }
                >
                    ${dollars}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderContent = () => {
        if (isBrandLoading) {
            return (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            );
        }
        if (isError || !brand) {
            return (
                <View style={styles.centered}>
                    <Text variant="h5" style={[styles.errorText, { color: theme.colors.textSecondary }]}>Failed to load denominations.</Text>
                </View>
            );
        }
        if (prices.length === 0) {
            return (
                <View style={styles.centered}>
                    <Text variant="h5" style={[styles.errorText, { color: theme.colors.textSecondary }]}>No denominations available.</Text>
                </View>
            );
        }
        return (
            <FlatList
                data={prices}
                renderItem={renderItem}
                keyExtractor={item => String(item)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        );
    };

    return (
        <Screen initialized style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.content}>
                <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                    <Text variant="h3" style={[styles.heading, { color: theme.colors.text }]}>
                    Get Gift Card
                    </Text>
                    <Text variant="h1" style={[styles.brandName, { color: theme.colors.text }]}>{brandName}</Text>
                </View>
                {renderContent()}
            </View>
            <View style={styles.footer}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, styles.shadowBtn]}
                >
                    <Text variant="h4" style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                {selectedPriceInCents !== null && (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleGetGiftCard}
                        style={[styles.getGiftCardButton, styles.shadowBtn]}
                    >
                        <Text variant="h4" style={styles.getGiftCardButtonText}>Get</Text>
                        <Text variant="h4" style={styles.getGiftCardButtonText}>Gift Card</Text>
                    </TouchableOpacity>
                )}
            </View>
        </Screen>
    );
};

export default GiftCardDenominations;

const styles = StyleSheet.create({
    container: {
        justifyContent: 'space-between',
        paddingBottom: OFFSET.VERTICAL,
    },
    content: {
        flex: 1,
        gap: 16,
    },
    heading: {
        fontWeight: '400',
        fontFamily: 'Open Sans',
        fontSize: 24,
    },
    checkboxBox: {
        width: 40,
        height: 40,
        borderRadius: 6,
        backgroundColor: '#D9D9D9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxBoxSelected: {
        backgroundColor: '#9CFD83',
        borderWidth: 2,
        borderColor: '#000000',
    },
    header: {
        paddingVertical: OFFSET.VERTICAL * 1.5,
        alignItems: 'center',
        borderBottomWidth: 1,
        gap: 8,
        marginHorizontal: OFFSET.HORIZONTAL,
    },
    brandName: {
        fontWeight: '700',
        fontFamily: 'Open Sans',
        fontSize: 40,
    },
    listContent: {
        paddingBottom: 8,
    },
    denominationRow: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: OFFSET.VERTICAL,
        borderBottomWidth: 1,
    },
    denominationRowSelected: {
        backgroundColor: '#D6EEF8',
        borderColor: '#2A7EA4',
    },
    denominationRowDisabled: {
        opacity: 0.45,
    },
    denominationText: {
        fontFamily: 'Open Sans',
        fontSize: 24,
    },
    denominationTextSelected: {
        fontWeight: '600',
    },
    denominationTextDisabled: {
        fontFamily: 'Open Sans',
        fontSize: 22,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: OFFSET.VERTICAL,
        justifyContent: 'space-between',
        marginHorizontal: OFFSET.HORIZONTAL,
    },
    backButton: {
        backgroundColor: '#FFA5A5',
        borderRadius: 8,
        minWidth: 78,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#A9A9A9',
    },
    backButtonText: {
        fontWeight: '700',
        fontFamily: 'Open Sans',
        fontSize: 24,
        lineHeight: 30,
        color: '#000',
    },
    getGiftCardButton: {
        backgroundColor: '#8EF177',
        borderRadius: 8,
        paddingVertical: 5,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#A9A9A9',
    },
    getGiftCardButtonText: {
        fontWeight: '700',
        fontFamily: 'Open Sans',
        fontSize: 18,
        lineHeight: 26,
        color: '#111111',
    },
    shadowBtn: {
        shadowColor: '#000000',
        ...Platform.select({
            ios: {
                shadowOffset: { width: 3, height: 3 },
                shadowOpacity: 0.8,
                shadowRadius: 3,
            },
            android: {
                elevation: 5,
            },
        }),
    },
});
