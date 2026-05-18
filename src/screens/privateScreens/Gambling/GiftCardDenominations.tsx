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
import { RootStackParamList } from 'services/navigation';
import { useGetGiftCardBrandQuery } from 'store/api/giftCardApi';
import { useGetPatientGamblingPointsQuery } from 'store/api/gamblingPointsApi';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, typeof ROUTES.GAMBLING_GIFT_CARD_DENOMINATIONS>;

// "Nice" preset steps (in cents) used when brand has variablePrice: true
const VARIABLE_PRICE_STEPS_IN_CENTS = [
    500, 1000, 1500, 2000, 2500, 5000, 7500,
    10000, 15000, 20000, 25000, 50000, 75000,
    100000, 150000, 200000,
];

const GiftCardDenominations: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<RouteProps>();
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
                    isSelected && styles.denominationRowSelected,
                    isDisabled && styles.denominationRowDisabled,
                ]}
            >
                <View style={[styles.checkboxBox, isSelected && styles.checkboxBoxSelected]}>
                    {isSelected && <Icon name="check" iconStyle="solid" size={22} color="#FFFFFF" />}
                </View>
                {/* <Icon
                    size={40}
                    iconStyle={!isSelected ? 'solid' : 'regular'}
                    name={isSelected ? 'check-square' : 'square'}
                    color={isDisabled ? '#D0D0D0' : isSelected ? '#FFFFFF' : '#A0A0A0'}
                    // color={isDisabled ? '#D0D0D0' : isSelected ? '#2A7EA4' : '#A0A0A0'}
                    style={[styles.checkboxIcon, isSelected && styles.checkboxChecked]}
                /> */}
                {/* <Checkbox
                    value={isSelected}
                    onChange={handlePress}
                    editable={!isDisabled}
                    style={styles.checkbox}
                /> */}
                <Text
                    variant="h4"
                    style={
                        isDisabled
                            ? styles.denominationTextDisabled
                            : isSelected
                                ? [styles.denominationText, styles.denominationTextSelected]
                                : styles.denominationText
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
                    <ActivityIndicator size="large" color="#2A7EA4" />
                </View>
            );
        }
        if (isError || !brand) {
            return (
                <View style={styles.centered}>
                    <Text variant="h5" style={styles.errorText}>Failed to load denominations.</Text>
                </View>
            );
        }
        if (prices.length === 0) {
            return (
                <View style={styles.centered}>
                    <Text variant="h5" style={styles.errorText}>No denominations available.</Text>
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
        <Screen initialized style={styles.container}>
            <View style={styles.content}>
                {/* Get Gift Card{'\n'}{brandName} */}
                <View style={styles.header}>
                    <Text variant="h3" style={styles.heading}>
                    Get Gift Card
                    </Text>
                    <Text variant="h1" style={styles.brandName}>{brandName}</Text>
                </View>
                {renderContent()}
            </View>
            <View style={styles.footer}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.backButton, styles.shadowBtn]}
                    onPress={() => navigation.goBack()}
                >
                    <Text variant="h4" style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                {selectedPriceInCents !== null && (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={[styles.getGiftCardButton, styles.shadowBtn]}
                        onPress={handleGetGiftCard}
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
        backgroundColor: '#F5F5F5',
        justifyContent: 'space-between',
        // padding: 16,
        paddingBottom: OFFSET.VERTICAL,
    },
    content: {
        flex: 1,
        // marginTop: 8,
        gap: 16,
    },
    heading: {
        fontWeight: '400',
        fontFamily: 'Open Sans',
        fontSize: 24,
        color: '#111111',
    },
    // checkboxIcon: {
    //     // width: 40,
    //     // height: 40,
    //     // backgroundColor: '#D9D9D9',
    //     // borderWidth: 0,
    //     // borderWidth: 0,
    // },
    // checkboxChecked: {
    //     backgroundColor: '#9CFD83',
    //     borderColor: '#000000',
    //     borderWidth: 1,
    //     // padding: 4,
    // },
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
        // marginBottom: 16,
        // paddingHorizontal: OFFSET.HORIZONTAL * 1.5,
        paddingVertical: OFFSET.VERTICAL * 1.5,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        gap: 8,
        marginHorizontal: OFFSET.HORIZONTAL,
    },
    brandName: {
        fontWeight: '700',
        fontFamily: 'Open Sans',
        fontSize: 40,
        color: '#090909',
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
        // paddingHorizontal: 12,
        // borderRadius: 6,
        // marginBottom: 4,
        // backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E1E1E1',
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
        color: '#A9A9A9',
    },
    denominationTextSelected: {
        fontWeight: '600',
        color: '#181818',
    },
    denominationTextDisabled: {
        fontFamily: 'Open Sans',
        fontSize: 22,
        color: '#BBBBBB',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: '#666666',
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
        // width: '70%',
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
