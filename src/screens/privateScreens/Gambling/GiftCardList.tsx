// outsource dependencies
import React, { useMemo } from 'react';
import {
    View,
    Image,
    Platform,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { ROUTES } from 'constants/routes';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { RootStackParamList } from 'services/navigation';
import { GiftCardBrand, useGetGiftCardBrandsQuery } from 'store/api/giftCardApi';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const ITEM_GAP = 8;
const NUM_COLUMNS = 3;
const HORIZONTAL_PADDING = 32;

const GiftCardList: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const theme = useTheme();
    const { width: screenWidth } = useWindowDimensions();
    const { data: brands = [], isLoading, isError } = useGetGiftCardBrandsQuery();

    const itemWidth = (screenWidth - HORIZONTAL_PADDING - ITEM_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

    const paddedBrands = useMemo<(GiftCardBrand | null)[]>(() => {
        const remainder = brands.length % NUM_COLUMNS;
        if (remainder === 0) { return brands; }
        return [...brands, ...Array<null>(NUM_COLUMNS - remainder).fill(null)];
    }, [brands]);

    const handleBrandPress = (brand: GiftCardBrand) => {
        navigation.navigate(ROUTES.GAMBLING_GIFT_CARD_DENOMINATIONS, {
            brandName: brand.name,
            imageUrl: brand.imageUrl,
            brandCode: brand.brandCode,
        });
    };

    const renderItem = ({ item }: { item: GiftCardBrand | null }) => {
        if (!item) {
            return <View style={[styles.card, { width: itemWidth }]} />;
        }
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleBrandPress(item)}
                style={[
                    styles.card,
                    styles.cardActive,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, width: itemWidth },
                ]}
            >
                <View style={styles.logoContainer}>
                    {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.logo} resizeMode="contain" />
                    ) : (
                        <View style={[styles.logoPlaceholder, { backgroundColor: theme.colors.border }]} />
                    )}
                </View>
                <Text variant="h5" style={[styles.providerName, { color: theme.colors.text }]} numberOfLines={1}>
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            );
        }
        if (isError) {
            return (
                <View style={styles.centered}>
                    <Text variant="h5" style={[styles.errorText, { color: theme.colors.textSecondary }]}>Failed to load gift card brands.</Text>
                </View>
            );
        }
        if (brands.length === 0) {
            return (
                <View style={styles.centered}>
                    <Text variant="h5" style={[styles.errorText, { color: theme.colors.textSecondary }]}>No gift card brands available.</Text>
                </View>
            );
        }
        return (
            <FlatList
                data={paddedBrands}
                renderItem={renderItem}
                numColumns={NUM_COLUMNS}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                keyExtractor={(item, index) => item?.brandCode ?? `spacer-${index}`}
            />
        );
    };

    return (
        <Screen initialized style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                <Text variant="h3" style={[styles.heading, { color: theme.colors.text }]}>Get Gift Card</Text>
            </View>
            {renderContent()}
            <View style={styles.footer}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, styles.shadowBtn]}
                >
                    <Text variant="h4" style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
            </View>
        </Screen>
    );
};

export default GiftCardList;

const styles = StyleSheet.create({
    container: {
        justifyContent: 'space-between',
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    header: {
        marginBottom: 16,
        paddingHorizontal: OFFSET.HORIZONTAL * 1.5,
        paddingBottom: OFFSET.VERTICAL,
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    heading: {
        fontWeight: '400',
        fontFamily: 'Open Sans',
        fontSize: 24,
    },
    listContent: {
        paddingBottom: 8,
    },
    row: {
        gap: ITEM_GAP,
        marginBottom: ITEM_GAP,
    },
    card: {
        aspectRatio: 1,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    cardActive: {
        borderWidth: 1,
    },
    logoContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: '80%',
        height: '80%',
    },
    logoPlaceholder: {
        width: '60%',
        height: '60%',
        borderRadius: 4,
    },
    providerName: {
        fontFamily: 'Open Sans',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
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
        marginBottom: OFFSET.VERTICAL,
    },
    backButton: {
        alignSelf: 'flex-start',
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
