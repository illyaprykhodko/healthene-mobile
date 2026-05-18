import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Animated,
    Platform,
    Pressable,
    StyleSheet,
    Dimensions,
    PanResponder,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

import Text from 'components/Text';
import { config } from 'constants';
import Screen from 'components/Screen';
import { NestBird } from 'animation/NestBird.tsx';
import { ROUTES } from 'constants/routes';
import { OFFSET } from 'constants/offset';
import { RootStackParamList } from 'services/navigation';
import { sessionManager, TOKEN_KEYS } from 'store/api/baseApi';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type SlotRoute = RouteProp<RootStackParamList, 'GamblingSlotMachine'>;

const PanelCloseIcon = () => (
    <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
        <Rect width={30} height={30} rx={15} fill="#7F7F7F" fillOpacity={0.2} />
        {/* <Rect width={30} height={30} rx={15} fill="#3D3D3D" fillOpacity={0.5} /> */}
        <Path
            d="M9.92188 20.4531C9.79167 20.3229 9.70573 20.1719 9.66406 20C9.6224 19.8229 9.6224 19.6484 9.66406 19.4766C9.70573 19.3047 9.78906 19.1562 9.91406 19.0312L13.5781 15.3672L9.91406 11.7109C9.78906 11.5859 9.70573 11.4375 9.66406 11.2656C9.6224 11.0938 9.6224 10.9219 9.66406 10.75C9.70573 10.5729 9.79167 10.4193 9.92188 10.2891C10.0469 10.1641 10.1953 10.0807 10.3672 10.0391C10.5443 9.99219 10.7188 9.99219 10.8906 10.0391C11.0677 10.0807 11.2188 10.1615 11.3438 10.2812L15 13.9453L18.6641 10.2891C18.7891 10.1641 18.9349 10.0807 19.1016 10.0391C19.2734 9.99219 19.4453 9.99219 19.6172 10.0391C19.7943 10.0807 19.9453 10.1667 20.0703 10.2969C20.2057 10.4219 20.2943 10.5729 20.3359 10.75C20.3776 10.9219 20.3776 11.0938 20.3359 11.2656C20.2943 11.4375 20.2083 11.5859 20.0781 11.7109L16.4297 15.3672L20.0781 19.0312C20.2083 19.1562 20.2943 19.3047 20.3359 19.4766C20.3776 19.6484 20.3776 19.8229 20.3359 20C20.2943 20.1719 20.2057 20.3203 20.0703 20.4453C19.9453 20.5755 19.7943 20.6641 19.6172 20.7109C19.4453 20.7526 19.2734 20.7526 19.1016 20.7109C18.9349 20.6693 18.7891 20.5833 18.6641 20.4531L15 16.7969L11.3438 20.4609C11.2188 20.5807 11.0677 20.6641 10.8906 20.7109C10.7188 20.7526 10.5443 20.7526 10.3672 20.7109C10.1953 20.6641 10.0469 20.5781 9.92188 20.4531Z"
            fill="#7F7F7F"
            fillOpacity={0.5}
        />
        <Path
            d="M9.92188 20.4531C9.79167 20.3229 9.70573 20.1719 9.66406 20C9.6224 19.8229 9.6224 19.6484 9.66406 19.4766C9.70573 19.3047 9.78906 19.1562 9.91406 19.0312L13.5781 15.3672L9.91406 11.7109C9.78906 11.5859 9.70573 11.4375 9.66406 11.2656C9.6224 11.0938 9.6224 10.9219 9.66406 10.75C9.70573 10.5729 9.79167 10.4193 9.92188 10.2891C10.0469 10.1641 10.1953 10.0807 10.3672 10.0391C10.5443 9.99219 10.7188 9.99219 10.8906 10.0391C11.0677 10.0807 11.2188 10.1615 11.3438 10.2812L15 13.9453L18.6641 10.2891C18.7891 10.1641 18.9349 10.0807 19.1016 10.0391C19.2734 9.99219 19.4453 9.99219 19.6172 10.0391C19.7943 10.0807 19.9453 10.1667 20.0703 10.2969C20.2057 10.4219 20.2943 10.5729 20.3359 10.75C20.3776 10.9219 20.3776 11.0938 20.3359 11.2656C20.2943 11.4375 20.2083 11.5859 20.0781 11.7109L16.4297 15.3672L20.0781 19.0312C20.2083 19.1562 20.2943 19.3047 20.3359 19.4766C20.3776 19.6484 20.3776 19.8229 20.3359 20C20.2943 20.1719 20.2057 20.3203 20.0703 20.4453C19.9453 20.5755 19.7943 20.6641 19.6172 20.7109C19.4453 20.7526 19.2734 20.7526 19.1016 20.7109C18.9349 20.6693 18.7891 20.5833 18.6641 20.4531L15 16.7969L11.3438 20.4609C11.2188 20.5807 11.0677 20.6641 10.8906 20.7109C10.7188 20.7526 10.5443 20.7526 10.3672 20.7109C10.1953 20.6641 10.0469 20.5781 9.92188 20.4531Z"
            fill="#3D3D3D"
            fillOpacity={0.5}
        />
    </Svg>
);

const SlotMachine: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<SlotRoute>();
    const webViewRef = useRef<WebView>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [gameUrl, setGameUrl] = useState<string | null>(null);

    const gameType = route.params?.gameType ?? 'SLOTS';
    const title = useMemo(() => (gameType === 'BLACKJACK' ? 'Blackjack' : 'Slots'), [gameType]);
    const screenHeight = useMemo(() => Dimensions.get('window').height, []);
    const panelTranslateY = useRef(new Animated.Value(screenHeight)).current;
    const isClosingRef = useRef(false);

    const closePanel = useCallback((afterClose?: () => void) => {
        if (isClosingRef.current) { return; }
        isClosingRef.current = true;
        Animated.timing(panelTranslateY, {
            duration: 220,
            toValue: screenHeight,
            useNativeDriver: true,
        }).start(() => {
            navigation.goBack();
            if (afterClose) {
                setTimeout(afterClose, 0);
            }
        });
    }, [navigation, panelTranslateY, screenHeight]);

    useEffect(() => {
        Animated.timing(panelTranslateY, {
            toValue: 0,
            duration: 260,
            useNativeDriver: true,
        }).start();
    }, [panelTranslateY]);

    useEffect(() => {
        (async () => {
            const raw = (config.gameSlots || '').trim().replace(/^['"]|['"]$/g, '');
            if (!raw) {
                setGameUrl('');
                return;
            }
            const gamePath = gameType === 'BLACKJACK' ? '/blackjack' : '/slot-machine';
            const base = raw.replace(/\/+$/, '') + gamePath;

            const session = await sessionManager.get();
            const at = session?.[TOKEN_KEYS.ACCESS] || '';
            const rt = session?.[TOKEN_KEYS.REFRESH] || '';

            const params = new URLSearchParams();
            if (at) { params.append('at', at); }
            if (rt) { params.append('rt', rt); }
            const qs = params.toString();
            const url = qs ? `${base}?${qs}` : base;
            setGameUrl(url);
        })();
    }, [reloadKey, gameType]);

    const sendTokenToWebView = useCallback(async () => {
        try {
            const session = await sessionManager.get();
            const accessToken = session?.[TOKEN_KEYS.ACCESS];
            if (accessToken && webViewRef.current) {
                const message = JSON.stringify({ type: 'ACCESS_TOKEN', body: accessToken });
                webViewRef.current.postMessage(message);
            }
        } catch (errorObj) {
            console.warn('Failed to send token to gambling WebView:', errorObj);
        }
    }, []);

    const handleMessage = useCallback(async (event: WebViewMessageEvent) => {
        const data = event.nativeEvent.data;
        if (data === 'REFRESH_TOKEN') {
            await sendTokenToWebView();
        }
    }, [sendTokenToWebView]);

    const panelPanResponder = useMemo(() => PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
            Math.abs(gestureState.dy) > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_, gestureState) => {
            if (gestureState.dy > 0) {
                panelTranslateY.setValue(gestureState.dy);
            }
        },
        onPanResponderRelease: (_, gestureState) => {
            if (gestureState.dy > 120 || gestureState.vy > 1.2) {
                closePanel();
                return;
            }
            Animated.spring(panelTranslateY, {
                useNativeDriver: true,
                bounciness: 0,
                toValue: 0,
                speed: 16,
            }).start();
        },
    }), [closePanel, panelTranslateY]);

    if (gameUrl === null) {
        return (
            <Screen initialized style={styles.overlayScreen}>
                <View style={styles.initialLoaderOverlay}>
                    <ActivityIndicator size="large" color="#66D069" />
                    <Text variant="h6" style={styles.loaderText}>Preparing game...</Text>
                </View>
            </Screen>
        );
    }

    return (
        <Screen initialized style={styles.overlayScreen}>
            <Pressable style={styles.backdrop} onPress={() => closePanel()} />

            <Animated.View style={[styles.panelContainer, { transform: [{ translateY: panelTranslateY }] }]}>
                <View style={styles.panelCard}>
                    <View style={styles.handleTouchArea} {...panelPanResponder.panHandlers}>
                        <View style={styles.handle} />
                    </View>
                    <View style={styles.topRow}>
                        <View style={styles.topRowEdges}>
                            <NestBird />
                            <TouchableOpacity style={styles.closeButton} onPress={() => closePanel()} activeOpacity={0.85}>
                                <PanelCloseIcon />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.topRowBankOverlay} pointerEvents="box-none">
                            <TouchableOpacity
                                style={[styles.bankChip, styles.shadowBtn]}
                                onPress={() => closePanel(() => navigation.navigate(ROUTES.GAMBLING_CASH_OUT))}
                                // onPress={() => closePanel(() => navigation.navigate(ROUTES.GAMBLING_BANK))}
                                activeOpacity={0.85}
                            >
                                <Text variant="h3" style={styles.bankText}>$ Bank</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.webViewContainer}>
                        {gameUrl ? (
                            <>
                                <WebView
                                    key={reloadKey}
                                    ref={webViewRef}
                                    javaScriptEnabled
                                    domStorageEnabled
                                    startInLoadingState
                                    style={styles.webView}
                                    originWhitelist={['*']}
                                    source={{ uri: gameUrl }}
                                    allowsInlineMediaPlayback
                                    onMessage={handleMessage}
                                    mediaPlaybackRequiresUserAction={false}
                                    onLoadStart={() => {
                                        setHasError(false);
                                        setErrorMessage(null);
                                        setIsLoading(true);
                                    }}
                                    onLoadEnd={() => {
                                        setIsLoading(false);
                                    }}
                                    onError={({ nativeEvent }) => {
                                        setHasError(true);
                                        setIsLoading(false);
                                        setErrorMessage(nativeEvent?.description || 'Unknown network error');
                                    }}
                                    onHttpError={({ nativeEvent }) => {
                                        setHasError(true);
                                        setIsLoading(false);
                                        setErrorMessage(`HTTP ${nativeEvent.statusCode}`);
                                    }}
                                    renderLoading={() => (
                                        <View style={styles.loaderOverlay}>
                                            <ActivityIndicator size="large" color="#66D069" />
                                            <Text variant="h6" style={styles.loaderText}>Loading game...</Text>
                                        </View>
                                    )}
                                />
                                {isLoading && (
                                    <View style={styles.loaderOverlay}>
                                        <ActivityIndicator size="large" color="#66D069" />
                                        <Text variant="h6" style={styles.loaderText}>Loading game...</Text>
                                    </View>
                                )}
                                {hasError && (
                                    <View style={styles.errorOverlay}>
                                        <Text variant="h5" style={styles.fallbackTitle}>Unable to load game</Text>
                                        <Text variant="h6" style={styles.fallbackText}>
                                            {errorMessage || 'Please check connection and try again.'}
                                        </Text>
                                        <TouchableOpacity style={styles.retryButton} onPress={() => setReloadKey(v => v + 1)}>
                                            <Text variant="h6" style={styles.retryText}>Retry</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={styles.fallback}>
                                <Text variant="h5" style={styles.fallbackTitle}>GAME_SLOTS is not configured</Text>
                                <Text variant="h6" style={styles.fallbackText}>
                                    Add GAME_SLOTS to the environment file to open gambling content.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Animated.View>
        </Screen>
    );
};

export default SlotMachine;

const styles = StyleSheet.create({
    overlayScreen: {
        backgroundColor: 'transparent',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(7, 12, 20, 0.45)',
    },
    initialLoaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    panelContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
    },
    handleTouchArea: {
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        // marginBottom: 6,
    },
    handle: {
        width: 46,
        height: 5,
        borderRadius: 4,
        backgroundColor: '#A9A9A9',
    },
    panelCard: {
        height: '90%',
        backgroundColor: '#F4F5F7',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 8,
        paddingTop: 2,
        paddingBottom: 8,
    },
    topRow: {
        position: 'relative',
        justifyContent: 'center',
        paddingHorizontal: 6,
        paddingVertical: OFFSET.VERTICAL,
    },
    topRowEdges: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    topRowBankOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bankChip: {
        backgroundColor: '#9CFD83',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: '#7EDB83',
    },
    bankText: {
        color: '#000',
        fontSize: 24,
        fontFamily: 'Outfit',
    },
    gameTypeText: {
        flex: 1,
        color: '#333333',
        textAlign: 'center',
        fontFamily: 'Outfit-Medium',
    },
    closeButton: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
        marginTop: -OFFSET.VERTICAL,
    },
    webViewContainer: {
        flex: 1,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#3A4651',
        backgroundColor: '#131E2D',
    },
    webView: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    fallback: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(13, 27, 42, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    loaderText: {
        color: '#FFFFFF',
        fontFamily: 'Outfit-Medium',
    },
    errorOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(13, 27, 42, 0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    fallbackTitle: {
        color: '#FFFFFF',
        fontFamily: 'Outfit-Bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    fallbackText: {
        color: '#D3D3D3',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 12,
        borderRadius: 8,
        backgroundColor: '#66D069',
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    retryText: {
        color: '#0D1B2A',
        fontFamily: 'Outfit-Bold',
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
