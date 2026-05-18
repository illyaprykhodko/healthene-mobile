// outsource dependencies
import { humanize } from 'services/filter';
import React, { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View,
    Image,
    Linking,
    FlatList,
    Platform,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { ROUTES } from 'constants/routes';
import { OFFSET } from 'constants/offset';
import { RootStackParamList } from 'services/navigation';
import { GiftCardOrder, useLazyGetGiftCardOrdersQuery } from 'store/api/giftCardApi';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const PAGE_SIZE = 12;
const COLUMN_GAP = 10;
const SEEN_ORDER_IDS_KEY = '@seenGiftCardOrderIds';

const STATUS_COLORS: Record<string, string> = {
    CANCELLED: '#EF4444',
    COMPLETED: '#22C55E',
    PENDING: '#F59E0B',
    FAILED: '#EF4444',
};

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const GiftCardOrders: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const { width: screenWidth } = useWindowDimensions();
    const tileWidth = (screenWidth - OFFSET.HORIZONTAL * 2 - COLUMN_GAP) / 2;

    const [orders, setOrders] = useState<GiftCardOrder[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [seenIds, setSeenIds] = useState<Set<number>>(new Set());
    const [isError, setIsError] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [fetchOrders, { isFetching }] = useLazyGetGiftCardOrdersQuery();

    const loadPage = useCallback(async (pageNum: number) => {
        setIsError(false);
        try {
            const result = await fetchOrders({ page: pageNum, size: PAGE_SIZE }, false).unwrap();
            setOrders(prev => (pageNum === 0 ? result.content : [...prev, ...result.content]));
            setTotalPages(result.totalPages);
            setPage(pageNum);
        } catch {
            setIsError(true);
        }
    }, [fetchOrders]);

    // Load seen IDs from AsyncStorage once on mount
    useEffect(() => {
        AsyncStorage.getItem(SEEN_ORDER_IDS_KEY).then(raw => {
            setSeenIds(raw ? new Set(JSON.parse(raw)) : new Set());
        });
    }, []);

    // [SCREEN-VISIT approach] — uncomment to mark all visible orders as seen on screen visit
    // useEffect(() => {
    //     if (orders.length === 0) { return; }
    //     AsyncStorage.getItem(SEEN_ORDER_IDS_KEY).then(raw => {
    //         const existing: number[] = raw ? JSON.parse(raw) : [];
    //         const updated = [...new Set([...existing, ...orders.map(o => o.id)])];
    //         AsyncStorage.setItem(SEEN_ORDER_IDS_KEY, JSON.stringify(updated));
    //     });
    // }, [orders.length]);

    // Refresh list every time screen gains focus (e.g., after claiming a new card)
    useFocusEffect(
        useCallback(() => {
            setOrders([]);
            setPage(0);
            setTotalPages(1);
            loadPage(0);
        }, [loadPage])
    );

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setOrders([]);
        setPage(0);
        setTotalPages(1);
        await loadPage(0);
        setIsRefreshing(false);
    };

    const handleLoadMore = () => {
        if (isFetching || page + 1 >= totalPages) { return; }
        loadPage(page + 1);
    };

    const renderTile = ({ item }: { item: GiftCardOrder }) => {
        const isNew = !seenIds.has(item.id);
        const statusColor = STATUS_COLORS[item.status] ?? '#888888';
        const dollars = (item.priceInCents / 100).toFixed(2);

        return (
            <View style={[styles.tile, { width: tileWidth }, isNew && styles.tileNew]}>
                {isNew && (
                    <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                )}
                <View style={[styles.tileImageContainer, { width: tileWidth }]}>
                    {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.tileImage} resizeMode="contain" />
                    ) : (
                        <View style={styles.tileImagePlaceholder}>
                            <Text style={styles.tileImagePlaceholderText}>{item.brandCode[0]}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.tileInfo}>
                    <Text style={styles.tileBrand} numberOfLines={1}>{humanize(item.brandCode)}</Text>
                    <Text style={styles.tileAmount}>${dollars}</Text>
                    {item.claimedAt ? (
                        <Text style={styles.tileDate}>{formatDate(item.claimedAt)}</Text>
                    ) : null}
                    {item.expiresAt ? (
                        <Text style={styles.tileExpiry}>Exp. {formatDate(item.expiresAt)}</Text>
                    ) : null}
                    <Text style={[styles.tileStatus, { color: statusColor }]}>{item.status}</Text>
                </View>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                        Linking.openURL(item.giftLink);
                        if (isNew) {
                            setSeenIds(prev => new Set([...prev, item.id]));
                            AsyncStorage.getItem(SEEN_ORDER_IDS_KEY).then(raw => {
                                const existing: number[] = raw ? JSON.parse(raw) : [];
                                AsyncStorage.setItem(SEEN_ORDER_IDS_KEY, JSON.stringify([...new Set([...existing, item.id])]));
                            });
                        }
                    }}
                    style={styles.openButton}
                >
                    <Text style={styles.openButtonText}>Open Card</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderFooterSpinner = () => {
        if (!isFetching || page === 0) { return null; }
        return (
            <View style={styles.footerSpinner}>
                <ActivityIndicator size="small" color="#2A7EA4" />
            </View>
        );
    };

    const renderContent = () => {
        if (isFetching && orders.length === 0) {
            return (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#2A7EA4" />
                </View>
            );
        }
        if (isError && orders.length === 0) {
            return (
                <View style={styles.centered}>
                    <Text variant="h5" style={styles.errorText}>Failed to load gift card orders.</Text>
                </View>
            );
        }
        if (!isFetching && orders.length === 0) {
            return (
                <View style={styles.centered}>
                    <Text variant="h5" style={styles.emptyText}>No gift cards yet.{'\n'}Redeem your points to get started!</Text>
                </View>
            );
        }
        return (
            <FlatList
                data={orders}
                numColumns={2}
                renderItem={renderTile}
                onEndReachedThreshold={0.3}
                onEndReached={handleLoadMore}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                keyExtractor={item => String(item.id)}
                ListFooterComponent={renderFooterSpinner}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        tintColor="#2A7EA4"
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                    />
                }
            />
        );
    };

    return (
        <Screen initialized style={styles.container}>
            {renderContent()}
            <View style={styles.footer}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.playGamesButton, styles.shadowBtn]}
                    onPress={() => navigation.navigate(ROUTES.GAMBLING_GAMES)}
                >
                    <Text variant="h4" style={styles.playGamesButtonText}>Play</Text>
                    <Text variant="h4" style={styles.playGamesButtonText}>Games</Text>
                </TouchableOpacity>
            </View>
        </Screen>
    );
};

export default GiftCardOrders;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F5F5F5',
        paddingBottom: OFFSET.VERTICAL,
        justifyContent: 'space-between',
    },
    listContent: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingTop: 12,
        paddingBottom: 8,
    },
    row: {
        gap: COLUMN_GAP,
        marginBottom: COLUMN_GAP,
    },
    tile: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        ...Platform.select({
            ios: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
            },
            android: { elevation: 2 },
        }),
    },
    tileNew: {
        backgroundColor: '#F0FFF4',
        borderColor: '#86EFAC',
    },
    newBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        zIndex: 1,
        backgroundColor: '#22C55E',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    newBadgeText: {
        fontFamily: 'Open Sans',
        fontWeight: '700',
        fontSize: 10,
        color: '#FFFFFF',
    },
    tileImageContainer: {
        height: 100,
        backgroundColor: '#FAFAFA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tileImage: {
        width: '90%',
        height: '90%',
    },
    tileImagePlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#D0D0D0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tileImagePlaceholderText: {
        fontWeight: '700',
        fontSize: 28,
        color: '#FFFFFF',
    },
    tileInfo: {
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 4,
        gap: 2,
    },
    tileBrand: {
        fontFamily: 'Open Sans',
        fontWeight: '600',
        fontSize: 13,
        color: '#333333',
    },
    tileAmount: {
        fontFamily: 'Open Sans',
        fontWeight: '700',
        fontSize: 16,
        color: '#111111',
    },
    tileDate: {
        fontFamily: 'Open Sans',
        fontSize: 11,
        color: '#888888',
    },
    tileExpiry: {
        fontFamily: 'Open Sans',
        fontSize: 11,
        color: '#F59E0B',
    },
    tileStatus: {
        fontFamily: 'Open Sans',
        fontWeight: '600',
        fontSize: 11,
        marginTop: 2,
    },
    openButton: {
        marginHorizontal: 8,
        marginVertical: 8,
        backgroundColor: '#7EC8E3',
        borderRadius: 6,
        paddingVertical: 6,
        alignItems: 'center',
    },
    openButtonText: {
        fontFamily: 'Open Sans',
        fontWeight: '700',
        fontSize: 12,
        color: '#111111',
    },
    footerSpinner: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    errorText: {
        color: '#666666',
        textAlign: 'center',
    },
    emptyText: {
        color: '#888888',
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        alignItems: 'flex-end',
        paddingHorizontal: OFFSET.HORIZONTAL,
        marginBottom: OFFSET.VERTICAL,
    },
    playGamesButton: {
        backgroundColor: '#8EF177',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    playGamesButtonText: {
        fontWeight: '700',
        fontFamily: 'Open Sans',
        fontSize: 20,
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
            android: { elevation: 5 },
        }),
    },
});
