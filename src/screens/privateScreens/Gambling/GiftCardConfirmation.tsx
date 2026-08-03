// outsource dependencies
import React from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Alert, Image, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useAppSelector } from 'store';
import { ROUTES } from 'constants/routes';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { BranchBird } from 'animation/BranchBird.tsx';
import { RootStackParamList } from 'services/navigation';
import { selectBirdSoundEnabled } from 'store/slices/appSlice';
import { useClaimGiftCardMutation } from 'store/api/giftCardApi';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, typeof ROUTES.GAMBLING_GIFT_CARD_CONFIRMATION>;

const GiftCardConfirmation: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<RouteProps>();
    const theme = useTheme();
    const birdSoundEnabled = useAppSelector(selectBirdSoundEnabled);
    const { brandCode, brandName, imageUrl, priceInCents } = route.params;

    const [claimGiftCard, { isLoading }] = useClaimGiftCardMutation();

    const dollars = (priceInCents / 100).toFixed(2);

    const handleClaim = async () => {
        try {
            const result = await claimGiftCard({ brandCode, imageUrl, pointsToSpend: priceInCents }).unwrap();
            navigation.navigate(ROUTES.GAMBLING_GIFT_CARD_SUCCESS, {
                imageUrl,
                brandName,
                giftLink: result.giftLink,
            });
        } catch {
            Alert.alert('Error', 'Failed to claim gift card. Please try again.');
        }
    };

    return (
        <Screen initialized style={styles.container}>
            <BranchBird muted={!birdSoundEnabled} />
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.logoContainer}>
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.logo} resizeMode="contain" />
                    ) : (
                        <View style={[styles.logoPlaceholder, { backgroundColor: theme.colors.border }]}>
                            <Text variant="h4" style={styles.logoPlaceholderText}>{brandName[0]}</Text>
                        </View>
                    )}
                </View>
                <Text variant="h3" style={[styles.headerLabel, { color: theme.colors.textSecondary }]}>Get Gift Card</Text>
            </View>
            <View style={styles.content}>
                <Text variant="h1" style={[styles.amountText, { color: theme.colors.text }]}>
                    Get Gift Card{'\n'}${dollars}
                </Text>
                <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={isLoading}
                    onPress={handleClaim}
                    style={[styles.redeemButton, styles.shadowBtn, isLoading && styles.redeemButtonDisabled]}
                >
                    <Text variant="h4" style={styles.redeemButtonText}>
                        {isLoading ? 'Processing...' : 'Get Gift \n   Card'}
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={styles.footer}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={isLoading}
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, styles.shadowBtn]}
                >
                    <Text variant="h4" style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
            </View>
        </Screen>
    );
};

export default GiftCardConfirmation;

const styles = StyleSheet.create({
    container: {
        justifyContent: 'space-between',
        paddingBottom: OFFSET.VERTICAL,
    },
    header: {
        borderBottomWidth: 1,
        paddingBottom: OFFSET.VERTICAL,
    },
    logoContainer: {
        width: '60%',
        height: 120,
        marginLeft: OFFSET.HORIZONTAL,
    },
    logo: {
        width: '50%',
        height: '100%',
    },
    logoPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoPlaceholderText: {
        fontWeight: '700',
        fontSize: 40,
        color: '#FFFFFF',
    },
    headerLabel: {
        fontFamily: 'Open Sans',
        fontWeight: '700',
        fontSize: 24,
        marginTop: -OFFSET.VERTICAL,
        paddingLeft: OFFSET.HORIZONTAL,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
    },
    amountText: {
        fontWeight: '700',
        fontFamily: 'Open Sans',
        fontSize: 55,
        textAlign: 'center',
        lineHeight: 70,
    },
    redeemButton: {
        backgroundColor: '#9CFD83',
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: OFFSET.HORIZONTAL * 3,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#A9A9A9',
    },
    redeemButtonDisabled: {
        backgroundColor: '#C8E8C0',
    },
    redeemButtonText: {
        fontWeight: '700',
        fontFamily: 'Open Sans',
        fontSize: 24,
        lineHeight: 28,
        color: '#000000',
    },
    footer: {
        marginBottom: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    backButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFA5A5',
        borderRadius: 8,
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
