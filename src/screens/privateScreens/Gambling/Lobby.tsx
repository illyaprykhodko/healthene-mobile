// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/fontawesome5';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { ROUTES } from 'constants/routes';
import { OFFSET } from 'constants/offset';
import { RootStackParamList } from 'services/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const Lobby: React.FC = () => {
    const navigation = useNavigation<Navigation>();

    return (
        <Screen initialized style={styles.container}>
            <View style={styles.content}>
                <View style={styles.pointsContainer}>
                    <Icon iconStyle="solid" name="coins" size={18} color="#B57B2A" />
                    <Text variant="h4" style={styles.backButtonText}>100 points</Text>
                </View>
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.primaryAction}
                    onPress={() => navigation.navigate(ROUTES.GAMBLING_GAMES)}
                >
                    <Text variant="h3" style={styles.primaryActionText}>Play Games</Text>
                </TouchableOpacity>
                <View style={styles.horizontalRule} />
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.secondaryAction}
                    onPress={() => navigation.navigate(ROUTES.GAMBLING_CASH_OUT)}
                >
                    <Text variant="h3" style={styles.secondaryActionText}>Cash</Text>
                    <Text variant="h3" style={styles.secondaryActionText}>Out</Text>
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
                {/* <Icon iconStyle="solid" name="coins" size={18} color="#B57B2A" /> */}
            </View>
        </Screen>
    );
};

export default Lobby;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F5F5F5',
        justifyContent: 'space-between',
        padding: 16,
    },
    content: {
        marginTop: 18,
        gap: 24,
    },
    primaryAction: {
        // height: 142,
        width: '90%',
        paddingVertical: OFFSET.VERTICAL * 2.5,
        borderRadius: 6,
        borderWidth: 6,
        borderColor: '#A9A9A9',
        backgroundColor: '#8EF177',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    primaryActionText: {
        fontWeight: 700,
        fontFamily: 'Open Sans',
        color: '#111111',
        fontSize: 40,
        lineHeight: 42,
    },
    secondaryAction: {
        alignSelf: 'center',
        width: '70%',
        paddingVertical: 16,
        // height: 62,
        borderRadius: 8,
        backgroundColor: '#2A7EA4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryActionText: {
        // fontFamily: 'Outfit-Bold',
        fontWeight: 700,
        fontFamily: 'Open Sans',
        fontSize: 36,
        lineHeight: 38,
        color: '#FFFFFF',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: OFFSET.VERTICAL,
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
        // fontFamily: 'Outfit-Bold',
        fontWeight: 700,
        fontFamily: 'Open Sans',
        fontSize: 24,
        lineHeight: 30,
        color: '#000',
    },
    pointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-end',
    },
    horizontalRule: {
        height: 1,
        backgroundColor: '#000',
        // backgroundColor: '#D9D9D9',
        // marginBottom: 16,
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
