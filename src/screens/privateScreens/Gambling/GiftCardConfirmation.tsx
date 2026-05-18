// outsource dependencies
import React from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Alert, Image, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { ROUTES } from 'constants/routes';
import { OFFSET } from 'constants/offset';
import { RootStackParamList } from 'services/navigation';
import { useClaimGiftCardMutation } from 'store/api/giftCardApi';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, typeof ROUTES.GAMBLING_GIFT_CARD_CONFIRMATION>;

const GiftCardConfirmation: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<RouteProps>();
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
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.logo} resizeMode="contain" />
                    ) : (
                        <View style={styles.logoPlaceholder}>
                            <Text variant="h4" style={styles.logoPlaceholderText}>{brandName[0]}</Text>
                        </View>
                    )}
                </View>
                <Text variant="h3" style={styles.headerLabel}>Get Gift Card</Text>
            </View>
            <View style={styles.content}>
                <Text variant="h1" style={styles.amountText}>
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
        // backgroundColor: '#F5F5F5',
        justifyContent: 'space-between',
        paddingBottom: OFFSET.VERTICAL,
    },
    header: {
        // marginTop: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: OFFSET.VERTICAL,
        // backgroundColor: '#F4F4F4',
    },
    logoContainer: {
        // justifyContent: 'flex-start',
        // alignItems: 'flex-start',
        // alignSelf: 'flex-start',
        width: '60%',
        height: 120,
        marginLeft: OFFSET.HORIZONTAL,
    },
    logo: {
        width: '50%',
        height: '100%',
        // resizeMode: 'contain',
        // resizeMode: 'cover',
    },
    logoPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: '#D0D0D0',
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
        color: '#333333',
        marginTop: -OFFSET.VERTICAL,
        paddingLeft: OFFSET.HORIZONTAL,
    },
    divider: {
        height: 1,
        backgroundColor: '#111111',
        marginTop: 12,
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
        color: '#111111',
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
        // minWidth: 78,
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
