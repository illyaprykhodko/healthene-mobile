// outsource dependencies
import React from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Image, Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { ROUTES } from 'constants/routes';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { RootStackParamList } from 'services/navigation';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, typeof ROUTES.GAMBLING_GIFT_CARD_SUCCESS>;

const GiftCardSuccess: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<RouteProps>();
    const theme = useTheme();
    const { brandName, imageUrl, giftLink } = route.params;

    const handleDone = () => {
        navigation.navigate(ROUTES.GAMBLING_GIFT_CARD_ORDERS);
    };

    const handleOpenGiftCard = () => {
        Linking.openURL(giftLink);
    };

    return (
        <Screen initialized style={styles.container}>
            <View style={styles.content}>
                <Text variant="h2" style={[styles.thankYouText, { color: theme.colors.text }]}>
                    Thank You from{'\n'}{brandName}
                </Text>
                <View style={styles.logoContainer}>
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.logo} resizeMode="contain" />
                    ) : (
                        <View style={[styles.logoPlaceholder, { backgroundColor: theme.colors.border }]}>
                            <Text variant="h4" style={styles.logoPlaceholderText}>{brandName[0]}</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleOpenGiftCard}
                    style={[styles.openLinkButton, styles.shadowBtn]}
                >
                    <Text variant="h4" style={styles.openLinkButtonText}>Open Gift Card</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.footer}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleDone}
                    style={[styles.doneButton, styles.shadowBtn]}
                >
                    <Text variant="h4" style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
            </View>
        </Screen>
    );
};

export default GiftCardSuccess;

const styles = StyleSheet.create({
    container: {
        justifyContent: 'space-between',
        padding: 16,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
    },
    thankYouText: {
        fontWeight: '700',
        fontFamily: 'Open Sans',
        fontSize: 40,
        textAlign: 'center',
        lineHeight: 50,
    },
    logoContainer: {
        width: 160,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: '100%',
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
    openLinkButton: {
        backgroundColor: '#7EC8E3',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 28,
        alignItems: 'center',
    },
    openLinkButtonText: {
        fontWeight: '700',
        fontFamily: 'Open Sans',
        fontSize: 20,
        lineHeight: 26,
        color: '#111111',
    },
    footer: {
        alignItems: 'flex-end',
        marginBottom: OFFSET.VERTICAL,
    },
    doneButton: {
        backgroundColor: '#9CFD83',
        borderRadius: 8,
        minWidth: 78,
        paddingVertical: 14,
        paddingHorizontal: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#A9A9A9',
    },
    doneButtonText: {
        fontWeight: '700',
        fontFamily: 'Open Sans',
        fontSize: 24,
        lineHeight: 30,
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
