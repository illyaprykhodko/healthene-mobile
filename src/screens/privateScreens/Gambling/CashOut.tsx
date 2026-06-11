// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
// local dependencies
import Text from 'components/Text';
import { useAppSelector } from 'store';
import Screen from 'components/Screen';
import { ROUTES } from 'constants/routes';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { BranchBird } from 'animation/BranchBird';
import { RootStackParamList } from 'services/navigation';
import { selectBirdSoundEnabled } from 'store/slices/appSlice';
import { useLazyCheckGiftCardHealthQuery } from 'store/api/giftCardApi';
import { useGetPatientGamblingPointsQuery } from 'store/api/gamblingPointsApi';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const POINTS_PER_DOLLAR = 100;

const UNAVAILABILITY_MESSAGES: Record<string, string> = {
    GIFTBIT_API_UNAVAILABLE: 'We\'re sorry, but the Gift Card service is temporarily unavailable. Our team has been notified and is actively working to restore it. Please try again later.',
    INSUFFICIENT_FUNDS: 'Gift cards are temporarily unavailable at this time. Our team is aware of the issue and working to resolve it as quickly as possible. Please check back soon.',
};
const FALLBACK_UNAVAILABILITY_MESSAGE = 'We\'re sorry, but the Gift Card service is temporarily unavailable. Our team is aware of the issue and working on a fix. Please try again later.';

const CashOut: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const theme = useTheme();
    const birdSoundEnabled = useAppSelector(selectBirdSoundEnabled);
    const { data: points = 0 } = useGetPatientGamblingPointsQuery();
    const [checkHealth, { isLoading: isCheckingHealth }] = useLazyCheckGiftCardHealthQuery();

    const dollars = (points / POINTS_PER_DOLLAR).toFixed(2);

    const handleGetGiftCard = async () => {
        try {
            const status = await checkHealth(undefined, false).unwrap();
            if (!status.available) {
                const message = status.unavailabilityReason
                    ? (UNAVAILABILITY_MESSAGES[status.unavailabilityReason] ?? FALLBACK_UNAVAILABILITY_MESSAGE)
                    : FALLBACK_UNAVAILABILITY_MESSAGE;
                Alert.alert('Service Temporarily Unavailable', message);
                return;
            }
            navigation.navigate(ROUTES.GAMBLING_GIFT_CARD_LIST);
        } catch {
            Alert.alert('Connection Error', 'Unable to reach the Gift Card service. Please check your connection and try again.');
        }
    };

    const handleDonateFunds = () => {
        Alert.alert('Coming Soon', 'Donate Funds feature will be available soon.');
    };

    return (
        <Screen initialized style={styles.container}>
            <BranchBird muted={!birdSoundEnabled} />
            <View style={[styles.sectionContainer, { backgroundColor: theme.colors.muted, borderBottomColor: theme.colors.border }]}>
                <Text variant="h3" style={[styles.sectionLabel, { color: theme.colors.text }]}>Available Funds</Text>
                <Text variant="h4" style={[styles.fundsText, { color: theme.colors.text }]}>
                    {points.toLocaleString()} points — ${dollars}
                </Text>
            </View>
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={isCheckingHealth}
                    onPress={handleGetGiftCard}
                    style={[styles.actionButton, styles.giftCardButton, styles.shadowBtn]}
                >
                    {isCheckingHealth
                        ? <ActivityIndicator color="#111111" />
                        : <Text variant="h3" style={styles.actionButtonText}>Get{'\n'}Gift Card</Text>
                    }
                </TouchableOpacity>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleDonateFunds}
                    style={[styles.actionButton, styles.donateButton, styles.shadowBtn]}
                >
                    <Text variant="h3" style={styles.actionButtonText}>Donate{'\n'}Funds</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate(ROUTES.GAMBLING_GIFT_CARD_ORDERS)}
                    style={[styles.actionButton, styles.myCardsButton, styles.shadowBtn]}
                >
                    <Text variant="h3" style={styles.actionButtonText}>My{'\n'}Gift Cards</Text>
                </TouchableOpacity>
            </View>
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

export default CashOut;

const styles = StyleSheet.create({
    container: {
        justifyContent: 'space-between',
    },
    content: {
        gap: 20,
    },
    sectionLabel: {
        fontWeight: '400',
        fontFamily: 'Open Sans',
        fontSize: 30,
    },
    fundsText: {
        fontWeight: '600',
        fontFamily: 'Open Sans',
        fontSize: 20,
    },
    actionsContainer: {
        marginTop: 8,
        gap: 35,
        alignItems: 'center',
    },
    actionButton: {
        width: '55%',
        paddingVertical: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#A9A9A9',
    },
    giftCardButton: {
        backgroundColor: '#7EC8E3',
    },
    donateButton: {
        backgroundColor: '#8EF177',
    },
    myCardsButton: {
        backgroundColor: '#D9D9D9',
    },
    actionButtonText: {
        fontWeight: '700',
        fontFamily: 'Open Sans',
        fontSize: 30,
        lineHeight: 34,
        color: '#111111',
        textAlign: 'center',
    },
    footer: {
        marginBottom: OFFSET.VERTICAL + 16,
        paddingHorizontal: OFFSET.HORIZONTAL * 1.5,
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
                shadowOpacity: 0.5,
                shadowRadius: 3,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    sectionContainer: {
        gap: 8,
        borderBottomWidth: 1,
        paddingVertical: OFFSET.VERTICAL * 1.5,
        paddingHorizontal: OFFSET.HORIZONTAL * 1.5,
    },
});
